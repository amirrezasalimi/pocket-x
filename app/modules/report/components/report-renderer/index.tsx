import { ReportType, type ReportItem } from "@/shared/types/report";
import { type ComponentType } from "react";
import ReportLineChart from "./line-chart";
import ReportPieChart from "./pie-chart";
import { Loader2 } from "lucide-react";

interface ReportRendererProps {
  item: ReportItem;
  isLoading?: boolean;
}
const Placeholder = () => <div>Not implemented</div>;

const ChartRender: Record<ReportType, ComponentType<any>> = {
  [ReportType.LINE_CHART]: ReportLineChart,
  [ReportType.BAR_CHART]: Placeholder,
  [ReportType.PIE_CHART]: ReportPieChart,
  [ReportType.TABLE]: Placeholder,
  [ReportType.TEXT]: Placeholder,
};

const ReportRenderer = ({ item, isLoading }: ReportRendererProps) => {
  const ChartComponent =
    ChartRender[item.element_type || ReportType.LINE_CHART];

  const data = item.cached_data;
  const config = item.config;
  const mapping = config?.mapping || {};
  const noData = (!data || Object.keys(mapping).length == 0) && !isLoading;
  if (noData) {
    return (
      <div className="flex justify-center items-center bg-gray-200 rounded-lg w-full h-full">
        <span className="text-gray-500">No data or config available</span>
      </div>
    );
  }

  return (
    <div className="relative bg-neutral-50 rounded-lg w-full h-full overflow-hidden">
      <div
        className={`absolute inset-0 justify-center items-center z-10 flex  bg-black/20 rounded-lg w-full
        h-full ${isLoading ? "pointer-events-none" : "hidden"}
        `}
      >
        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
      </div>
      {item.element_type && data && item.config && (
        <ChartComponent data={data} config={item.config} />
      )}
    </div>
  );
};

export default ReportRenderer;
