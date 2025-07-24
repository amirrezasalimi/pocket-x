import type { LineChartConfig } from "@/shared/types/report";
import { CartesianGrid, Legend, Line, LineChart, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/components/ui/chart";

type LineChartData = {
  [key: string]: any;
}[];

const colors = [];
interface ReportRendererProps {
  config: LineChartConfig;
  data?: LineChartData; // Optional data prop for rendering
}
const ReportLineChart = ({ config, data }: ReportRendererProps) => {
  const chartConfig: ChartConfig = {};

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <LineChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <Legend />
        <XAxis
          dataKey={config.xAxis.key}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        {config.dataset.map((dataset, index) => (
          <Line
            key={index}
            dataKey={dataset.key}
            label={dataset?.label}
            type="monotone"
            stroke={`var(--chart-${index + 1})`}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
};

export default ReportLineChart;
