import { useNavigate } from "react-router";
import { useAppStore } from "@/shared/store/app-store";
import { LocalStorageManager } from "@/shared/utils/localStorage";

export function useAppProvider() {
  const navigate = useNavigate();
  const store = useAppStore();

  const initPB = () => {
    // Initialize pinned collections from localStorage
    store.setPinnedCollections(LocalStorageManager.getPinnedCollections());

    // Initialize PocketBase
    store
      .initializePocketBase()
      .then(() => {
        // Handle navigation after initialization
        const baseUrl = LocalStorageManager.getBaseUrl();
        const authData = LocalStorageManager.getAuthData();

        if (!baseUrl || !authData) {
          navigate("/");
        }
      })
      .catch(() => {
        navigate("/");
      })
      .finally(() => {
        store.setIsLoading(false);
      });
  };
  // Enhanced handlers that include navigation
  const handleSelectCollection = (collection: any) => {
    store.handleSelectCollection(collection);
    navigate(`/c/${collection.name}`);
  };

  const handleLogout = () => {
    store.handleLogout();
    navigate("/");
  };

  return {
    ...store,
    handleSelectCollection,
    handleLogout,
    initPB,
  };
}
