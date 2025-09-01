import { ChartContainer, type ChartConfig } from "@/shared/components/ui/chart";
import type { PieChartConfig, ReportItemConfig } from "@/shared/types/report";
import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

type PieChartData = {
  [key: string]: any;
}[];

interface ReportRendererProps {
  config: ReportItemConfig;
  data?: PieChartData; // Optional data prop for rendering
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

const ReportPieChart = ({ config, data }: ReportRendererProps) => {
  const mapping = config.mapping as PieChartConfig;

  const chartConfig: ChartConfig = {};

  console.log("mapping", mapping);

  if (!data || data.length === 0) {
    return <div>No data available for Pie Chart</div>;
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <PieChart className="size-full">
        <Pie
          data={data}
          dataKey={mapping.valueKey}
          nameKey={mapping.labelKey}
          cx="50%"
          cy="50%"
          outerRadius="80%"
          fill="#8884d8"
          label
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend />
      </PieChart>
    </ChartContainer>
  );
};

export default ReportPieChart;
