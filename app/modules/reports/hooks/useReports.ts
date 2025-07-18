import { useState, useEffect } from "react";
import PocketBase from "pocketbase";
import { COLLECTIONS } from "@/shared/constants";
import type { Report } from "@/shared/types/report";

export function useReports(pb: PocketBase | null) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Start with false instead of true
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    if (!pb) return;

    try {
      setIsLoading(true);
      setError(null);
      const records = await pb.collection(COLLECTIONS.REPORTS).getFullList({
        sort: "order,created",
      });
      setReports(records as unknown as Report[]);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to fetch reports");
    } finally {
      setIsLoading(false);
    }
  };

  const createReport = async (data: Partial<Report>) => {
    if (!pb) return;

    try {
      // Get the highest order number and add 1
      const maxOrder = reports.reduce(
        (max, report) => Math.max(max, report.order || 0),
        0
      );

      const record = await pb.collection(COLLECTIONS.REPORTS).create({
        title: data.title || "New Report",
        order: maxOrder + 1,
        color: data.color || "#3b82f6",
      });

      setReports((prev) =>
        [...prev, record as unknown as Report].sort((a, b) => a.order - b.order)
      );
      return record as unknown as Report;
    } catch (err) {
      console.error("Error creating report:", err);
      setError("Failed to create report");
      throw err;
    }
  };

  const updateReport = async (id: string, data: Partial<Report>) => {
    if (!pb) return;

    try {
      const record = await pb.collection(COLLECTIONS.REPORTS).update(id, data);
      setReports((prev) =>
        prev
          .map((r) => (r.id === id ? (record as unknown as Report) : r))
          .sort((a, b) => a.order - b.order)
      );
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
      setReports((prev) => prev.filter((r) => r.id !== id));
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

  useEffect(() => {
    if (pb) {
      fetchReports();
    } else {
      // Reset state when pb becomes null
      setReports([]);
      setIsLoading(false);
      setError(null);
    }
  }, [pb]);

  return {
    reports,
    isLoading,
    error,
    createReport,
    updateReport,
    deleteReport,
    reorderReports,
    refetch: fetchReports,
  };
}
