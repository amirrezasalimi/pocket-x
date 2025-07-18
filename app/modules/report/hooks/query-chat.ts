import { useAI } from "@/shared/hooks/useAI";
import type { Collection } from "@/shared/types/collection";
import type { ReportConfigData, ReportType } from "@/shared/types/report";
import Pocketbase from "pocketbase";
import { useState } from "react";
import { jsonrepair } from "jsonrepair";
import { nanoid } from "nanoid";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  query?: string;
  mapping?: Record<string, any>;
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
  const [query, setQuery] = useState<string>("");
  const [result, setResult] = useState<{
    data: any;
    mapping: Record<string, any>;
  } | null>(null);
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
const query = async (pb) => {
      let data;

// format the data based on the mapping structure
return data// array or object of data
};



# Chart type
${selectedReportType}

# mapping format:

interface ChatResponse {
    "query": string, // query to be executed
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
      temperature: 0.1,
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
      };
      const code = `${parsedResponse.query}\n return query;`;
      console.log(" code:", code);

      const mapping = parsedResponse.mapping;

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
        },
      ]);
      console.log("Query:", code);
      console.log("Mapping:", mapping);
      runQuery({
        id,
        query: code,
        mapping: parsedResponse.mapping,
      });
    }
    setIsLoading(false);
  };
  const runQuery = async ({
    id,
    query,
    mapping,
  }: {
    id: string;
    query: string;
    mapping: Record<string, any>;
  }) => {
    try {
      setActiveQueryId(id);
      setQueryLoading(true);
      const queryFunction = new Function("pb", query);
      const data = await queryFunction()(pb);
      console.log("Query Result:", data);
      setResult({
        data,
        mapping,
      });
      // Handle the data as needed
    } catch (error) {
      console.error("Error executing query:", error);
    } finally {
      setQueryLoading(false);
    }
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
  };
};

export default useQueryChat;
