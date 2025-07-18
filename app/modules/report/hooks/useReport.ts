import { useState, useEffect } from "react";
import PocketBase from "pocketbase";
import { COLLECTIONS } from "@/shared/constants";
import type { Report } from "@/shared/types/report";

export function useReport(pb: PocketBase | null, reportId: string | undefined) {
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    if (!pb || !reportId) return;

    try {
      setIsLoading(true);
      setError(null);
      const record = await pb.collection(COLLECTIONS.REPORTS).getOne(reportId);
      setReport(record as unknown as Report);
    } catch (err) {
      console.error("Error fetching report:", err);
      setError("Failed to fetch report");
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (pb && reportId) {
      fetchReport();
    } else {
      // Reset state when pb or reportId becomes null/undefined
      setReport(null);
      setIsLoading(false);
      setError(null);
    }
  }, [pb, reportId]);

  return {
    report,
    isLoading,
    error,
    refetch: fetchReport,
  };
}
