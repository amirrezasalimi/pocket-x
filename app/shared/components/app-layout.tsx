"use client";

import { CollapsibleSidebar } from "@/shared/components/collapsible-sidebar";
import { useAppProvider } from "@/shared/hooks/useAppProvider";
import { useEffect } from "react";
import { Outlet } from "react-router";
import { Toaster } from "sonner";

export default function AppLayout() {
  const {
    pb,
    collections,
    selectedCollection,
    pinnedCollections,
    isLoading,
    handleSelectCollection,
    handleTogglePin,
    handleLogout,
    initPB,
  } = useAppProvider();
  useEffect(() => {
    // Initialize PocketBase and collections on mount
    initPB();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="border-gray-900 border-b-2 rounded-full w-8 h-8 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <CollapsibleSidebar
        collections={collections}
        selectedCollection={selectedCollection}
        onSelectCollection={handleSelectCollection}
        pinnedCollections={pinnedCollections}
        onTogglePin={handleTogglePin}
        pb={pb}
        onLogout={handleLogout}
      />
      <div className="flex-1 overflow-hidden">{!isLoading && <Outlet />}</div>
      <Toaster position="bottom-right" />
    </div>
  );
}
