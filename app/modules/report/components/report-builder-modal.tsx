import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { cn } from "@/shared/lib/utils";
import { useAppProvider } from "@/shared/hooks/useAppProvider";
import {
  REPORT_TYPES,
  ReportType,
  type Report,
  type ReportConfigData,
  type ReportItem,
} from "@/shared/types/report";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/components/ui/select";
import ReportRenderer from "./report-renderer";
import { ReportConfigs } from "@/shared/types/report";
import { Combobox } from "@/shared/components/ui/combobox";
import { Loader, Settings, Settings2, Trash } from "lucide-react";
import { Textarea } from "@/shared/components/ui/textarea";
import useQueryChat from "../hooks/query-chat";
import AIChatSettings from "@/shared/components/ai-chat-settings";
import { Button } from "@/shared/components/ui/button";
import QueryEditor from "./query-editor";

type ReportBuilderModalProps = {
  item: ReportItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReportBuilderModal({
  open,
  onOpenChange,
  item,
}: ReportBuilderModalProps) {
  const { collections: allCollections, pb } = useAppProvider(); // Added pb here
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [selectedType, setSelectedType] = React.useState<string | null>(null);
  const [formState, setFormState] = React.useState<any>({});
  const [columnsByCollectionId, setColumnsByCollectionId] = React.useState<
    Record<string, string[]>
  >({});
  const [collectionNames, setCollectionNames] = React.useState<
    Record<string, string>
  >({});
  const selectedCollections = React.useMemo(() => {
    return allCollections
      ? allCollections.filter((c) => selected.includes(c.id))
      : [];
  }, [allCollections, selected]);

  const reportConfigData =
    ReportConfigs[selectedType as keyof typeof ReportConfigs];
  const chat = useQueryChat({
    pb: pb!,
    reportConfigData: reportConfigData as ReportConfigData,
    collections: selectedCollections,
    selectedReportType: (selectedType as ReportType) || null, // Default to line_chart if not set
  });

  // Helper to update form state
  const handleInputChange = (name: string, value: any) => {
    setFormState((prev: any) => ({ ...prev, [name]: value }));
  };

  // Helper for array fields
  const handleArrayChange = (
    name: string,
    idx: number,
    key: string,
    value: any
  ) => {
    setFormState((prev: any) => {
      const arr = Array.isArray(prev[name]) ? [...prev[name]] : [];
      arr[idx] = { ...arr[idx], [key]: value };
      return { ...prev, [name]: arr };
    });
  };
  const handleAddArrayItem = (name: string) => {
    // Removed items param, it's not used
    setFormState((prev: any) => {
      const arr = Array.isArray(prev[name]) ? [...prev[name]] : [];
      arr.push({});
      return { ...prev, [name]: arr };
    });
  };
  const handleRemoveArrayItem = (name: string, idx: number) => {
    setFormState((prev: any) => {
      const arr = Array.isArray(prev[name]) ? [...prev[name]] : [];
      arr.splice(idx, 1);
      return { ...prev, [name]: arr };
    });
  };

  // Use collections from app provider
  const collections = React.useMemo(() => {
    if (!allCollections) return [];
    return Array.isArray(allCollections)
      ? allCollections.map((c: any) => ({ id: c.id, name: c.name }))
      : [];
  }, [allCollections]);

  React.useEffect(() => {
    if (allCollections) {
      const namesMap: Record<string, string> = {};
      allCollections.forEach((col: any) => {
        namesMap[col.id] = col.name;
      });
      setCollectionNames(namesMap);
    }
  }, [allCollections]);

  const filtered = React.useMemo(
    () =>
      collections.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search, collections]
  );

  const handleToggle = async (id: string) => {
    setSelected((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      return next;
    });
    // If checking, fetch columns if not already loaded
    if (!selected.includes(id) && !columnsByCollectionId[id] && pb) {
      try {
        const col = await pb.collections.getOne(id);
        console.log(col, col.fields);

        if (col && Array.isArray(col.fields)) {
          setColumnsByCollectionId((prev) => ({
            ...prev,
            [id]: col.fields.map((f: any) => f.name),
          }));
        }
      } catch (e) {
        // Optionally handle error
      }
    }
  };

  // Generate options for Combobox, prefixing with collection name
  const comboboxOptions = React.useMemo(() => {
    const options: { label: string; value: string }[] = [];
    Object.entries(columnsByCollectionId).forEach(([collectionId, fields]) => {
      const collectionName = collectionNames[collectionId] || collectionId; // Use collection name or fallback to ID
      fields.forEach((field) => {
        options.push({
          label: `${collectionName}.${field}`,
          value: `${collectionName}.${field}`,
        });
      });
    });
    return options;
  }, [columnsByCollectionId, collectionNames]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex !p-0 w-full min-w-6xl h-[90vh] overflow-hidden">
        <div className="flex md:flex-row flex-col flex-1 h-full">
          {/* Left: Collection List */}
          <div className="flex flex-col bg-muted/40 border-r w-full md:w-1/3 h-1/2 md:h-full">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>Report Builder</DialogTitle>
            </DialogHeader>
            <div className="p-6 pt-2">
              <Input
                placeholder="Search collections..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-2"
              />
              <ScrollArea className="mb-4 pr-2 h-[40vh] md:h-[45vh]">
                <ul className="space-y-2">
                  {filtered.length === 0 ? (
                    <li className="text-muted-foreground text-sm">
                      No collections found.
                    </li>
                  ) : (
                    filtered.map((col) => (
                      <li
                        key={col.id}
                        className={cn(
                          "flex flex-col gap-1 hover:bg-accent p-1 rounded cursor-pointer",
                          selected.includes(col.id) && "bg-accent"
                        )}
                        onClick={() => handleToggle(col.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selected.includes(col.id)}
                            onCheckedChange={() => handleToggle(col.id)}
                            tabIndex={-1}
                            className="mr-2"
                          />
                          <span>{col.name}</span>
                        </div>
                        {selected.includes(col.id) &&
                          columnsByCollectionId[col.id] && (
                            <div className="pl-7 text-muted-foreground text-xs">
                              {columnsByCollectionId[col.id].join(", ")}
                            </div>
                          )}
                      </li>
                    ))
                  )}
                </ul>
              </ScrollArea>
              <div className="w-full max-w-md">
                <span className="block mb-2 text-muted-foreground text-sm">
                  choose type:
                </span>
                <Select
                  value={selectedType ?? undefined}
                  onValueChange={setSelectedType}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select element type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        <span className="capitalize">
                          {type.replace("_", " ")}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Render ReportConfigs inputs for selectedType */}
              {false &&
                selectedType &&
                (() => {
                  if (!reportConfigData?.inputs) return null;
                  return (
                    <div className="space-y-4 mt-6 pt-4 border-t">
                      <span className="block mb-2 text-muted-foreground text-sm">
                        Required fields
                      </span>
                      {reportConfigData.inputs.map((input) => {
                        if (input.type === "array" && input.object_schema) {
                          const arr = formState[input.name] || [];
                          return (
                            <div key={input.name} className="mb-4">
                              <label className="block mb-1 font-medium text-sm">
                                {input.label}
                              </label>
                              {arr.map((item: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 mb-2"
                                >
                                  {input.object_schema!.map((sub) => (
                                    <div key={sub.name} className="w-full">
                                      <label className="block mb-1 font-medium text-xs">
                                        {sub.name}
                                      </label>
                                      <Combobox
                                        value={item[sub.name] || ""}
                                        onChange={(value) =>
                                          handleArrayChange(
                                            input.name,
                                            idx,
                                            sub.name,
                                            value
                                          )
                                        }
                                        options={comboboxOptions} // Use generated options
                                        allowCustomValue
                                      />
                                    </div>
                                  ))}
                                  <div
                                    className="group flex justify-end px-2 pt-4 h-full text-destructive text-xs"
                                    onClick={() =>
                                      handleRemoveArrayItem(input.name, idx)
                                    }
                                  >
                                    <Trash className="group-hover:opacity-80 w-4 h-4 transition-opacity" />
                                  </div>
                                </div>
                              ))}
                              <button
                                type="button"
                                className="text-primary text-xs underline"
                                onClick={
                                  () => handleAddArrayItem(input.name) // Removed unused items param
                                }
                              >
                                Add {input.label}
                              </button>
                            </div>
                          );
                        }
                        // Simple input
                        return (
                          <div key={input.name} className="mb-4">
                            <label className="block mb-1 font-medium text-sm">
                              {input.label}
                            </label>
                            <Combobox
                              value={formState[input.name] || ""}
                              onChange={(value) =>
                                handleInputChange(input.name, value)
                              }
                              options={comboboxOptions} // Use generated options
                              allowCustomValue
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
            </div>
          </div>
          <div className="flex flex-col w-2/6 h-full">
            <div className="flex flex-col justify-between bg-neutral-50 border-r h-full">
              <div className="flex justify-between items-center bg-neutral-100 px-4 py-2">
                <span className="font-semibold text-gray-700 text-sm">
                  Query Assistant
                </span>
                <AIChatSettings>
                  <Settings className="ml-auto w-5 h-5 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer" />
                </AIChatSettings>
              </div>
              <div className="flex flex-col flex-1 space-y-3 p-2 overflow-y-auto">
                {chat.messages.length === 0 ? (
                  <div className="flex flex-col justify-center items-center w-full h-full text-center">
                    <p className="text-gray-500 text-sm">
                      Ask me anything about your report...
                    </p>
                  </div>
                ) : (
                  chat.messages.map((msg, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-3 rounded-md",
                        msg.role === "user"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      )}
                    >
                      <span className="font-semibold">
                        {msg.role === "user" ? "You: " : "AI: "}
                      </span>
                      {msg.role === "user" ? (
                        msg.content
                      ) : (
                        <div className="mt-2">
                          <Button
                            className={cn(
                              "px-3 py-1 rounded-md text-sm",
                              chat.activeQueryId === msg.id
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                            )}
                            onClick={() => {
                              chat.runQuery(msg.id || "");
                            }}
                          >
                            {chat.activeQueryId === msg.id
                              ? "Active Query"
                              : "Run Query"}
                            {chat.activeQueryId === msg.id &&
                              chat.queryLoading && (
                                <Loader className="ml-2 w-4 h-4 animate-spin" />
                              )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {chat.isLoading && (
                  <div className="flex justify-center items-center w-full h-full">
                    <div className="border-gray-900 border-b-2 rounded-full w-8 h-8 animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="px-4 py-2">
                <Textarea
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full h-10 resize-none"
                  placeholder="What would you like to see?"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      chat.sendMessage(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </div>
            </div>
          </div>
          {/* Right: Element Types Select */}
          <div className="flex flex-col p-4 w-3/6">
            <Input className="mb-2" placeholder="Report Name" />
            <span className="mb-2 text-muted-foreground text-sm">preview</span>
            {item && pb && (
              <ReportRenderer
                pb={pb}
                item={{
                  ...item,
                  element_type: selectedType as ReportType,
                  config: chat.result?.mapping,
                  cached_data: chat.result?.data,
                }}
              />
            )}
            <div className="mt-4 w-full h-full">
              <QueryEditor
                readOnly
                value={chat.activeQuery.replace("return query;", "")}
              />
            </div>
          </div>
        </div>
        <DialogClose />
      </DialogContent>
    </Dialog>
  );
}
