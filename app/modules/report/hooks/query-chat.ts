import { useAI } from "@/shared/hooks/useAI";
import type { Collection } from "@/shared/types/collection";
import type {
  FilterItem,
  ReportConfigData,
  ReportType,
} from "@/shared/types/report";
import Pocketbase from "pocketbase";
import { useState } from "react";
import { jsonrepair } from "jsonrepair";
import { nanoid } from "nanoid";
import { COLLECTIONS } from "@/shared/constants";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  query?: string;
  mapping?: Record<string, any>;
  filters?: Record<string, FilterItem>;
}

interface Options {
  pb: Pocketbase;
  collections?: Collection[];
  selectedReportType: ReportType | null;
  reportConfigData: ReportConfigData;
}

const useQueryChat = ({
  pb,
  collections,
  selectedReportType,
  reportConfigData,
}: Options) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [result, setResult] = useState<{
    data: any;
    mapping?: Record<string, any>;
    filters?: Record<string, FilterItem>;
  } | null>(null);
  const [filterValue, setFilterValue] = useState<Record<string, any>>({});
  const [queryLoading, setQueryLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const ai = useAI();

  const sendMessage = async (message: string) => {
    console.log("collections", collections);
    console.log("selectedReportType", selectedReportType);

    const collectionsDump = collections
      ?.map(
        (c) =>
          `- ${c.name}\n  Indexes: ${
            c.indexes?.join(", ") || "None"
          }\n  Fields by Type:\n  ${Object.entries(c.fields || {})
            .map(([type, field]) => `${field.name}: ${field.type}`)
            .join("\n  ")}`
      )
      .join("\n");

    const mappingStructure = reportConfigData.inputs
      .map(
        (input) => `
${
  input.type === "text"
    ? `"${input.name}": {
      "key": "...", // to
      "label": ".." // ex: ${input.label}
    },`
    : `"${input.name}": [
    {
       ${input.object_schema
         ?.map(
           (field) =>
             `"${field.name}": "..." // ${
               field.example ? `ex: ${field.example}` : ""
             }`
         )
         .join(",\n       ")}
    }, ...
]
`
}
        `
      )
      .join(",");
    const prompt = `
You're an ai assistant professional at generating queries for pocketbase.
Based on User's input, and available collections, generate query in that asked format.
Do not use getFullList, it's not optimized for large datasets. instead use getList to get count , or other needs.

# User Message:
${message}

# Available Collections And their config:
${collectionsDump}

# rules:
You must use the provided collections to generate the query.
Make sure use best combo of indexes and filters if needed or asked.
You can make complex queries, by combining multiple collections.
For some queries, you may need to call multiple collections or make multiple queries, for tasks such grouping, aggregating, or filtering data.

# Query format (es6): // pb is Pocketbase instance
const query = async (pb,filtersValues) => {
      let data;

// format the data based on the mapping structure
return data// array or object of data
};


# filters schema
interface Filters {
  [filterkey: string]: {
    label: string;
    type: "text" | "num-range" | "select" | "multi-select";
    options?: {
      value: string;
      label: string;
    }[]; // for select and multi-select
    min?: number; // for num-range
    max?: number; // for num-range

    defaultValue?: string | string[]; // default value
  };
}

# filter rules
- suggest few filters based on user prompt foe this specific query which can help.
- you can use "filtersValues" argument in query to pass filters values to the query if needed. like ( filtersValues.filterkey )
- make sure handled default values for filters, if not provided in filtersValues object.


# Chart type
${selectedReportType}


# Response schema:
interface Response {
    "query": string, // query to be executed
    "filters": {}, // filters to be applied
    "mapping": {
        ${mappingStructure}
    }
}

Response:
`;
    if (ai.loading || !ai.openAIInstance) return;

    console.log("Sending message to AI:", prompt);

    setIsLoading(true);
    const response = await ai.openAIInstance.chat.completions.create({
      messages: [
        {
          role: "system",
          content: prompt,
        },
      ],
      model: ai.aiInfo.model,
      temperature: 0.2,
      response_format: {
        type: "json_object",
      },
      reasoning_effort: "low",
      max_tokens: 2000,
    });
    const content = (response.choices[0].message.content || "")
      .replaceAll(/```json/g, "")
      .replaceAll(/```/g, "")
      .trim();

    console.log("AI Response:", content);

    if (content) {
      const repairedContent = jsonrepair(content);
      const parsedResponse = JSON.parse(repairedContent) as {
        query: string;
        mapping: Record<string, any>;
        filters?: Record<string, FilterItem>;
      };
      const code = `${parsedResponse.query}\n return query;`;
      const mapping = parsedResponse.mapping;
      const filters = parsedResponse.filters || {};

      const id = nanoid();
      setMessages((prev) => [
        ...prev,
        { role: "user", content: message },
        {
          id,
          role: "assistant",
          content: "",
          query: code,
          mapping: mapping,
          filters: filters,
        },
      ]);
      console.log("Query:", code);
      console.log("Mapping:", mapping);
      console.log("Filters:", parsedResponse.filters);

      // set default value of filters
      const defaultFilterValues: Record<string, any> = {};
      Object.entries(parsedResponse.filters || {}).forEach(([key, filter]) => {
        if (filter.defaultValue) {
          defaultFilterValues[key] = filter.defaultValue;
        }
      });
      setFilterValue(defaultFilterValues);

      await runQuery({
        id,
        query: code,
        mapping: parsedResponse.mapping,
        filters: parsedResponse.filters,
        filterDefaults: defaultFilterValues,
      });
    }
    setIsLoading(false);
  };

  const runQuery = async ({
    id,
    query,
    mapping,
    filters,
    filterDefaults = filterValue,
  }: {
    id: string;
    query: string;
    mapping: Record<string, any>;
    filters?: Record<string, FilterItem>;
    filterDefaults?: Record<string, any>;
  }) => {
    try {
      setActiveQueryId(id);
      setQueryLoading(true);
      setResult({
        data: result?.data,
        filters,
        mapping,
      });
      const queryFunction = new Function("pb", query);
      const data = await queryFunction()(pb, filterDefaults);
      console.log("Query Result:", data);
      setResult({
        data,
        mapping,
        filters,
      });
      // Handle the data as needed
    } catch (error) {
      console.error("Error executing query:", error);
    } finally {
      setQueryLoading(false);
    }
  };

  const updateFilter = (key: string, value: any) => {
    setFilterValue((prev) => ({
      ...prev,
      [key]: value,
    }));
    console.log("Updated filter:", key, value);
    // run query with updated filter
    const message = messages.find((m) => m.id === activeQueryId);
    if (message?.query && message?.mapping) {
      runQuery({
        id: message.id || "",
        query: message.query,
        mapping: message.mapping,
        filters: message.filters,
        filterDefaults: {
          ...filterValue,
          [key]: value,
        },
      });
    }
  };

  // Save the current report state to PocketBase
  const saveReport = async ({
    reportId,
    title,
    element_type,
  }: {
    reportId?: string;
    title: string;
    element_type: ReportType;
  }) => {
    if (!pb) throw new Error("PocketBase instance required");
    // Find the latest assistant message with a query
    const activeMessage = messages.find((m) => m.id === activeQueryId);

    // Save mapping, filters, filter values, and selected collections together in config
    const config = {
      mapping: activeMessage?.mapping,
      filters: activeMessage?.filters,
      filters_values: filterValue,
      selected_collections: collections?.map((c) => c.id) || [],
    };
    const data = {
      title,
      element_type,
      data_query: activeMessage?.query,
      config,
      cached_data: result?.data,
    };
    if (reportId) {
      await pb.collection(COLLECTIONS.REPORT_ITEM).update(reportId, data);
    } else {
      await pb.collection(COLLECTIONS.REPORT_ITEM).create(data);
    }
  };

  // Load a report by ID and restore chat/query/filter/collection state
  const loadReport = async (reportId: string) => {
    if (!pb) throw new Error("PocketBase instance required");
    setLoadingReport(true);
    const loaded = await pb
      .collection(COLLECTIONS.REPORT_ITEM)
      .getOne(reportId);
    // Restore chat state: create a synthetic assistant message
    const assistantMsg: Message = {
      id: loaded.id,
      role: "assistant",
      content: "",
      query: loaded.data_query,
      mapping: loaded.config?.mapping,
      filters: loaded.config?.filters,
    };
    if (assistantMsg.query) {
      setMessages([
        { role: "user", content: `Query for '${loaded.title}' chart.` },
        assistantMsg,
      ]);
      setActiveQueryId(loaded.id);
      setResult({
        data: loaded.cached_data,
        mapping: loaded.config?.mapping,
        filters: loaded.config?.filters,
      });
      // Set filter values from saved config (filters_values)
      setFilterValue(loaded.config?.filters_values || {});
    }

    setLoadingReport(false);
    // Return selected_collections for UI to use
    return {
      title: loaded.title,
      element_type: loaded.element_type,
      selectedCollections: loaded.config?.selected_collections || [],
    };
  };

  return {
    messages,
    activeQuery: messages.find((m) => m.id === activeQueryId)?.query || "",
    activeQueryId,
    runQuery: async (queryId: string) => {
      const message = messages.find((q) => q.id == queryId);
      if (message?.query && message?.mapping) {
        await runQuery({
          id: message.id || "",
          query: message.query,
          mapping: message?.mapping,
          filters: message?.filters,
        });
      }
    },
    isLoading,
    setMessages,
    setIsLoading,
    sendMessage,
    ai,
    result,
    queryLoading,
    filterValue,
    updateFilter,
    saveReport,
    loadReport,
    loadingReport,
  };
};

export default useQueryChat;
