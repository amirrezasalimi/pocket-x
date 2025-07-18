"use client";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Badge } from "@/shared/components/ui/badge";
import {
  Play,
  Loader2,
  Filter,
  Settings,
  Zap,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Timer,
  Trash2,
} from "lucide-react";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { useState, useEffect } from "react";
import {
  parseIndexes,
  getIndexColorClasses,
  type ParsedIndex,
} from "@/shared/lib/index-parser";

interface Collection {
  id: string;
  name: string;
  type: string;
  fields: Array<{
    id: string;
    name: string;
    type: string;
    required: boolean;
    options?: any;
  }>;
  indexes?: string[];
}

interface QueryHeaderProps {
  collection: Collection | null;
  filter: string;
  setFilter: (filter: string) => void;
  sort: string;
  setSort: (sort: string) => void;
  expand: string;
  setExpand: (expand: string) => void;
  selectedFields: string[];
  setSelectedFields: (fields: string[]) => void;
  page: number;
  setPage: (page: number) => void;
  perPage: number;
  setPerPage: (perPage: number) => void;
  onExecuteQuery: () => void;
  onPerformanceTest: () => void;
  isLoading: boolean;
  isPerformanceTesting: boolean;
  baseURL: string;
  onLogout: () => void;
  totalItems: number;
  onClearCache: () => void;
  onClearAllCache: () => void;
}

