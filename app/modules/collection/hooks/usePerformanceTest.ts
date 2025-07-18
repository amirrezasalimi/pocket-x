import { useCallback } from "react";
import { DEFAULTS } from "@/shared/constants";
import {
  LocalStorageManager,
  type QueryParams,
} from "@/shared/utils/localStorage";
import type { QueryResult } from "./useCollectionQuery";

export function usePerformanceTest({
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
}: {
  pb: any;
  collection: any;
  filter: string;
  sort: string;
  expand: string;
  selectedFields: string[];
  page: number;
  perPage: number;
  setQueryResult: (result: QueryResult) => void;
  setIsPerformanceTesting: (v: boolean) => void;
}) {
  const performanceTest = useCallback(async () => {
    if (!collection || !pb) return;
    setIsPerformanceTesting(true);
    const times: number[] = [];
    try {
      for (let i = 0; i < DEFAULTS.PERFORMANCE_TEST_COUNT; i++) {
        if (i > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, DEFAULTS.PERFORMANCE_TEST_DELAY)
          );
        }
        const startTime = performance.now();
        const options: any = {};
        if (filter) options.filter = filter;
        if (sort) options.sort = sort;
        if (expand) options.expand = expand;
        let fieldsToInclude = [...selectedFields];
        if (expand) {
          const expandFields = expand.split(",").filter(Boolean);
          const expandedFieldPatterns = expandFields.map(
            (field) => `expand.${field.trim()}.*`
          );
          fieldsToInclude = [...fieldsToInclude, ...expandedFieldPatterns];
        }
        if (fieldsToInclude.length > 0)
          options.fields = fieldsToInclude.join(",");
        const result = await pb
          .collection(collection.name)
          .getList(page, perPage, options);
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        times.push(executionTime);
        if (i === DEFAULTS.PERFORMANCE_TEST_COUNT - 1) {
          const averageTime =
            times.reduce((sum, time) => sum + time, 0) / times.length;
          const queryResult = {
            data: result.items || [],
            totalItems: result.totalItems || 0,
            page: result.page || DEFAULTS.PAGE,
            perPage: result.perPage || DEFAULTS.PER_PAGE,
            executionTime,
            averageTime,
            testCount: DEFAULTS.PERFORMANCE_TEST_COUNT,
          };
          setQueryResult(queryResult);
          const queryParams: QueryParams = {
            filter,
            sort,
            expand,
            selectedFields,
            page,
            perPage,
          };
          LocalStorageManager.setQueryParams(collection.name, queryParams);
        }
      }
    } catch (error: any) {
      setQueryResult({
        data: [],
        totalItems: 0,
        page: DEFAULTS.PAGE,
        perPage: DEFAULTS.PER_PAGE,
        executionTime: 0,
      });
    } finally {
      setIsPerformanceTesting(false);
    }
  }, [
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
  ]);

  return { performanceTest };
}
