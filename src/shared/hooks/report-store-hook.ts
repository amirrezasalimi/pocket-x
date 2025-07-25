import { useEffect } from "react";
import PocketBase from "pocketbase";
import { COLLECTIONS } from "@/shared/constants";
import type { Report } from "@/shared/types/report";
import { useReportsStore } from "../store/reports-store";

export function useReportsStoreHook(pb: PocketBase | null) {
  const {
    reports,
    isLoading,
    error,
    setReports,
    addReport,
    updateReport,
    removeReport,
    setLoading,
    setError,
  } = useReportsStore();

  const fetchReports = async () => {
    if (!pb) return;

    try {
      setLoading(true);
      setError(null);

      const records = await pb.collection(COLLECTIONS.REPORTS).getFullList({
        sort: "order,created",
      });

      setReports(records as unknown as Report[]);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const createReport = async (data: Partial<Report>) => {
    if (!pb) return;

    try {
      // Get the highest order number and add 1
      const maxOrder = reports.reduce(
        (max: number, report: Report) => Math.max(max, report.order || 0),
        0
      );

      const record = await pb.collection(COLLECTIONS.REPORTS).create({
        title: data.title || "New Report",
        order: maxOrder + 1,
        color: data.color || "#3b82f6",
      });

      addReport(record as unknown as Report);
      return record as unknown as Report;
    } catch (err) {
      console.error("Error creating report:", err);
      setError("Failed to create report");
      throw err;
    }
  };

  const updateReportData = async (id: string, data: Partial<Report>) => {
    if (!pb) return;

    try {
      const record = await pb.collection(COLLECTIONS.REPORTS).update(id, data);
      updateReport(id, record as unknown as Report);
      return record as unknown as Report;
    } catch (err) {
      console.error("Error updating report:", err);
      setError("Failed to update report");
      throw err;
    }
  };

  const deleteReport = async (id: string) => {
    if (!pb) return;

    try {
      await pb.collection(COLLECTIONS.REPORTS).delete(id);
      removeReport(id);
    } catch (err) {
      console.error("Error deleting report:", err);
      setError("Failed to delete report");
      throw err;
    }
  };

  const reorderReports = async (reorderedReports: Report[]) => {
    if (!pb) return;

    try {
      // Update order for each report
      const promises = reorderedReports.map((report, index) =>
        pb
          .collection(COLLECTIONS.REPORTS)
          .update(report.id, { order: index + 1 })
      );

      await Promise.all(promises);

      // Update local state with new order
      setReports(
        reorderedReports.map((report, index) => ({
          ...report,
          order: index + 1,
        }))
      );
    } catch (err) {
      console.error("Error reordering reports:", err);
      setError("Failed to reorder reports");
      throw err;
    }
  };

  return {
    reports,
    isLoading,
    error,
    createReport,
    updateReport: updateReportData,
    deleteReport,
    reorderReports,
    refetch: fetchReports,
  };
}
