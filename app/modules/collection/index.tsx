"use client";
import { useAppStore } from "@/shared/store/app-store";
import { QueryHeader } from "@/shared/components/query-header";
import { ResultsTable } from "@/shared/components/results-table";
import { LocalStorageManager } from "@/shared/utils/localStorage";
import { useCollectionQuery } from "./hooks/useCollectionQuery";
import { usePerformanceTest } from "./hooks/usePerformanceTest";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

const Collection = () => {
  const params = useParams();
  const collectionName = params.collection as string;
  const { pb, collections, setSelectedCollection } = useAppStore();
  const collection = collections.find((c) => c.name === collectionName);

  const {
    queryResult,
    isLoading,
    filter,
    setFilter,
    sort,
    setSort,
    expand,
    setExpand,
    selectedFields,
    setSelectedFields,
    page,
    setPage,
    perPage,
    setPerPage,
    executeQuery,
    executeQueryWithParams,
    loadCachedParamsAndExecute,
    setQueryResult,
  } = useCollectionQuery(pb, collection, collectionName);

  const [isPerformanceTesting, setIsPerformanceTesting] = useState(false);
  const { performanceTest } = usePerformanceTest({
    pb,
    collection,
    filter,
    sort,
    expand,
    selectedFields,
    page,
    perPage,
    setQueryResult,
    setIsPerformanceTesting,
  });

  useEffect(() => {
    if (collection) setSelectedCollection(collection);
  }, [collection, setSelectedCollection]);

  const handleLogout = () => {
    if (pb) pb.authStore.clear();
    LocalStorageManager.removeAuthData();
    LocalStorageManager.removeBaseUrl();
    window.location.href = "/";
  };

  if (!pb || !collection) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="border-gray-900 border-b-2 rounded-full w-8 h-8 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <QueryHeader
        collection={collection}
        filter={filter}
        setFilter={setFilter}
        sort={sort}
        setSort={setSort}
        expand={expand}
        setExpand={setExpand}
        selectedFields={selectedFields}
        setSelectedFields={setSelectedFields}
        page={page}
        setPage={setPage}
        perPage={perPage}
        setPerPage={setPerPage}
        onExecuteQuery={executeQuery}
        onPerformanceTest={performanceTest}
        isLoading={isLoading}
        isPerformanceTesting={isPerformanceTesting}
        baseURL={pb.baseURL}
        onLogout={handleLogout}
        totalItems={queryResult?.totalItems || 0}
        onClearCache={() =>
          LocalStorageManager.clearCacheForCollection(collection.name)
        }
        onClearAllCache={LocalStorageManager.clearAllCache}
      />
      <div className="flex-1 overflow-hidden">
        <ResultsTable
          result={queryResult}
          isLoading={isLoading}
          expandedFields={expand.split(",").filter(Boolean)}
          onExpandedFieldClick={() => {}}
        />
      </div>
    </div>
  );
};

export default Collection;
