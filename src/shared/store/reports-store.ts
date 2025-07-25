import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Report } from "@/shared/types/report";

interface ReportsState {
  reports: Report[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setReports: (reports: Report[]) => void;
  addReport: (report: Report) => void;
  updateReport: (id: string, report: Partial<Report>) => void;
  removeReport: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshReports: () => Promise<void>;
}

// Global store for reports
export const useReportsStore = create<ReportsState>()(
  devtools(
    (set, get) => ({
      reports: [],
      isLoading: false,
      error: null,

      setReports: (reports) => set({ reports }),

      addReport: (report) =>
        set((state) => ({
          reports: [...state.reports, report].sort((a, b) => a.order - b.order),
        })),

      updateReport: (id, updatedReport) =>
        set((state) => ({
          reports: state.reports
            .map((report) =>
              report.id === id ? { ...report, ...updatedReport } : report
            )
            .sort((a, b) => a.order - b.order),
        })),

      removeReport: (id) =>
        set((state) => ({
          reports: state.reports.filter((report) => report.id !== id),
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      refreshReports: async () => {
        // This will be implemented by the hook that uses this store
        console.warn(
          "refreshReports not implemented in store - use the hook instead"
        );
      },
    }),
    {
      name: "reports-store",
    }
  )
);
