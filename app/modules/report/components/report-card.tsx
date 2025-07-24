import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Settings, RefreshCw } from "lucide-react";
import type { ReportItem } from "@/shared/types/report";
import { useEffect, useState } from "react";
import useQueryChat from "../hooks/query-chat";
import { useAppProvider } from "@/shared/hooks/useAppProvider";
import { ReportConfigs } from "@/shared/types/report";
import ReportRenderer from "./report-renderer";

interface ReportCardProps {
  item?: ReportItem;
  onSetup?: (item: ReportItem) => void;
  isUpdating?: boolean;
}

export function ReportCard({ item, onSetup, isUpdating }: ReportCardProps) {
  const { pb } = useAppProvider();

  const hasElementType = Boolean(item?.element_type);
  const hasQuery = Boolean(item?.data_query);

  // Initialize query chat hook when we have an item with element type
  const reportConfigData = item?.element_type
    ? ReportConfigs[item.element_type as keyof typeof ReportConfigs]
    : null;

  const chat = useQueryChat({
    pb: pb!,
    reportConfigData: reportConfigData || { inputs: [] },
    collections: [], // Will be populated when loading report
    selectedReportType: item?.element_type || null,
  });

  // Load report data when item changes
  const loadReportData = async () => {
    if (item?.id && hasElementType) {
      await chat.loadReport(item.id);
    }
  };
  const itemKey = JSON.stringify(item);
  useEffect(() => {
    loadReportData();
  }, [itemKey]);

  // Handle settings click
  const handleSettingsClick = () => {
    if (item && hasElementType) {
      onSetup?.(item);
    }
  };

  // Handle refresh query
  const handleRefresh = async () => {
    if (item?.id && hasQuery) {
      await chat.runQuery(item.id);
    }
  };

  if (!item) {
    return (
      <div>
        <h2 className="font-semibold text-lg">No Report Item</h2>
      </div>
    );
  }

  return (
    <Card className="relative !gap-0 !m-0 !p-2 w-full h-full">
      {/* Loading spinner in top right */}
      {isUpdating && (
        <div className="right-4 bottom-4 z-10 absolute">
          <div className="border-2 border-muted-foreground border-t-transparent rounded-full w-4 h-4 animate-spin" />
        </div>
      )}

      {/* Settings icon - only show when there's a query */}

      <CardHeader className="!m-0 !p-0 h-6">
        <CardTitle className="flex justify-between font-medium text-muted-foreground text-sm">
          {item.title}
          {hasQuery && (
            <div className="no-drag">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="p-1 w-6 h-6"
                title="Refresh query"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSettingsClick}
                className="p-1 w-6 h-6"
                title="Open settings"
              >
                <Settings className="w-3 h-3" />
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center items-center !p-0 h-[calc(100%_-_1.5rem)]">
        {!hasElementType ? (
          <div className="flex flex-col items-center gap-2">
            <Settings className="w-8 h-8 text-muted-foreground" />
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSetup?.(item);
              }}
              className="no-drag"
            >
              Setup
            </Button>
          </div>
        ) : (
          <div className="w-full h-full">
            <ReportRenderer
              isLoading={chat.queryLoading || chat.loadingReport}
              item={{
                ...item,
                element_type: item.element_type!,
                config: chat.result?.mapping,
                cached_data: chat.result?.data,
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
