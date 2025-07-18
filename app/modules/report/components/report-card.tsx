import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Settings } from "lucide-react";
import type { ReportItem } from "@/shared/types/report";

interface ReportCardProps {
  item?: ReportItem;
  onSetup?: (item: ReportItem) => void;
  isUpdating?: boolean;
}

export function ReportCard({ item, onSetup, isUpdating }: ReportCardProps) {
  const hasElementType = Boolean(item?.element_type);

  if (!item) {
    return (
      <div>
        <h2 className="font-semibold text-lg">No Report Item</h2>
      </div>
    );
  }

  return (
    <Card className="relative w-full h-full">
      {/* Loading spinner in top right */}
      {isUpdating && (
        <div className="top-2 right-2 z-10 absolute">
          <div className="border-2 border-muted-foreground border-t-transparent rounded-full w-4 h-4 animate-spin" />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="font-medium text-muted-foreground text-sm">
          {item.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center items-center h-full">
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
          <div className="flex justify-center items-center w-full h-full text-muted-foreground">
            {/* Placeholder for actual element content */}
            <div className="text-center">
              <div className="font-medium">{item.element_type}</div>
              <div className="text-xs">Element content will go here</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
