import { ReportType, type ReportItem } from "@/shared/types/report";
import { type ComponentType } from "react";
import Pocketbase from "pocketbase";
import ReportLineChart from "./line-chart";
interface ReportRendererProps {
  item: ReportItem;
  pb: Pocketbase;
}
const Placeholder = () => <div>Not implemented</div>;

const ChartRender: Record<ReportType, ComponentType<any>> = {
  [ReportType.LINE_CHART]: ReportLineChart,
  [ReportType.BAR_CHART]: Placeholder,
  [ReportType.PIE_CHART]: Placeholder,
  [ReportType.TABLE]: Placeholder,
  [ReportType.TEXT]: Placeholder,
};

/* 
data_query:

const query=async (pb)=>{
  const data = await pb.collection("report").getList({
    filter: `report="${item.report}"`,
    expand: "report",
    sort: "-created",
  });
  return data.items;
}


*/

const ReportRenderer = ({ item, pb }: ReportRendererProps) => {
  const ChartComponent =
    ChartRender[item.element_type || ReportType.LINE_CHART];

  const data = item.cached_data;
  const config = item.config;

  if (!data || !config) {
    return (
      <div className="flex justify-center items-center bg-gray-200 rounded-lg w-full aspect-video">
        <span className="text-gray-500">No data or config available</span>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 rounded-lg w-full aspect-video overflow-hidden">
      {item.element_type && <ChartComponent data={data} config={item.config} />}
    </div>
  );
};

export default ReportRenderer;