export function QueryHeader({
  collection,
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
  onExecuteQuery,
  onPerformanceTest,
  isLoading,
  isPerformanceTesting,
  baseURL,
  onLogout,
  totalItems,
  onClearCache,
  onClearAllCache,
}: QueryHeaderProps) {
  const [parsedIndexes, setParsedIndexes] = useState<ParsedIndex[]>([]);

  useEffect(() => {
    if (collection?.indexes) {
      const parsed = parseIndexes(collection.indexes);
      setParsedIndexes(parsed);
    } else {
      setParsedIndexes([]);
    }
  }, [collection]);

  const handleFieldToggle = (fieldName: string) => {
    setSelectedFields(
      selectedFields.includes(fieldName)
        ? selectedFields.filter((f) => f !== fieldName)
        : [...selectedFields, fieldName]
    );
  };

  const relationFields =
    collection?.fields?.filter(
      (field) => field.type === "relation" || field.type === "file"
    ) || [];

  // Check if current selected fields match any index combination
  const isIndexedCombo = parsedIndexes.some((index) => {
    return (
      index.fields.length === selectedFields.length &&
      index.fields.every((field) => selectedFields.includes(field))
    );
  });

  // Check for partial index combinations (at least 2 fields from an index)
  const partialIndexMatch = parsedIndexes.find((index) => {
    const matchingFields = index.fields.filter((field) =>
      selectedFields.includes(field)
    );
    return matchingFields.length >= 2; // At least 2 fields from this index
  });

  // Check for ordered partial index combinations (at least 2 consecutive fields in order)
  const orderedPartialIndexMatch = parsedIndexes.find((index) => {
    // Check if at least 2 consecutive fields from the index are selected in order
    for (let i = 0; i < index.fields.length - 1; i++) {
      const currentField = index.fields[i];
      const nextField = index.fields[i + 1];

      if (
        selectedFields.includes(currentField) &&
        selectedFields.includes(nextField)
      ) {
        return true; // Found at least 2 consecutive fields
      }
    }
    return false;
  });

  const isPartialIndexedCombo = !!partialIndexMatch && !isIndexedCombo;
  const isOrderedPartialCombo = !!orderedPartialIndexMatch && !isIndexedCombo;

  // Get fields that are NOT part of the partial combo (for orange highlighting)
  const nonComboFields =
    isPartialIndexedCombo || isOrderedPartialCombo
      ? selectedFields.filter((field) => {
          // A field is non-combo if it's not in ANY of the matching indexes
          const isInPartialMatch = partialIndexMatch?.fields.includes(field);
          const isInOrderedPartialMatch =
            orderedPartialIndexMatch?.fields.includes(field);
          return !isInPartialMatch && !isInOrderedPartialMatch;
        })
      : [];

  // Get fields that ARE part of partial combos (for green highlighting)
  const partialComboFields =
    isPartialIndexedCombo || isOrderedPartialCombo
      ? selectedFields.filter((field) => {
          const isInPartialMatch = partialIndexMatch?.fields.includes(field);
          const isInOrderedPartialMatch =
            orderedPartialIndexMatch?.fields.includes(field);
          return isInPartialMatch || isInOrderedPartialMatch;
        })
      : [];

  const totalPages = Math.ceil(totalItems / perPage);

  return (
    <div className="bg-background p-4 border-b">
      <div className="flex justify-between items-center mb-4">
        <div>
          {collection && (
            <p className="text-muted-foreground text-sm">
              {collection.name} • {collection.fields?.length || 0} fields
              {parsedIndexes.length > 0 && ` • ${parsedIndexes.length} indexes`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            Connected to: {baseURL}
          </span>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="mr-1 w-3 h-3" />
            Logout
          </Button>
        </div>
      </div>

      {collection && (
        <div className="flex justify-between items-center">
          <div className="flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent h-8"
                >
                  <Filter className="mr-2 w-3 h-3" />
                  Filter
                  {filter && (
                    <Badge
                      variant="secondary"
                      className="ml-2 px-1 h-4 text-xs"
                    >
                      Active
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96" align="start">
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="filter"
                      className="flex items-center gap-2 font-medium text-sm"
                    >
                      Filter Expression
                      {filter && (
                        <Badge variant="outline" className="text-xs">
                          <Zap className="mr-1 w-3 h-3" />
                          May use index
                        </Badge>
                      )}
                    </Label>
                    <Textarea
                      id="filter"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      placeholder="e.g., name ~ 'test' && status = 'active'"
                      className="mt-1 font-mono text-sm"
                      rows={3}
                    />
                    <p className="mt-1 text-muted-foreground text-xs">
                      Use PocketBase filter syntax
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="sort" className="font-medium text-sm">
                      Sort
                    </Label>
                    <Input
                      id="sort"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      placeholder="e.g., -created, +name"
                      className="mt-1 font-mono text-sm"
                    />
                    <p className="mt-1 text-muted-foreground text-xs">
                      Use + for ascending, - for descending
                    </p>
                  </div>

                  {relationFields.length > 0 && (
                    <div>
                      <Label htmlFor="expand" className="font-medium text-sm">
                        Expand Relations
                      </Label>
                      <Input
                        id="expand"
                        value={expand}
                        onChange={(e) => setExpand(e.target.value)}
                        placeholder={`e.g., ${relationFields
                          .map((f) => f.name)
                          .join(", ")}`}
                        className="mt-1 font-mono text-sm"
                      />
                      <div className="space-y-2 mt-2">
                        <Label className="text-muted-foreground text-xs">
                          Available Relations:
                        </Label>
                        {relationFields.map((field) => {
                          const isSelected = expand
                            .split(",")
                            .map((s) => s.trim())
                            .includes(field.name);

                          return (
                            <div
                              key={field.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`expand-${field.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  const currentExpands = expand
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter((s) => s);

                                  if (checked) {
                                    if (!currentExpands.includes(field.name)) {
                                      const newExpands = [
                                        ...currentExpands,
                                        field.name,
                                      ];
                                      setExpand(newExpands.join(", "));
                                    }
                                  } else {
                                    const newExpands = currentExpands.filter(
                                      (name) => name !== field.name
                                    );
                                    setExpand(newExpands.join(", "));
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`expand-${field.id}`}
                                className="flex flex-1 items-center gap-2 font-mono text-sm cursor-pointer"
                              >
                                {field.name}
                                <Badge variant="secondary" className="text-xs">
                                  {field.type}
                                </Badge>
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-1 text-muted-foreground text-xs">
                        Select relations to expand or type manually above
                      </p>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent h-8"
                >
                  <Settings className="mr-2 w-3 h-3" />
                  Fields
                  {selectedFields.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 px-1 h-4 text-xs"
                    >
                      {selectedFields.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[600px] overflow-scroll"
                align="start"
              >
                <div className="space-y-4">
                  <div className="flex gap-4">
                    {/* Index Combinations Section */}
                    {parsedIndexes.length > 0 && (
                      <div className="p-3 border rounded-lg min-w-[250px] max-w-[250px]">
                        <Label className="block mb-2 font-medium text-sm">
                          Index Combinations
                        </Label>
                        <div className="space-y-2">
                          {parsedIndexes.map((index) => {
                            const colorClasses = getIndexColorClasses(index.id);
                            return (
                              <div
                                key={index.id}
                                className="flex items-center gap-2 hover:bg-muted p-2 rounded text-xs cursor-pointer"
                                onClick={() => {
                                  // Unselect all fields and select only the combo fields
                                  setSelectedFields(index.fields);
                                }}
                              >
                                <div
                                  className={`w-3 h-3 rounded-full ${colorClasses.bg}`}
                                ></div>
                                <div className="flex-1">
                                  <div className="font-mono">
                                    {index.fields.join(" + ")}
                                  </div>
                                  {index.isUnique && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-purple-100 mt-1 text-purple-800 text-xs"
                                    >
                                      unique
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <p className="mt-2 text-muted-foreground text-xs">
                          💡 Click to select combo fields
                        </p>
                      </div>
                    )}

                    {/* Select Fields Section */}
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <Label className="font-medium text-sm">
                          Select Fields
                        </Label>
                        {isIndexedCombo && (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 px-2 h-5 text-green-800 text-xs"
                          >
                            ✓ Indexed: Faster Query
                          </Badge>
                        )}
                        {isOrderedPartialCombo && (
                          <Badge
                            variant="secondary"
                            className="bg-green-50 px-2 h-5 text-green-800 text-xs"
                          >
                            Ordered Partial Match
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2 max-h-[400px] overflow-auto">
                        {collection.fields
                          ?.sort((a, b) => {
                            // Sort combo fields to top when they're selected
                            const aInCombo =
                              selectedFields.includes(a.name) && isIndexedCombo;
                            const bInCombo =
                              selectedFields.includes(b.name) && isIndexedCombo;
                            if (aInCombo && !bInCombo) return -1;
                            if (!aInCombo && bInCombo) return 1;
                            return 0;
                          })
                          .map((field) => {
                            const isComboField =
                              selectedFields.includes(field.name) &&
                              isIndexedCombo;
                            const isPartialComboField =
                              partialComboFields.includes(field.name) &&
                              !isComboField;
                            const isOrderedPartialComboField =
                              partialComboFields.includes(field.name) &&
                              isOrderedPartialCombo &&
                              !isComboField;
                            const isNonComboField = nonComboFields.includes(
                              field.name
                            );
                            return (
                              <div
                                key={field.id}
                                className={`flex items-center space-x-2 p-2 rounded ${
                                  isComboField
                                    ? "bg-green-50 border border-green-200"
                                    : isPartialComboField
                                    ? "bg-orange-50 border border-orange-200"
                                    : isOrderedPartialComboField
                                    ? "bg-green-50 border border-green-200"
                                    : isNonComboField
                                    ? "bg-yellow-50 border border-yellow-200"
                                    : ""
                                }`}
                              >
                                <Checkbox
                                  id={`field-${field.id}`}
                                  checked={selectedFields.includes(field.name)}
                                  onCheckedChange={() =>
                                    handleFieldToggle(field.name)
                                  }
                                />
                                <Label
                                  htmlFor={`field-${field.id}`}
                                  className="flex-1 font-mono text-sm cursor-pointer"
                                >
                                  {field.name}
                                </Label>
                                <Badge variant="secondary" className="text-xs">
                                  {field.type}
                                </Badge>
                                {field.required && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    required
                                  </Badge>
                                )}
                                {isComboField && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-100 text-green-800 text-xs"
                                  >
                                    indexed
                                  </Badge>
                                )}
                                {isPartialComboField && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-orange-100 text-orange-800 text-xs"
                                  >
                                    partial indexed
                                  </Badge>
                                )}
                                {isNonComboField && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-yellow-100 text-yellow-800 text-xs"
                                  >
                                    non-combo
                                  </Badge>
                                )}
                              </div>
                            );
                          }) || (
                          <p className="text-muted-foreground text-sm">
                            No fields available
                          </p>
                        )}
                      </div>
                      <p className="mt-2 text-muted-foreground text-xs">
                        Leave empty to select all fields
                      </p>
                    </div>
                  </div>

                  <div className="gap-2 grid grid-cols-2">
                    <div>
                      <Label htmlFor="page" className="font-medium text-sm">
                        Page
                      </Label>
                      <Input
                        id="page"
                        type="number"
                        value={page}
                        onChange={(e) =>
                          setPage(Number.parseInt(e.target.value) || 1)
                        }
                        min="1"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="perPage" className="font-medium text-sm">
                        Per Page
                      </Label>
                      <Input
                        id="perPage"
                        type="number"
                        value={perPage}
                        onChange={(e) =>
                          setPerPage(Number.parseInt(e.target.value) || 30)
                        }
                        min="1"
                        max="500"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              onClick={onExecuteQuery}
              disabled={isLoading || !collection}
              size="sm"
              className="h-8"
            >
              {isLoading ? (
                <Loader2 className="mr-2 w-3 h-3 animate-spin" />
              ) : (
                <Play className="mr-2 w-3 h-3" />
              )}
              Execute Query
            </Button>

            <Button
              onClick={onPerformanceTest}
              disabled={isPerformanceTesting || !collection}
              variant="outline"
              size="sm"
              className="bg-transparent h-8"
            >
              {isPerformanceTesting ? (
                <Loader2 className="mr-2 w-3 h-3 animate-spin" />
              ) : (
                <Timer className="mr-2 w-3 h-3" />
              )}
              Performance Test
            </Button>
          </div>

          {/* Cache Management and Pagination */}
          <div className="flex items-center gap-2">
            {/* Cache Management Buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={onClearCache}
              disabled={!collection}
              className="bg-transparent h-8"
              title="Clear cache for current collection"
            >
              <Trash2 className="mr-1 w-3 h-3" />
              Clear Cache
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onClearAllCache}
              className="bg-transparent hover:bg-red-50 border-red-200 h-8 text-red-600"
              title="Clear all cached query results"
            >
              <Trash2 className="mr-1 w-3 h-3" />
              Clear All
            </Button>

            {/* Pagination */}
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newPage = Math.max(1, page - 1);
                  setPage(newPage);
                  onExecuteQuery();
                }}
                disabled={page <= 1}
                className="p-0 w-7 h-7"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <span className="text-muted-foreground text-xs">
                {page} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newPage = Math.min(totalPages, page + 1);
                  setPage(newPage);
                  onExecuteQuery();
                }}
                disabled={page >= totalPages}
                className="p-0 w-7 h-7"
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
