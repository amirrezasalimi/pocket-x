import { useParams } from "react-router";
import { useCallback, useRef, useState } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { useAppStore } from "@/shared/store/app-store";
import { useReport } from "./hooks/useReport";
import { useReportItems } from "./hooks/useReportItems";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { AddReportItemDialog } from "./components/add-report-item-dialog";
import { ReportCard } from "./components/report-card";
import { ReportBuilderModal } from "./components/report-builder-modal";
import AIChatSettings from "@/shared/components/ai-chat-settings";
import type { ReportItem } from "@/shared/types/report";
import type { Layout } from "react-grid-layout";

const ResponsiveGridLayout = WidthProvider(Responsive);

const Report = () => {
  const { id } = useParams();
  const { pb, isLoading: appLoading } = useAppStore();

  const { report, isLoading: reportLoading, error } = useReport(pb, id);
  const {
    reportItems,
    isLoading: itemsLoading,
    updatingItemIds,
    createReportItem,
    updateReportItemLayout,
  } = useReportItems(pb, id);

  const prevLayoutRef = useRef<Layout | null>(null);
  const [builderItem, setBuilderItem] = useState<ReportItem | null>(null);

  const onResizeStart = useCallback(
    (
      layout: Layout[],
      oldItem: Layout,
      newItem: Layout,
      placeholder: Layout,
      e: MouseEvent,
      element: HTMLElement
    ) => {
      prevLayoutRef.current = { ...newItem };
    },
    []
  );

  const onResizeStop = useCallback(
    (
      layout: Layout[],
      oldItem: Layout,
      newItem: Layout,
      placeholder: Layout,
      e: MouseEvent,
      element: HTMLElement
    ) => {
      const reportItem = reportItems.find((item) => item.id === newItem.i);
      if (!reportItem) return;

      const newLayout = {
        w: newItem.w,
        h: newItem.h,
        x: newItem.x,
        y: newItem.y,
      };

      const prevLayout = prevLayoutRef.current;
      prevLayoutRef.current = null;

      if (
        !prevLayout ||
        prevLayout.w !== newLayout.w ||
        prevLayout.h !== newLayout.h ||
        prevLayout.x !== newLayout.x ||
        prevLayout.y !== newLayout.y
      ) {
        updateReportItemLayout(reportItem.id, newLayout);
      }
    },
    [reportItems, updateReportItemLayout]
  );

  const onDragStop = useCallback(
    (
      layout: Layout[],
      oldItem: Layout,
      newItem: Layout,
      placeholder: Layout,
      e: MouseEvent,
      element: HTMLElement
    ) => {
      const reportItem = reportItems.find((item) => item.id === newItem.i);
      if (!reportItem) return;

      const newLayout = {
        w: newItem.w,
        h: newItem.h,
        x: newItem.x,
        y: newItem.y,
      };

      const curr = reportItem.layout;
      if (curr.x !== newLayout.x || curr.y !== newLayout.y) {
        updateReportItemLayout(reportItem.id, newLayout);
      }
    },
    [reportItems, updateReportItemLayout]
  );

  // Show loading if app is still loading OR if report is loading
  if (appLoading || reportLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="w-64 h-8" />
        <Skeleton className="w-full h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Error loading report: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>Report not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleAddItem = async (title: string) => {
    await createReportItem(title);
  };

  const handleSetupItem = (item: ReportItem) => {
    setBuilderItem(item);
    console.log("ReportBuilderModal rendered", item);
  };

  // Convert report items to grid layout format
  const layouts = {
    lg: reportItems.map((item) => ({
      i: item.id,
      x: item.layout.x,
      y: item.layout.y,
      w: item.layout.w,
      h: item.layout.h,
      minW: 1,
      minH: 1,
    })),
  };

  return (
    <div className="p-6 h-[100vh] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-1 justify-between mr-4">
          <div className="flex items-center gap-2">
            <span
              className="inline-block rounded-full w-2 h-2"
              style={{ background: report.color }}
            />
            <h1 className="font-bold text-lg">{report.title}</h1>
          </div>

          {/* Add button in top right */}
          <AddReportItemDialog
            onAddItem={handleAddItem}
            isLoading={itemsLoading}
          />
        </div>
      </div>

      {/* Grid Layout */}
      <div className="min-h-[600px]">
        {itemsLoading ? (
          <div className="gap-4 grid grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        ) : reportItems.length === 0 ? (
          <div className="flex justify-center items-center border-2 border-muted-foreground/25 border-dashed rounded-lg h-48">
            <div className="text-center">
              <p className="mb-2 text-muted-foreground">No report items yet</p>
              <AddReportItemDialog
                onAddItem={handleAddItem}
                isLoading={itemsLoading}
              />
            </div>
          </div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 6, md: 6, sm: 4, xs: 2, xxs: 1 }}
            rowHeight={100}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            isDraggable={true}
            isResizable={true}
            onResizeStart={onResizeStart}
            onResizeStop={onResizeStop}
            onDragStop={onDragStop}
            draggableCancel=".no-drag"
          >
            {reportItems.map((item) => (
              <div key={item.id} className="grid-item p-1">
                <ReportCard
                  item={item}
                  onSetup={handleSetupItem}
                  isUpdating={updatingItemIds.includes(item.id)}
                />
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </div>
      {/* Report Builder Modal */}
      <ReportBuilderModal
        item={builderItem}
        open={builderItem !== null}
        onOpenChange={(open) => {
          if (!open) setBuilderItem(null);
        }}
      />
    </div>
  );
};

export default Report;
