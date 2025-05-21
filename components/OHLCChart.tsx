import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  CrosshairMode,
  DeepPartial,
  ChartOptions,
} from "lightweight-charts";
import { useUdfHistory, HistoryTimeframe } from "@/hooks/useUDFHistory";
import { useTheme } from "@/hooks/useTheme";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "./ui/select";
import { SelectValue } from "@radix-ui/react-select";
import { Loader2 } from "lucide-react";
import { formatNumber } from "@/utils/format";

interface OHLCChartProps {
  height?: number;
  netUid: number;
}

const OHLCChart = ({ height = 500, netUid }: OHLCChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const theme = useTheme();

  const [timeframe, setTimeframe] = useState<HistoryTimeframe>("60min");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState({
    open: 0,
    high: 0,
    low: 0,
    close: 0,
    time: "",
  });

  const { data, loading } = useUdfHistory({ timeframe, netUid });

  useEffect(() => {
    // Clean up previous chart if it exists
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (error) {
        // Chart might already be disposed, ignore the error
        console.log("Chart already disposed");
      }
      chartRef.current = null;
    }

    if (chartContainerRef.current && data) {
      // Create a new chart
      const chartOptions: DeepPartial<ChartOptions> = {
        height: height - 10, // Subtract margin to prevent clipping
        width: chartContainerRef.current.clientWidth,
        layout: {
          background: {
            type: ColorType.Solid,
            color: theme === "dark" ? "#1A1A1A" : "#ffffff",
          },
          textColor: theme === "dark" ? "#D1D5DB" : "#333333",
        },
        localization: {
          priceFormatter: (price: number) => price.toFixed(4),
        },
        grid: {
          vertLines: { color: theme === "dark" ? "#374151" : "#f0f0f0" },
          horzLines: { color: theme === "dark" ? "#374151" : "#f0f0f0" },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: theme === "dark" ? "#4B5563" : "#d1d1d1",
          fixRightEdge: true,
          fixLeftEdge: true,
          rightOffset: 5,
        },
        rightPriceScale: {
          borderColor: theme === "dark" ? "#4B5563" : "#d1d1d1",
          entireTextOnly: true,
          autoScale: true,
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
      };

      const chart = createChart(chartContainerRef.current, chartOptions);

      // Add a candlestick series to the chart with the correct API for v5
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: theme === "dark" ? "#059669" : "#26a69a",
        downColor: theme === "dark" ? "#DC2626" : "#ef5350",
        borderVisible: false,
        wickUpColor: theme === "dark" ? "#059669" : "#26a69a",
        wickDownColor: theme === "dark" ? "#DC2626" : "#ef5350",
        priceFormat: {
          type: "price",
          precision: 8,
          minMove: 0.00000001,
        },
      });

      const chartData = data.t.map((timestamp: number, idx: number) => ({
        time: timestamp as any, // Convert ms to seconds
        open: data.o[idx],
        high: data.h[idx],
        low: data.l[idx],
        close: data.c[idx],
      }));

      // Set the data
      candlestickSeries.setData(chartData);

      // Fit the chart to data
      chart.timeScale().fitContent();

      // Add tooltip handling
      chart.subscribeCrosshairMove((param) => {
        if (
          param.point === undefined ||
          !param.time ||
          param.point.x < 0 ||
          param.point.x > (chartContainerRef.current?.clientWidth ?? 0) ||
          param.point.y < 0 ||
          param.point.y > height
        ) {
          // Crosshair moved out of chart or no time value found
          setTooltipVisible(false);
        } else {
          // Crosshair is over the chart, find the data for this point
          const dataPoint = param.seriesData.get(candlestickSeries) as any;

          if (dataPoint) {
            // Format date from timestamp
            const date = new Date(Number(param.time) * 1000);
            const formattedDate = date.toLocaleDateString();
            const formattedTime = date.toLocaleTimeString();

            setTooltipData({
              open: dataPoint.open,
              high: dataPoint.high,
              low: dataPoint.low,
              close: dataPoint.close,
              time: `${formattedDate} ${formattedTime}`,
            });
            setTooltipVisible(true);

            // Position the tooltip
            if (tooltipRef.current) {
              const tooltipWidth = tooltipRef.current.clientWidth;
              const tooltipHeight = tooltipRef.current.clientHeight;

              // Calculate position (keep tooltip inside chart bounds)
              let left = param.point.x + 15; // Add some margin from the cursor
              const containerWidth = chartContainerRef.current?.clientWidth;
              if (
                typeof containerWidth === "number" &&
                left + tooltipWidth > containerWidth
              ) {
                left = param.point.x - tooltipWidth - 15;
              }

              let top = param.point.y - tooltipHeight - 15;
              if (top < 0) {
                top = param.point.y + 15;
              }

              tooltipRef.current.style.left = `${left}px`;
              tooltipRef.current.style.top = `${top}px`;
            }
          } else {
            setTooltipVisible(false);
          }
        }
      });

      // Handle window resize
      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };

      window.addEventListener("resize", handleResize);

      // Save the chart reference for cleanup
      chartRef.current = chart;

      return () => {
        window.removeEventListener("resize", handleResize);
        try {
          chart.remove();
        } catch (error) {
          // Chart might already be disposed, ignore the error
          console.log("Chart already disposed during cleanup");
        }
      };
    }
  }, [data, height, theme, netUid]);

  const handleTimeframeChange = (value: HistoryTimeframe) => {
    setTimeframe(value);
  };

  return (
    <>
      <div className="flex gap-2 justify-end items-center mb-2">
        {loading && <Loader2 className="animate-spin opacity-50" />}
        <Select
          defaultValue="60min"
          value={timeframe}
          onValueChange={handleTimeframeChange}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="1min">1min</SelectItem>
              <SelectItem value="5min">5min</SelectItem>
              <SelectItem value="15min">15min</SelectItem>
              <SelectItem value="60min">60min</SelectItem>
              <SelectItem value="1day">1day</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="w-full border border-gray-200 dark:border-gray-700 rounded shadow-sm bg-white dark:bg-neutral-900 relative mb-1">
        {data === null ? (
          <div className="flex items-center justify-center h-[500px] text-gray-500 dark:text-gray-400">
            No data available. Please load chart data.
          </div>
        ) : (
          <>
            <div ref={chartContainerRef} className="w-full" />
            {tooltipVisible && (
              <div
                ref={tooltipRef}
                className="absolute bg-white dark:bg-neutral-800 p-2 rounded shadow-md border border-gray-200 dark:border-neutral-700 text-sm z-10"
              >
                <div className="font-medium text-gray-700 dark:text-gray-200">
                  {tooltipData.time}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                  <div className="text-gray-600 dark:text-gray-400">Open:</div>
                  <div className="text-right font-medium text-gray-800 dark:text-gray-100">
                    {formatNumber(tooltipData.open, 8)}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">High:</div>
                  <div className="text-right font-medium text-green-600 dark:text-green-400">
                    {formatNumber(tooltipData.high, 8)}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Low:</div>
                  <div className="text-right font-medium text-red-600 dark:text-red-400">
                    {formatNumber(tooltipData.low, 8)}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Close:</div>
                  <div className="text-right font-medium text-gray-800 dark:text-gray-100">
                    {formatNumber(tooltipData.close, 8)}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default OHLCChart;
