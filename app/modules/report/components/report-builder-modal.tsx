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
  type FilterItem,
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
import { Check, Loader, Play, Settings, Trash2 } from "lucide-react";
import { Textarea } from "@/shared/components/ui/textarea";
import useQueryChat from "../hooks/query-chat";
import AIChatSettings from "@/shared/components/ai-chat-settings";
import { Button } from "@/shared/components/ui/button";
import QueryEditor from "./query-editor";
import { toast } from "sonner";
import ReportFilters from "./report-filters";

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
  const [selectedCollectionsIds, setSelectedCollectionsIds] = React.useState<
    string[]
  >([]);
  const [selectedChartType, setSelectedChartType] = React.useState<
    string | null
  >(ReportType.LINE_CHART);
  const [columnsByCollectionId, setColumnsByCollectionId] = React.useState<
    Record<string, string[]>
  >({});
  const [collectionNames, setCollectionNames] = React.useState<
    Record<string, string>
  >({});
  const [reportName, setReportName] = React.useState("");
  const _selectedCollections = React.useMemo(() => {
    return allCollections
      ? allCollections.filter((c) => selectedCollectionsIds.includes(c.id))
      : [];
  }, [allCollections, selectedCollectionsIds]);

  const reportConfigData =
    ReportConfigs[selectedChartType as keyof typeof ReportConfigs];
  const chat = useQueryChat({
    pb: pb!,
    reportConfigData: reportConfigData as ReportConfigData,
    collections: _selectedCollections,
    selectedReportType: (selectedChartType as ReportType) || null, // Default to line_chart if not set
  });

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
    setSelectedCollectionsIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      return next;
    });
    // If checking, fetch columns if not already loaded
    if (
      !selectedCollectionsIds.includes(id) &&
      !columnsByCollectionId[id] &&
      pb
    ) {
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

  const [loadReportLoading, setLoadReportLoading] = React.useState(false);
  // Load report when modal opens with an item
  React.useEffect(() => {
    if (open && item?.id) {
      chat.clearState();
      // Load report and restore selected collections
      setLoadReportLoading(true);
      chat.loadReport(item.id).then((reportInfo) => {
        setReportName(reportInfo.title || "");
        setSelectedChartType(reportInfo.element_type || ReportType.LINE_CHART);

        if (Array.isArray(reportInfo.selectedCollections)) {
          setSelectedCollectionsIds(reportInfo.selectedCollections);
        }
        setLoadReportLoading(false);
      });
    } else if (!open) {
      setReportName("");
    }
  }, [open, item]);

  const [saveReportLoading, setSaveReportLoading] = React.useState(false);
  // Save handler
  const handleSave = async () => {
    setSaveReportLoading(true);
    try {
      await chat.saveReport({
        reportId: item?.id,
        title: reportName || "Untitled Report",
        element_type: selectedChartType as ReportType,
        // selected collections are now included in config by chat hook
      });
      toast.success("Report saved successfully!");
    } catch (error) {
      toast("Failed to save report");
    }
    onOpenChange(false);
    setSaveReportLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex !p-0 w-full min-w-6xl h-[90vh] overflow-hidden">
        {/* Overlay spinner and opacity when loading */}
        <div
          className={cn(
            loadReportLoading && "opacity-60 pointer-events-none",
            "w-full h-full"
          )}
        >
          <div className="flex md:flex-row flex-col flex-1 w-full h-full">
            {/* Left: Collection List */}
            <div className="flex flex-col bg-muted/40 border-r w-full md:w-3/12 h-full md:h-full">
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
                <ScrollArea className="mb-4 pr-2 h-1/4">
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
                            selectedCollectionsIds.includes(col.id) &&
                              "bg-accent"
                          )}
                          onClick={() => handleToggle(col.id)}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedCollectionsIds.includes(col.id)}
                              onCheckedChange={() => handleToggle(col.id)}
                              tabIndex={-1}
                              className="mr-2"
                            />
                            <span>{col.name}</span>
                          </div>
                          {selectedCollectionsIds.includes(col.id) &&
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
                    value={selectedChartType ?? undefined}
                    onValueChange={setSelectedChartType}
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

                <div className="mt-4 max-w-md">
                  <span className="block mb-2 text-muted-foreground text-sm">
                    Filters (auto generated)
                  </span>
                  <div className="flex flex-col gap-2">
                    <ReportFilters
                      filters={chat.result?.filters ?? {}}
                      values={chat.filterValue}
                      onChange={(key, value) => {
                        chat.updateFilter(key, value);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Middle: Query Assistant */}

            <div className="flex flex-col w-4/12 h-full">
              <div className="flex flex-col justify-between bg-neutral-50 border-r h-full">
                <div className="flex justify-between items-center bg-neutral-100 px-4 py-2">
                  <span className="font-semibold text-gray-700 text-sm">
                    Query Assistant
                  </span>
                  <AIChatSettings
                    onStatusChange={(ok) => {
                      if (ok) {
                        chat.ai.fetchAIInfo();
                      }
                    }}
                  >
                    <Settings className="ml-auto w-5 h-5 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer" />
                  </AIChatSettings>
                </div>
                <div className="relative flex flex-col flex-1 p-2 overflow-y-auto">
                  {!chat.aiInitialized && (
                    <div className="flex justify-center items-center">
                      <p className="mb-2 text-red-500 text-sm">
                        AI is not initialized. Please check your settings.
                      </p>
                    </div>
                  )}
                  {!loadReportLoading &&
                    (chat.messages.length === 0 ? (
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
                            "flex flex-col items-start",
                            msg.role === "user"
                              ? "items-end mt-8 group"
                              : "items-start"
                          )}
                        >
                          <div
                            className={cn(
                              "relative rounded-lg text-gray-800",
                              msg.role === "user"
                                ? "bg-gray-200  p-3  text-left w-[70%]"
                                : "text-gray-800"
                            )}
                          >
                            <Trash2
                              onClick={() => chat.removeMessage(msg.id || "")}
                              className="right-2 bottom-2 absolute opacity-0 group-hover:opacity-100 w-4 h-4 text-gray-500 hover:text-gray-700 transition-opacity cursor-pointer"
                            />
                            {msg.role === "user" ? (
                              msg.content
                            ) : (
                              <div className="flex flex-col gap-2 mt-4">
                                <span className="text-sm">
                                  Here is your query:
                                </span>
                                <Button
                                  className={cn(
                                    "flex gap-2 px-3 py-1 rounded-md text-sm",
                                    chat.activeQueryId === msg.id
                                      ? "bg-blue-500 text-white hover:bg-blue-600"
                                      : "border-1 border-gray-900 bg-white text-gray-800 hover:bg-gray-300"
                                  )}
                                  onClick={() => {
                                    chat.runQuery(msg.id || "");
                                  }}
                                >
                                  <span>
                                    {chat.activeQueryId === msg.id
                                      ? "Active Query"
                                      : "Run Query"}
                                  </span>
                                  {chat.activeQueryId === msg.id &&
                                    chat.queryLoading && (
                                      <Loader className="w-4 h-4 animate-spin" />
                                    )}
                                  {!chat.queryLoading &&
                                    chat.activeQueryId === msg.id && (
                                      <Check className="w-4 h-4" />
                                    )}
                                  {chat.activeQueryId !== msg.id && (
                                    <Play className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ))}
                  {chat.isLoading && (
                    <div className="bottom-0 sticky flex justify-center items-center w-full h-32">
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
            <div className="flex flex-col gap-2 p-4 w-5/12 h-full">
              <div className="w-full h-1/2">
                <Input
                  className="mb-2"
                  placeholder="Report Name"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                />
                <div className="h-[content]">
                  {item && pb && (
                    <ReportRenderer
                      isLoading={chat.queryLoading}
                      item={{
                        ...item,
                        element_type: selectedChartType as ReportType,
                        config: {
                          filters: chat.result?.filters || {},
                          filters_values: chat.filterValue || {},
                          mapping: chat.result?.mapping || {},
                        },
                        cached_data: chat.result?.data,
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="w-full h-1/2">
                <div className="h-5/6">
                  <QueryEditor
                    readOnly
                    value={chat.activeQuery.replace("return query;", "")}
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <Button disabled={saveReportLoading} onClick={handleSave}>
                    Save Report
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {loadReportLoading && (
          <div className="z-50 absolute inset-0 flex justify-center items-center">
            <Loader className="w-12 h-12 text-gray-700 animate-spin" />
          </div>
        )}
        <DialogClose />
      </DialogContent>
    </Dialog>
  );
}
