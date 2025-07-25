import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import type { Report } from "@/shared/types/report";
import { useReportsStoreHook } from "src/shared/hooks/report-store-hook";
import { useAppProvider } from "@/shared/hooks/useAppProvider";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report?: Report;
  onSave: (data: Partial<Report>) => Promise<void>;
}

export function ReportDialog({
  open,
  onOpenChange,
  report,
  onSave,
}: ReportDialogProps) {
  const [title, setTitle] = useState(report?.title || "");
  const [color, setColor] = useState(report?.color || "#3b82f6");
  const [isLoading, setIsLoading] = useState(false);
  const { pb } = useAppProvider();
  const reportStore = useReportsStoreHook(pb);

  // Sync state with report prop when it changes
  useEffect(() => {
    setTitle(report?.title || "");
    setColor(report?.color || "#3b82f6");
  }, [report]);

  const handleSave = async () => {
    if (!title.trim()) return;

    try {
      setIsLoading(true);
      await onSave({ title: title.trim(), color });
      onOpenChange(false);
      setTitle("");
      setColor("#3b82f6");
      reportStore.refetch();
    } catch (error) {
      console.error("Error saving report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTitle(report?.title || "");
    setColor(report?.color || "#3b82f6");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {report ? "Edit Report" : "Create New Report"}
          </DialogTitle>
        </DialogHeader>
        <div className="gap-4 grid py-4">
          <div className="items-center gap-4 grid grid-cols-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
              placeholder="Enter report title"
            />
          </div>
          <div className="items-center gap-4 grid grid-cols-4">
            <Label htmlFor="color" className="text-right">
              Color
            </Label>
            <div className="flex items-center gap-2 col-span-3">
              <input
                type="color"
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="border border-input rounded w-12 h-9 cursor-pointer"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1"
                placeholder="#3b82f6"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
