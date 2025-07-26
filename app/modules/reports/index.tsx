import { useState } from "react";
import { useAppProvider } from "@/shared/hooks/useAppProvider";
import { useSetupStatus } from "@/shared/hooks/useSetupStatus";
import { useReports } from "./hooks/reports";
import { ReportDialog } from "./components/report-dialog";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { SetupPocketX } from "@/shared/components/setup-pocket-x";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import type { Report } from "@/shared/types/report";
import { Plus, Edit2, Trash2, GripVertical } from "lucide-react";
import { useReportsStoreHook } from "src/shared/hooks/report-store-hook";

export default function ReportsPage() {
  const { pb } = useAppProvider();
  const { isSetup, isChecking } = useSetupStatus(pb);
  const {
    reports,
    isLoading,
    error,
    createReport,
    updateReport,
    deleteReport,
    reorderReports,
  } = useReportsStoreHook(pb);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | undefined>();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (isChecking) {
    return (
      <div className="mx-auto p-6 container">
        <div className="space-y-4">
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-full h-64" />
        </div>
      </div>
    );
  }

  if (!isSetup) {
    return (
      <div className="mx-auto p-6 container">
        <SetupPocketX pb={pb!} />
      </div>
    );
  }

  const handleCreateReport = () => {
    setEditingReport(undefined);
    setDialogOpen(true);
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setDialogOpen(true);
  };

  const handleSaveReport = async (data: Partial<Report>) => {
    if (editingReport) {
      await updateReport(editingReport.id, data);
    } else {
      await createReport(data);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (confirm("Are you sure you want to delete this report?")) {
      await deleteReport(id);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const reorderedReports = [...reports];
    const [draggedReport] = reorderedReports.splice(draggedIndex, 1);
    reorderedReports.splice(dropIndex, 0, draggedReport);

    setDraggedIndex(null);
    await reorderReports(reorderedReports);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="mx-auto p-6 container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-bold text-3xl">Reports</h1>
          <p className="text-muted-foreground">
            Manage your reports and dashboards
          </p>
        </div>
        <Button onClick={handleCreateReport}>
          <Plus className="mr-2 w-4 h-4" />
          Add Report
        </Button>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="w-full h-12" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="py-8 text-center">
              <p className="mb-4 text-muted-foreground">No reports found</p>
              <Button onClick={handleCreateReport} variant="outline">
                <Plus className="mr-2 w-4 h-4" />
                Create your first report
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report, index) => (
                  <TableRow
                    key={report.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`cursor-move ${
                      draggedIndex === index ? "opacity-50" : ""
                    }`}
                  >
                    <TableCell>
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="font-medium">
                      {report.title}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="border rounded w-4 h-4"
                          style={{ backgroundColor: report.color }}
                        />
                        <span className="text-muted-foreground text-sm">
                          {report.color}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{report.order}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(report.created)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditReport(report)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReport(report.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ReportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        report={editingReport}
        onSave={handleSaveReport}
      />
    </div>
  );
}
