import { create } from "zustand";
import PocketBase, { type RecordModel } from "pocketbase";
import { LocalStorageManager } from "@/shared/utils/localStorage";
import type { Collection } from "@/shared/types/collection";

interface AppState {
  // State
  pb: PocketBase | null;
  collections: Collection[];
  selectedCollection: Collection | null;
  pinnedCollections: string[];
  isLoading: boolean;

  // Actions
  setPb: (pb: PocketBase | null) => void;
  setCollections: (collections: Collection[]) => void;
  setSelectedCollection: (collection: Collection | null) => void;
  setPinnedCollections: (pinnedCollections: string[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  handleSelectCollection: (collection: Collection) => void;
  handleTogglePin: (collectionId: string) => void;
  handleLogout: () => void;
  initializePocketBase: () => Promise<void>;
  fetchCollections: (pbInstance: PocketBase) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  pb: null,
  collections: [],
  selectedCollection: null,
  pinnedCollections: [],
  isLoading: true,

  // Actions
  setPb: (pb) => set({ pb }),
  setCollections: (collections) => set({ collections }),
  setSelectedCollection: (selectedCollection) => set({ selectedCollection }),
  setPinnedCollections: (pinnedCollections) => set({ pinnedCollections }),
  setIsLoading: (isLoading) => set({ isLoading }),

  handleSelectCollection: (collection) => {
    set({ selectedCollection: collection });
    // Note: Navigation will be handled in components using useNavigate
  },

  handleTogglePin: (collectionId) => {
    const { pinnedCollections } = get();
    const newPinned = pinnedCollections.includes(collectionId)
      ? pinnedCollections.filter((id) => id !== collectionId)
      : [...pinnedCollections, collectionId];
    set({ pinnedCollections: newPinned });
    LocalStorageManager.setPinnedCollections(newPinned);
  },

  handleLogout: () => {
    const { pb } = get();
    if (pb) {
      pb.authStore.clear();
    }
    LocalStorageManager.removeAuthData();
    LocalStorageManager.removeBaseUrl();
    set({
      pb: null,
      collections: [],
      selectedCollection: null,
      pinnedCollections: [],
      isLoading: false,
    });
    // Note: Navigation will be handled in components using useNavigate
  },

  initializePocketBase: async () => {
    try {
      const baseUrl = LocalStorageManager.getBaseUrl();
      const authData = LocalStorageManager.getAuthData();

      if (!baseUrl || !authData) {
        // Navigation will be handled in components
        return;
      }

      const pbInstance = new PocketBase(baseUrl);
      pbInstance.authStore.save(authData.token, authData.record as RecordModel);

      try {
        await pbInstance.collection("_superusers").authRefresh();
      } catch {
        // Navigation will be handled in components
        return;
      }

      pbInstance.autoCancellation(false); // Disable auto cancellation for queries
      set({ pb: pbInstance });
      await get().fetchCollections(pbInstance);
      set({ isLoading: false });
    } catch (error) {
      console.error("Error initializing PocketBase:", error);
      // Navigation will be handled in components
    }
  },

  fetchCollections: async (pbInstance) => {
    try {
      const result = await pbInstance.collections.getFullList();
      const collectionsWithIndexes = await Promise.all(
        result.map(async (collection: any) => {
          try {
            const detailedCollection = await pbInstance.collections.getOne(
              collection.id
            );
            let indexes: string[] = [];
            if (
              detailedCollection.indexes &&
              Array.isArray(detailedCollection.indexes)
            ) {
              indexes = detailedCollection.indexes;
            } else if (
              collection.indexes &&
              Array.isArray(collection.indexes)
            ) {
              indexes = collection.indexes;
            }
            // Map fields to ensure correct type
            const fields = (
              detailedCollection.fields ||
              collection.fields ||
              []
            ).map((field: any) => ({
              id: field.id,
              name: field.name,
              type: field.type,
              required: !!field.required,
              options:
                field.options && typeof field.options === "object"
                  ? field.options
                  : undefined,
            }));
            return {
              ...collection,
              indexes,
              fields,
            };
          } catch {
            return {
              ...collection,
              indexes: [],
              fields: (collection.fields || []).map((field: any) => ({
                id: field.id,
                name: field.name,
                type: field.type,
                required: !!field.required,
                options:
                  field.options && typeof field.options === "object"
                    ? field.options
                    : undefined,
              })),
            };
          }
        })
      );
      set({ collections: collectionsWithIndexes as Collection[] });
    } catch (error) {
      console.error("Error fetching collections:", error);
      set({ collections: [] });
    }
  },
}));
