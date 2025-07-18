"use client";

import { useState, useEffect } from "react";
import {
  Database,
  Table,
  Users,
  Eye,
  ChevronLeft,
  ChevronRight,
  Pin,
  PinOff,
  Home,
  LogOut,
  BarChart3,
  FileText,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { cn } from "@/shared/lib/utils";
import PocketBase from "pocketbase";
import { useLocation, useNavigate } from "react-router";
import { SetupPocketBasePlus } from "@/shared/components/setup-pocketbase-plus";
import { useSetupStatus } from "@/shared/hooks/useSetupStatus";
import { useReports } from "@/modules/reports/hooks/useReports";
import type { Collection } from "../types/collection";

interface CollapsibleSidebarProps {
  collections: Collection[];
  selectedCollection: Collection | null;
  onSelectCollection: (collection: Collection) => void;
  pinnedCollections: string[];
  onTogglePin: (collectionId: string) => void;
  pb?: PocketBase | null;
  onLogout: () => void;
}

export function CollapsibleSidebar({
  collections,
  onSelectCollection,
  pinnedCollections,
  onTogglePin,
  pb,
  onLogout,
}: CollapsibleSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSystemCollapsed, setIsSystemCollapsed] = useState(true);
  const nav = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { isSetup, recheckSetup } = useSetupStatus(pb as PocketBase);
  const { reports } = useReports(pb);

  const getCollectionIcon = (type: string) => {
    switch (type) {
      case "auth":
        return Users;
      case "view":
        return Eye;
      case "base":
      default:
        return Table;
    }
  };

  const getCollectionsByType = (type: string, isSystem = false) => {
    return collections.filter((collection) => {
      const matchesType = collection.type === type;
      const isSystemCollection = collection.name.startsWith("_");
      return (
        matchesType && (isSystem ? isSystemCollection : !isSystemCollection)
      );
    });
  };

  const sortCollections = (collections: Collection[]) => {
    return collections.sort((a, b) => {
      const aPinned = pinnedCollections.includes(a.id);
      const bPinned = pinnedCollections.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return a.name.localeCompare(b.name);
    });
  };

  // Regular collections (not starting with _)
  const authCollections = sortCollections(getCollectionsByType("auth", false));
  const baseCollections = sortCollections(getCollectionsByType("base", false));
  const viewCollections = sortCollections(getCollectionsByType("view", false));

  // System collections (starting with _)
  const systemAuthCollections = sortCollections(
    getCollectionsByType("auth", true)
  );
  const systemBaseCollections = sortCollections(
    getCollectionsByType("base", true)
  );
  const systemViewCollections = sortCollections(
    getCollectionsByType("view", true)
  );
  const allSystemCollections = [
    ...systemAuthCollections,
    ...systemBaseCollections,
    ...systemViewCollections,
  ];

  const isDashboardActive = pathname === "/dashboard";
  const isReportsActive = pathname === "/reports";

  const renderCollectionButton = (collection: Collection) => {
    const Icon = getCollectionIcon(collection.type);
    const isPinned = pinnedCollections.includes(collection.id);
    const isActive = pathname === `/c/${collection.name}`;

    if (isCollapsed) {
      return (
        <Button
          key={collection.id}
          variant={isActive ? "default" : "ghost"}
          size="sm"
          className="p-1 w-full h-8 font-mono text-xs"
          onClick={() => {
            onSelectCollection(collection);
            nav(`/c/${collection.name}`);
          }}
          title={collection.name}
        >
          {collection.name.slice(0, 2).toUpperCase()}
        </Button>
      );
    }

    return (
      <div key={collection.id} className="group flex items-center gap-1">
        <Button
          variant={isActive ? "default" : "ghost"}
          className="flex-1 justify-start px-4 h-8 text-xs"
          onClick={() => {
            onSelectCollection(collection);
            nav(`/c/${collection.name}`);
          }}
        >
          {/* <Icon className="mr-2 w-3 h-3 shrink-0" /> */}
          <span className="truncate">{collection.name}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`p-0 w-6 h-6 transition-opacity duration-150 ${
            isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          onClick={() => onTogglePin(collection.id)}
          title={isPinned ? "Unpin collection" : "Pin collection"}
        >
          {isPinned ? (
            <Pin className="w-3 h-3 text-orange-500" />
          ) : (
            <PinOff className="w-3 h-3" />
          )}
        </Button>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-background border-r transition-all duration-300",
        "h-screen", // Changed from h-[100vh] fixed left-0 top-0 z-10
        isCollapsed ? "w-12" : "w-64"
      )}
    >
      <div className="flex justify-between items-center bg-background p-3 border-b">
        {!isCollapsed && (
          <div className="flex flex-1 items-center gap-2">
            <span className="font-medium text-sm">Pocket X</span>
            {!isSetup && (
              <SetupPocketBasePlus
                pb={pb as PocketBase}
                onSetupComplete={recheckSetup}
              />
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-0 w-6 h-6"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto">
        {isCollapsed ? (
          <div className="space-y-2 p-2">
            <Button
              variant={isDashboardActive ? "default" : "ghost"}
              size="sm"
              className="p-0 w-full h-8"
              onClick={() => nav("/dashboard")}
              title="Dashboard"
            >
              <Home className="w-4 h-4" />
            </Button>

            {/* Regular collections first */}
            {[...authCollections, ...baseCollections, ...viewCollections].map(
              renderCollectionButton
            )}

            {/* System collections at the end */}
            {allSystemCollections.length > 0 && (
              <>
                <div className="my-2 pt-2 border-t">
                  <div className="mb-1 text-muted-foreground text-xs text-center">
                    System
                  </div>
                </div>
                {allSystemCollections.map(renderCollectionButton)}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3 p-3">
            <div>
              <div className="top-0 z-20 sticky flex items-center gap-2 bg-background mb-2 py-1 font-medium text-muted-foreground text-xs">
                <Home className="w-3 h-3" />
                Navigation
              </div>
              <div className="space-y-1">
                <Button
                  variant={isDashboardActive ? "default" : "ghost"}
                  className="justify-start px-2 w-full h-8 text-xs"
                  onClick={() => nav("/dashboard")}
                >
                  <Home className="mr-2 w-3 h-3 shrink-0" />
                  <span className="truncate">Dashboard</span>
                </Button>
              </div>
            </div>

            <div>
              <div className="top-0 z-20 sticky flex items-center gap-2 bg-background mb-2 py-1 font-medium text-muted-foreground text-xs">
                <BarChart3 className="w-3 h-3" />
                Reports
              </div>
              <div className="space-y-1">
                <Button
                  variant={isReportsActive ? "default" : "ghost"}
                  className="justify-start px-2 w-full h-8 text-xs"
                  onClick={() => nav("/reports")}
                >
                  <FileText className="mr-2 w-3 h-3 shrink-0" />
                  <span className="truncate">Manage Reports</span>
                </Button>
                {reports.length > 0 && (
                  <div className="pt-1 border-muted-foreground/20 border-t">
                    {reports.map((report) => (
                      <Button
                        key={report.id}
                        variant="ghost"
                        className="justify-start px-2 w-full h-8 text-xs"
                        onClick={() => nav(`/reports/${report.id}`)}
                      >
                        <div
                          className="mr-2 border rounded w-3 h-3 shrink-0"
                          style={{ backgroundColor: report.color }}
                        />
                        <span className="truncate">{report.title}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="top-0 z-20 sticky flex items-center gap-2 bg-background mb-2 py-1 font-medium text-muted-foreground text-xs">
                <Database className="w-3 h-3" />
                Collections
                <Badge variant="secondary" className="text-xs">
                  {collections.length}
                </Badge>
              </div>

              {collections.length === 0 ? (
                <div className="py-4 text-muted-foreground text-center">
                  <Database className="opacity-50 mx-auto mb-2 w-6 h-6" />
                  <p className="text-xs">No collections found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {authCollections.length > 0 && (
                    <div>
                      <div className="top-6 z-10 sticky flex items-center gap-2 bg-background mb-1 py-1 pl-2 font-medium text-muted-foreground text-xs">
                        <Users className="w-3 h-3" />
                        Auth
                      </div>
                      <div className="space-y-1">
                        {authCollections.map(renderCollectionButton)}
                      </div>
                    </div>
                  )}

                  {baseCollections.length > 0 && (
                    <div>
                      <div className="top-6 z-10 sticky flex items-center gap-2 bg-background mb-1 py-1 pl-2 font-medium text-muted-foreground text-xs">
                        <Table className="w-3 h-3" />
                        Base
                      </div>
                      <div className="space-y-1">
                        {baseCollections.map(renderCollectionButton)}
                      </div>
                    </div>
                  )}

                  {viewCollections.length > 0 && (
                    <div>
                      <div className="top-6 z-10 sticky flex items-center gap-2 bg-background mb-1 py-1 pl-2 font-medium text-muted-foreground text-xs">
                        <Eye className="w-3 h-3" />
                        Views
                      </div>
                      <div className="space-y-1">
                        {viewCollections.map(renderCollectionButton)}
                      </div>
                    </div>
                  )}

                  {/* System Collections */}
                  <div>
                    <div
                      className="top-0 z-20 sticky flex items-center gap-2 bg-background mb-2 py-1 font-medium text-muted-foreground text-xs cursor-pointer"
                      onClick={() => setIsSystemCollapsed(!isSystemCollapsed)}
                    >
                      <Settings className="w-3 h-3" />
                      System Collections
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto p-0 w-6 h-6"
                        onClick={() => setIsSystemCollapsed(!isSystemCollapsed)}
                        title={
                          isSystemCollapsed
                            ? "Expand system collections"
                            : "Collapse system collections"
                        }
                      >
                        {isSystemCollapsed ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronUp className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {!isSystemCollapsed && (
                      <div className="space-y-1">
                        {allSystemCollections.map(renderCollectionButton)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </ScrollArea>

      <div className="bg-background p-2 border-t">
        {isCollapsed ? (
          <Button
            variant="ghost"
            size="sm"
            className="p-0 w-full h-8"
            onClick={onLogout}
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="justify-start px-2 w-full h-8 text-xs"
            onClick={onLogout}
          >
            <LogOut className="mr-2 w-3 h-3 shrink-0" />
            <span className="truncate">Logout</span>
          </Button>
        )}
      </div>
    </div>
  );
}
