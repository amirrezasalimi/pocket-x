"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Clock, Database, FileText, Copy, Check } from "lucide-react";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Button } from "@/shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { useState } from "react";

interface QueryResult {
  data: any[];
  totalItems: number;
  page: number;
  perPage: number;
  executionTime: number;
  averageTime?: number;
  testCount?: number;
}

interface ResultsTableProps {
  result: QueryResult | null;
  isLoading: boolean;
  expandedFields: string[];
  onExpandedFieldClick: (
    fieldName: string,
    recordId: string,
    data: any
  ) => void;
}

export function ResultsTable({
  result,
  isLoading,
  expandedFields,
  onExpandedFieldClick,
}: ResultsTableProps) {
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-32 h-6" />
          <Skeleton className="w-24 h-6" />
          <Skeleton className="w-20 h-6" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-12" />
          ))}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex justify-center items-center p-6 h-full">
        <div className="text-muted-foreground text-center">
          <FileText className="opacity-50 mx-auto mb-4 w-12 h-12" />
          <p>Execute a query to see results</p>
        </div>
      </div>
    );
  }

  const formatExecutionTime = (time: number) => {
    if (time < 1000) {
      return `${time.toFixed(2)}ms`;
    }
    return `${(time / 1000).toFixed(2)}s`;
  };

  const getPerformanceColor = (time: number) => {
    if (time < 100) return "text-green-600";
    if (time < 500) return "text-yellow-600";
    return "text-red-600";
  };

  const copyResults = async () => {
    const jsonString = JSON.stringify(result.data, null, 2);
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderCellContent = (key: string, record: any) => {
    const value = record[key];
    const expandedData = getExpandedDataForField(record, key);

    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>;
    }

    if (expandedData) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <button className="hover:bg-muted/50 px-1 py-0.5 border border-transparent hover:border-blue-200 rounded w-full text-left transition-colors cursor-pointer">
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="opacity-60 ml-auto text-xs">
                  {String(value)}
                </Badge>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-96 max-h-96 overflow-auto" align="start">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Field: {key}</span>
                <Badge variant="secondary" className="text-xs">
                  {Array.isArray(expandedData)
                    ? `Array (${expandedData.length} items)`
                    : typeof expandedData}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Expanded Data
                </Badge>
              </div>
              <div className="pt-2 border-t">
                <pre className="bg-muted p-3 rounded max-h-80 overflow-auto font-mono text-xs whitespace-pre-wrap">
                  {JSON.stringify(expandedData, null, 2)}
                </pre>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    // Non-expanded field rendering
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground">[]</span>;
      }

      return (
        <div className="space-y-1">
          {value.map((item, index) => {
            if (
              item &&
              typeof item === "object" &&
              typeof item.id === "string" &&
              Object.keys(item).length > 1
            ) {
              const displayField =
                item.name ||
                item.title ||
                item.email ||
                item.username ||
                item.label ||
                item.text;
              const preview = displayField ? `${displayField}` : item.id;

              return (
                <span
                  key={index}
                  className="inline-block bg-blue-50 mr-1 px-2 py-0.5 border border-blue-200 rounded font-mono text-xs"
                >
                  {preview}
                </span>
              );
            }

            return (
              <span key={index} className="mr-1 text-foreground">
                {JSON.stringify(item)}
              </span>
            );
          })}
        </div>
      );
    }

    if (typeof value === "object") {
      const isExpandedRecord =
        typeof value.id === "string" && Object.keys(value).length > 1;

      if (Object.keys(value).length === 1 && typeof value.id === "string") {
        return (
          <span className="font-mono text-muted-foreground italic">
            {value.id}
          </span>
        );
      }

      if (isExpandedRecord) {
        const displayField =
          value.name ||
          value.title ||
          value.email ||
          value.username ||
          value.label ||
          value.text;
        const preview = displayField || value.id;

        return (
          <span className="bg-blue-50 px-2 py-0.5 border border-blue-200 rounded font-mono text-xs">
            {preview}
          </span>
        );
      }

      return <span className="text-foreground">{JSON.stringify(value)}</span>;
    }

    return <span className="text-foreground">{String(value)}</span>;
  };

  // Get ordered keys: first ensure 'id' is first, then maintain natural order from first record
  const getOrderedKeys = () => {
    if (result.data.length === 0) return [];

    // Get keys from the first record to maintain order
    const firstRecordKeys = Object.keys(result.data[0]);

    // Get all unique keys from all records
    const allKeys = Array.from(new Set(result.data.flatMap(Object.keys)));

    // Create ordered list: id first, then first record order, then any additional keys
    const orderedKeys: string[] = []; // Corrected type to string[]

    // Always put 'id' first if it exists
    if (allKeys.includes("id")) {
      orderedKeys.push("id");
    }

    // Add other keys from first record in order, but exclude expand.* fields
    firstRecordKeys.forEach((key) => {
      if (
        key !== "id" &&
        !orderedKeys.includes(key) &&
        !key.startsWith("expand.")
      ) {
        orderedKeys.push(key);
      }
    });

    // Add any remaining keys that weren't in first record, but exclude expand.* fields
    allKeys.forEach((key) => {
      if (!orderedKeys.includes(key) && !key.startsWith("expand.")) {
        orderedKeys.push(key);
      }
    });

    return orderedKeys.filter((key) => key != "expand");
  };

  // Helper function to get expanded data for a field
  const getExpandedDataForField = (record: any, fieldName: string) => {
    return record?.expand?.[fieldName];
  };

  // Helper function to check if a field has expanded data
  const hasExpandedData = (fieldName: string) => {
    return result?.data.some(
      (record) => record[`expand.${fieldName}`] !== undefined
    );
  };

  const orderedKeys = getOrderedKeys();

  return (
    <div className="flex flex-col h-full">
      <div className="bg-background p-2 border-b">
        <div className="flex justify-between items-center">
          <div className="flex flex-wrap items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              {result.totalItems} records
            </Badge>
            <Badge
              variant="outline"
              className={`flex items-center gap-1 ${getPerformanceColor(
                result.executionTime
              )}`}
            >
              <Clock className="w-3 h-3" />
              {formatExecutionTime(result.executionTime)}
            </Badge>
            {result.averageTime && result.testCount && (
              <Badge
                variant="outline"
                className={`flex items-center gap-1 ${getPerformanceColor(
                  result.averageTime
                )}`}
              >
                <Clock className="w-3 h-3" />
                Avg: {formatExecutionTime(result.averageTime)} (
                {result.testCount}x)
              </Badge>
            )}
            <Badge variant="secondary">
              Page {result.page} of{" "}
              {Math.ceil(result.totalItems / result.perPage)}
            </Badge>
            {result.executionTime < 100 && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                Fast Query
              </Badge>
            )}
            {result.executionTime > 1000 && (
              <Badge variant="destructive">Slow Query</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={copyResults}>
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {result.data.length === 0 ? (
          <div className="py-8 text-muted-foreground text-center">
            <Database className="opacity-50 mx-auto mb-2 w-8 h-8" />
            <p>No records found</p>
            <p className="mt-1 text-xs">
              Try adjusting your filter or query parameters
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="top-0 sticky bg-background">
              <TableRow>
                {orderedKeys.map((key) => (
                  <TableHead key={key} className="font-mono text-xs">
                    {key}
                    {hasExpandedData(key) && (
                      <Badge
                        variant="secondary"
                        className="ml-1 text-xs cursor-pointer"
                      >
                        expand
                      </Badge>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((record, index) => (
                <TableRow key={record.id || index}>
                  {orderedKeys.map((key) => (
                    <TableCell key={key} className="max-w-xs font-mono text-xs">
                      <div className="truncate">
                        {renderCellContent(key, record)}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
