import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { FilterItem } from "@/shared/types/report";

const ReportFilters = ({
  filters,
  values,
  onChange,
}: {
  filters: Record<string, FilterItem>;
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}) => {
  if (!filters || Object.keys(filters).length === 0) {
    return (
      <span className="text-muted-foreground text-xs">
        No filters available.
      </span>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {Object.entries(filters).map(([key, filter]) => {
        switch (filter.type) {
          case "text":
            return (
              <div key={key} className="flex flex-col gap-1">
                <label className="font-medium text-xs">{filter.label}</label>
                <Input
                  type="text"
                  value={values[key] ?? filter.defaultValue ?? ""}
                  onChange={(e) => onChange(key, e.target.value)}
                  className="h-8"
                />
              </div>
            );
          case "num-range":
            return (
              <div key={key} className="flex flex-col gap-1">
                <label className="font-medium text-xs">{filter.label}</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={values[key + ".min"] ?? filter.min ?? ""}
                    onChange={(e) => onChange(key + ".min", e.target.value)}
                    className="h-8"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={values[key + ".max"] ?? filter.max ?? ""}
                    onChange={(e) => onChange(key + ".max", e.target.value)}
                    className="h-8"
                  />
                </div>
              </div>
            );
          case "select":
            return (
              <div key={key} className="flex flex-col gap-1">
                <label className="font-medium text-xs">{filter.label}</label>
                <Select
                  value={values[key] ?? undefined}
                  onValueChange={(val) => onChange(key, val)}
                >
                  <SelectTrigger className="w-full h-8">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          case "multi-select":
            // You may want to use a custom multi-select component here
            return (
              <div key={key} className="flex flex-col gap-1">
                <label className="font-medium text-xs">{filter.label}</label>
                {/* Replace with your multi-select UI as needed */}
                <Input
                  type="text"
                  value={
                    Array.isArray(values[key]) ? values[key].join(", ") : ""
                  }
                  readOnly
                  className="bg-muted h-8 cursor-pointer"
                  onClick={() => {}}
                />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};

export default ReportFilters;
