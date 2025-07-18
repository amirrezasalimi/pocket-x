import { useState, useEffect, useCallback, useRef } from "react";
import PocketBase from "pocketbase";
import { COLLECTIONS } from "@/shared/constants";
import type { ReportItem } from "@/shared/types/report";

// Debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function useReportItems(
  pb: PocketBase | null,
  reportId: string | undefined
) {
  const [reportItems, setReportItems] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingItemIds, setUpdatingItemIds] = useState<string[]>([]);

  // Store pending updates
  const pendingUpdates = useRef<
    Map<string, { w: number; h: number; x: number; y: number }>
  >(new Map());
  const updateTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const fetchReportItems = async () => {
    if (!pb || !reportId) return;

    try {
      setIsLoading(true);
      setError(null);
      const records = await pb.collection(COLLECTIONS.REPORT_ITEM).getFullList({
        filter: `report = "${reportId}"`,
        sort: "order",
      });

      const items = records.map((record) => ({
        title: record.title || "Untitled",
        order: record.order || 0,
        report: record.report || "",
        created: record.created || new Date().toISOString(),
        updated: record.updated || new Date().toISOString(),
        layout: record.layout || { w: 3, h: 2, x: 0, y: 0 },
        id: record.id,
        collectionId: record.collectionId,
        collectionName: record.collectionName,
        expand: record.expand,
      })) as ReportItem[];

      setReportItems(items);
    } catch (err) {
      console.error("Error fetching report items:", err);
      setError("Failed to fetch report items");
      setReportItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createReportItem = async (title: string) => {
    if (!pb || !reportId) return;

    try {
      const maxOrder = Math.max(...reportItems.map((item) => item.order), 0);
      const newItem = await pb.collection(COLLECTIONS.REPORT_ITEM).create({
        title,
        report: reportId,
        order: maxOrder + 1,
        layout: { w: 3, h: 2, x: 0, y: 0 },
      });

      const item = {
        title: newItem.title || "Untitled",
        order: newItem.order || 0,
        report: newItem.report || "",
        created: newItem.created || new Date().toISOString(),
        updated: newItem.updated || new Date().toISOString(),
        layout: newItem.layout || { w: 3, h: 2, x: 0, y: 0 },
        id: newItem.id,
        collectionId: newItem.collectionId,
        collectionName: newItem.collectionName,
        expand: newItem.expand,
      } as ReportItem;
      setReportItems((prev) => [...prev, item]);
      return item;
    } catch (err) {
      console.error("Error creating report item:", err);
      throw new Error("Failed to create report item");
    }
  };

  const updateReportItemLayout = useCallback(
    async (
      itemId: string,
      layout: { w: number; h: number; x: number; y: number }
    ) => {
      if (!pb) return;

      try {
        await pb.collection(COLLECTIONS.REPORT_ITEM).update(itemId, {
          size: layout,
        });
      } catch (err) {
        console.error("Error updating report item layout:", err);
      }
    },
    [pb]
  );

  // Debounced update function that handles individual items correctly
  const debouncedUpdateLayout = useCallback(
    (
      itemId: string,
      layout: { w: number; h: number; x: number; y: number }
    ) => {
      // Add to updating list immediately
      setUpdatingItemIds((prev) =>
        prev.includes(itemId) ? prev : [...prev, itemId]
      );

      // Store the latest layout for this item
      pendingUpdates.current.set(itemId, layout);

      // Clear existing timeout for this item
      const existingTimeout = updateTimeouts.current.get(itemId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout for this specific item
      const timeout = setTimeout(async () => {
        const latestLayout = pendingUpdates.current.get(itemId);
        if (latestLayout) {
          try {
            await updateReportItemLayout(itemId, latestLayout);
          } finally {
            // Clean up
            pendingUpdates.current.delete(itemId);
            updateTimeouts.current.delete(itemId);
            setUpdatingItemIds((prev) => prev.filter((id) => id !== itemId));
          }
        }
      }, 500);

      updateTimeouts.current.set(itemId, timeout);
    },
    [updateReportItemLayout]
  );

  const updateReportItemsOrder = async (items: ReportItem[]) => {
    if (!pb) return;

    try {
      const updates = items.map((item, index) =>
        pb.collection(COLLECTIONS.REPORT_ITEM).update(item.id, { order: index })
      );
      await Promise.all(updates);
      setReportItems(items);
    } catch (err) {
      console.error("Error updating report items order:", err);
    }
  };

  useEffect(() => {
    if (pb && reportId) {
      fetchReportItems();
    } else {
      setReportItems([]);
      setIsLoading(false);
      setError(null);
    }
  }, [pb, reportId]);

  return {
    reportItems,
    isLoading,
    error,
    updatingItemIds,
    createReportItem,
    updateReportItemLayout: debouncedUpdateLayout,
    updateReportItemsOrder,
    refetch: fetchReportItems,
  };
}
