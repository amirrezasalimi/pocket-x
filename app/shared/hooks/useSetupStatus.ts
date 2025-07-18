import { useState, useEffect } from "react";
import PocketBase from "pocketbase";
import { DB_SCHEMA } from "@/shared/data/pb-schema";

export function useSetupStatus(pb: PocketBase | null) {
  const [isSetup, setIsSetup] = useState(true); // Default to true to avoid showing setup button before check
  const [isChecking, setIsChecking] = useState(false);

  const checkSetupStatus = async () => {
    if (!pb) return;

    setIsChecking(true);
    try {
      const existingCollections = await pb.collections.getFullList();
      const existingNames = existingCollections.map((col) => col.name);
      const requiredCollections = DB_SCHEMA.map(
        (collection) => collection.name
      );

      const missingCollections = requiredCollections.filter(
        (name) => !existingNames.includes(name)
      );

      setIsSetup(missingCollections.length === 0);
    } catch (error) {
      console.error("Error checking setup status:", error);
      setIsSetup(false); // Show setup button on error
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (pb) {
      checkSetupStatus();
    }
  }, [pb]);

  return {
    isSetup,
    isChecking,
    recheckSetup: checkSetupStatus,
  };
}
