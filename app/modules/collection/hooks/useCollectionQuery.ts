import { useState, useEffect, useCallback } from "react";
import {
  LocalStorageManager,
  type QueryParams,
} from "@/shared/utils/localStorage";
import { DEFAULTS } from "@/shared/constants";

export interface QueryResult {
  data: any[];
  totalItems: number;
  page: number;
  perPage: number;
  executionTime: number;
  averageTime?: number;
  testCount?: number;
}

export function useCollectionQuery(
  pb: any,
  collection: any,
  collectionName: string
) {
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("");
  const [expand, setExpand] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [page, setPage] = useState<number>(DEFAULTS.PAGE);
  const [perPage, setPerPage] = useState<number>(DEFAULTS.PER_PAGE);

  useEffect(() => {
    if (collection) {
      loadCachedParamsAndExecute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection, collectionName]);

  const loadCachedParamsAndExecute = useCallback(() => {
    setIsLoading(true);
    setFilter("");
    setSort("");
    setExpand("");
    setSelectedFields([]);
    setPage(DEFAULTS.PAGE);
    setPerPage(DEFAULTS.PER_PAGE);
    setQueryResult(null);

    if (collectionName) {
      const cachedParams = LocalStorageManager.getQueryParams(collectionName);
      if (cachedParams) {
        setFilter(cachedParams.filter || "");
        setSort(cachedParams.sort || "");
        setExpand(cachedParams.expand || "");
        setSelectedFields(cachedParams.selectedFields || []);
        setPage(cachedParams.page || DEFAULTS.PAGE);
        setPerPage(cachedParams.perPage || DEFAULTS.PER_PAGE);
        setTimeout(() => {
          executeQueryWithParams(cachedParams);
        }, 100);
      } else {
        setIsLoading(false);
      }
    }
  }, [collectionName]);

  const executeQueryWithParams = useCallback(
    async (params: QueryParams | null = null) => {
      if (!collection || !pb) return;
      setIsLoading(true);
      const startTime = performance.now();
      try {
        const options: any = {};
        const queryFilter = params?.filter || filter;
        const querySort = params?.sort || sort;
        const queryExpand = params?.expand || expand;
        const querySelectedFields = params?.selectedFields || selectedFields;
        const queryPage = params?.page || page;
        const queryPerPage = params?.perPage || perPage;
        if (queryFilter) options.filter = queryFilter;
        if (querySort) options.sort = querySort;
        if (queryExpand) options.expand = queryExpand;
        let fieldsToInclude = [...querySelectedFields];
        if (queryExpand) {
          const expandFields = queryExpand.split(",").filter(Boolean);
          const expandedFieldPatterns = expandFields.map(
            (field) => `expand.${field.trim()}.*`
          );
          fieldsToInclude = [...fieldsToInclude, ...expandedFieldPatterns];
        }
        if (fieldsToInclude.length > 0)
          options.fields = fieldsToInclude.join(",");
        const result = await pb
          .collection(collection.name)
          .getList(queryPage, queryPerPage, options);
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        const queryResult = {
          data: result.items || [],
          totalItems: result.totalItems || 0,
          page: result.page || DEFAULTS.PAGE,
          perPage: result.perPage || DEFAULTS.PER_PAGE,
          executionTime,
        };
        setQueryResult(queryResult);
        const queryParams: QueryParams = {
          filter: queryFilter,
          sort: querySort,
          expand: queryExpand,
          selectedFields: querySelectedFields,
          page: queryPage,
          perPage: queryPerPage,
        };
        LocalStorageManager.setQueryParams(collection.name, queryParams);
      } catch (error: any) {
        setQueryResult({
          data: [],
          totalItems: 0,
          page: DEFAULTS.PAGE,
          perPage: DEFAULTS.PER_PAGE,
          executionTime: 0,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [collection, pb, filter, sort, expand, selectedFields, page, perPage]
  );

  const executeQuery = useCallback(async () => {
    await executeQueryWithParams();
  }, [executeQueryWithParams]);

  return {
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
  };
}
