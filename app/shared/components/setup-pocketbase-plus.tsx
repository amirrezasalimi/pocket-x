"use client";

import { useState, useEffect } from "react";
import { Settings, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { DB_SCHEMA } from "@/shared/data/pb-schema";
import PocketBase from "pocketbase";

interface SetupPocketBasePlusProps {
  pb: PocketBase | null;
  onSetupComplete?: () => void;
}

interface SetupStatus {
  isSetup: boolean;
  missingCollections: string[];
  existingCollections: string[];
  isChecking: boolean;
  isImporting: boolean;
  error: string | null;
}

export function SetupPocketBasePlus({
  pb,
  onSetupComplete,
}: SetupPocketBasePlusProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<SetupStatus>({
    isSetup: false,
    missingCollections: [],
    existingCollections: [],
    isChecking: false,
    isImporting: false,
    error: null,
  });

  const requiredCollections = DB_SCHEMA.map((collection) => collection.name);

  const checkSetupStatus = async () => {
    if (!pb) return;

    setStatus((prev) => ({ ...prev, isChecking: true, error: null }));

    try {
      // Get all existing collections
      const existingCollections = await pb.collections.getFullList();
      const existingNames = existingCollections.map((col) => col.name);

      // Check which required collections are missing
      const missingCollections = requiredCollections.filter(
        (name) => !existingNames.includes(name)
      );

      const existingRequired = requiredCollections.filter((name) =>
        existingNames.includes(name)
      );

      const isSetup = missingCollections.length === 0;

      setStatus({
        isSetup,
        missingCollections,
        existingCollections: existingRequired,
        isChecking: false,
        isImporting: false,
        error: null,
      });
      if (isSetup) {
        // refresh
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error("Error checking setup status:", error);
      setStatus((prev) => ({
        ...prev,
        isChecking: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to check setup status",
      }));
    }
  };

  const importCollections = async () => {
    if (!pb || status.missingCollections.length === 0) return;

    setStatus((prev) => ({ ...prev, isImporting: true, error: null }));

    try {
      // Import all collections (PocketBase will skip existing ones)
      await pb.collections.import(DB_SCHEMA as unknown as any, false);

      // Re-check status after import
      await checkSetupStatus();

      // Call the completion callback if provided
      onSetupComplete?.();

      // Close the modal on successful setup
      if (status.missingCollections.length === 0) {
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Error importing collections:", error);
      setStatus((prev) => ({
        ...prev,
        isImporting: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to import collections",
      }));
    }
  };

  // Check setup status when component mounts or pb changes
  useEffect(() => {
    if (pb && isOpen) {
      checkSetupStatus();
    }
  }, [pb, isOpen]);

  // Don't render if PocketBase is not available
  if (!pb) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="px-2 h-7 text-xs"
          onClick={() => setIsOpen(true)}
        >
          <Settings className="mr-1 w-3 h-3" />
          Setup
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Setup
          </DialogTitle>
          <DialogDescription>
            This will check and import the required collections for PocketBase
            Plus to work properly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {status.isChecking ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="mr-2 w-6 h-6 animate-spin" />
              <span className="text-muted-foreground text-sm">
                Checking setup status...
              </span>
            </div>
          ) : (
            <>
              {status.error && (
                <div className="flex items-center gap-2 bg-red-50 p-3 border border-red-200 rounded-md">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-red-700 text-sm">{status.error}</span>
                </div>
              )}

              {status.isSetup ? (
                <div className="flex items-center gap-2 bg-green-50 p-3 border border-green-200 rounded-md">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-green-700 text-sm">
                    Pocket X is already set up! All required collections are
                    present.
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm">
                    <p className="mb-2 font-medium">Setup Status:</p>

                    {status.existingCollections.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-1 font-medium text-green-700 text-xs">
                          ✓ Existing collections (
                          {status.existingCollections.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {status.existingCollections.map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center bg-green-100 px-2 py-1 rounded text-green-800 text-xs"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {status.missingCollections.length > 0 && (
                      <div>
                        <p className="mb-1 font-medium text-orange-700 text-xs">
                          ⚠ Missing collections (
                          {status.missingCollections.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {status.missingCollections.map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center bg-orange-100 px-2 py-1 rounded text-orange-800 text-xs"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={status.isImporting}
          >
            Close
          </Button>

          {!status.isSetup && !status.isChecking && (
            <Button
              onClick={importCollections}
              disabled={
                status.isImporting || status.missingCollections.length === 0
              }
            >
              {status.isImporting ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${status.missingCollections.length} Collection${
                  status.missingCollections.length !== 1 ? "s" : ""
                }`
              )}
            </Button>
          )}

          {!status.isImporting && (
            <Button
              variant="outline"
              onClick={checkSetupStatus}
              disabled={status.isChecking}
            >
              {status.isChecking ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Refresh Status"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
