export enum ReportType {
  LINE_CHART = "line_chart",
  BAR_CHART = "bar_chart",
  PIE_CHART = "pie_chart",
  TABLE = "table",
  TEXT = "text",
}
export const REPORT_TYPES = Object.values(ReportType);

export interface Report {
  id: string;
  title: string;
  collection: string;
  filter?: string;
  sort?: string;
  expand?: string;
  fields?: string[];
  order: number;
  color?: string;
  created: string;
  updated: string;
}

export interface ReportItemConfig {
  filters: Record<string, FilterItem>;
  mapping: Record<string, any>;
  filters_values: Record<string, any>;
  selected_collections?: string[];
}

export interface ReportItem {
  id: string;
  title: string;
  element_type?: ReportType;
  config?: ReportItemConfig;
  cached_data?: any;
  cache_seconds?: number;
  last_cache?: string;
  order: number;
  layout: {
    w: number;
    h: number;
    x: number;
    y: number;
  };
  data_query?: string;
  report: string;
  created: string;
  updated: string;
}

export interface LineChartConfig {
  xAxis: {
    key: string;
    formater?: (value: any) => string;
  };
  dataset: {
    key: string;
    label?: string;
    formater?: (value: any) => string;
  }[];
}

export interface ReportConfigData {
  inputs: Array<{
    name: string;
    label: string;
    type: "text" | "array";
    required?: boolean;
    object_schema?: { name: string; type: string; example?: string }[];
  }>;
}
export const ReportConfigs: Partial<Record<ReportType, ReportConfigData>> = {
  [ReportType.LINE_CHART]: {
    inputs: [
      {
        name: "xAxis",
        label: "X-Axis",
        type: "text",
        required: true,
      },
      {
        name: "dataset",
        label: "Dataset",
        type: "array",
        object_schema: [
          { name: "key", type: "text", example: "value" },
          { name: "label", type: "text", example: "Value" },
        ],
      },
    ],
  },
};

/* 
{
   xAxis: {
     key: "date",
     formater: (value) => new Date(value).toLocaleDateString(),
   },
   dataset: [
     {
       key: "value",
    }
  ]
}

*/

export interface FilterItem {
  type: "text" | "num-range" | "select" | "multi-select";
  label: string;
  options?: {
    value: string;
    label: string;
  }[]; // for select and multi-select
  min?: number; // for num-range
  max?: number; // for num-range
  defaultValue?: string | string[]; // default value
}
