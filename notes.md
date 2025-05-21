import React from "react";
import {
LineChart,
Line,
BarChart,
Bar,
PieChart,
Pie,
XAxis,
YAxis,
CartesianGrid,
Tooltip,
Legend,
ResponsiveContainer,
Cell,
AreaChart,
Area,
ComposedChart,
} from "recharts";
import { formatNumber, formatTaoValue, formatAlphaValue } from "@/utils/format";

interface NetworkChartsProps {
stakingData: any[];
subnets: any[];
networkMetrics: {
totalVolume: number;
totalTransactions: number;
buySellRatio: number;
totalTaoInPools: number;
rootTao: number;
totalStakedAlpha: number;
rootEmission: number;
sumAlphaPrices: number;
};
selectedSubnet?: number | null;
alphaPrices: Record<number, number>;
timeframe?: "daily" | "weekly" | "monthly" | "blocks";
}

export const NetworkCharts = ({
stakingData,
subnets,
networkMetrics,
selectedSubnet,
alphaPrices,
timeframe = "daily",
}: NetworkChartsProps) => {
// Update the sorting to use the same date handling
const volumeData = stakingData
.reduce((acc: any[], record) => {
let date;
if (timeframe === "blocks") {
date = `Blocks ${record.block_start}-${record.block_end}`;
} else if (timeframe === "monthly") {
date = record.month_start;
} else {
date = record.date || record.week_start;
}

      // Only adjust the date if it's not a blocks timeframe
      let adjustedDate = date;
      if (timeframe !== "blocks") {
        try {
          // Handle different date formats
          let dateObj;
          if (date.includes("-")) {
            // Handle YYYY-MM-DD format
            dateObj = new Date(date);
          } else if (date.includes("/")) {
            // Handle MM/DD/YYYY format
            const [month, day, year] = date.split("/");
            dateObj = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day)
            );
          } else {
            // Try parsing as is
            dateObj = new Date(date);
          }

          if (isNaN(dateObj.getTime())) {
            console.error("Invalid date:", date);
            return acc;
          }

          dateObj.setUTCHours(12);
          adjustedDate = dateObj.toISOString().split("T")[0];
        } catch (error) {
          console.error("Error processing date:", date, error);
          return acc;
        }
      }

      // Find existing entry for this date
      const existingEntry = acc.find((item) => item.date === adjustedDate);

      if (existingEntry) {
        // For the same date, we should only update if this is a new subnet or if the record is more recent
        const existingSubnetEntry = existingEntry.subnets?.[record.net_uid];
        if (
          !existingSubnetEntry ||
          (record.block_number &&
            record.block_number > existingSubnetEntry.block_number)
        ) {
          // Update the totals by subtracting the old subnet values and adding the new ones
          existingEntry.buy =
            (existingEntry.buy || 0) -
            (existingSubnetEntry?.buy_volume_tao || 0) +
            (record.buy_volume_tao || 0);
          existingEntry.sell =
            (existingEntry.sell || 0) -
            (existingSubnetEntry?.sell_volume_tao || 0) +
            (record.sell_volume_tao || 0);
          existingEntry.total = existingEntry.buy + existingEntry.sell;

          // Update the subnet record
          if (!existingEntry.subnets) existingEntry.subnets = {};
          existingEntry.subnets[record.net_uid] = {
            buy_volume_tao: record.buy_volume_tao,
            sell_volume_tao: record.sell_volume_tao,
            block_number: record.block_number,
          };
        }
      } else {
        // Create new entry
        acc.push({
          date: adjustedDate,
          block_start: record.block_start,
          block_end: record.block_end,
          month_start: record.month_start,
          month_end: record.month_end,
          buy: record.buy_volume_tao || 0,
          sell: record.sell_volume_tao || 0,
          total: (record.buy_volume_tao || 0) + (record.sell_volume_tao || 0),
          subnets: {
            [record.net_uid]: {
              buy_volume_tao: record.buy_volume_tao,
              sell_volume_tao: record.sell_volume_tao,
              block_number: record.block_number,
            },
          },
        });
      }
      return acc;
    }, [])
    .sort((a, b) => {
      if (timeframe === "blocks") {
        return (a.block_start || 0) - (b.block_start || 0);
      }
      return a.date.localeCompare(b.date);
    });

// For blocks timeframe, only show last 5 entries
const displayData =
timeframe === "blocks" ? volumeData.slice(-5) : volumeData;

// Format date for display
const formatDate = (date: string) => {
if (timeframe === "blocks") {
// Extract the start block number from the format "Blocks X-Y"
const startBlock = date.split(" ")[1].split("-")[0];
// Format as "B5.27M" for 5270000
const blockNum = parseInt(startBlock);
if (blockNum >= 1000000) {
return `B${(blockNum / 1000000).toFixed(2)}M`;
} else if (blockNum >= 1000) {
return `B${(blockNum / 1000).toFixed(1)}K`;
}
return `B${blockNum}`;
}
if (timeframe === "monthly") {
const [year, month] = date.split("-");
const monthNames = [
"Jan",
"Feb",
"Mar",
"Apr",
"May",
"Jun",
"Jul",
"Aug",
"Sep",
"Oct",
"Nov",
"Dec",
];
const monthName = monthNames[parseInt(month) - 1];
return `${monthName} ${year}`;
}

    // The date is already in UTC format from our earlier processing
    const [year, month, day] = date.split("-");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthName = monthNames[parseInt(month) - 1];

    return `${monthName} ${parseInt(day)}, ${year}`;

};

// Prepare data for transactions chart
const transactionData = stakingData.map((record) => ({
date: record.date || record.week_start,
buys: record.buys,
sells: record.sells,
total: record.buys + record.sells,
}));

// Prepare data for buy/sell ratio pie chart
const buySellData = [
{
name: "Buy",
value:
networkMetrics.totalVolume *
(networkMetrics.buySellRatio / (1 + networkMetrics.buySellRatio)),
},
{
name: "Sell",
value:
networkMetrics.totalVolume * (1 / (1 + networkMetrics.buySellRatio)),
},
];

// Prepare subnet-specific data
const subnetData =
selectedSubnet !== null
? stakingData
.filter((record) => record.net_uid === selectedSubnet)
.map((record) => {
let date;
if (timeframe === "blocks") {
date = `Blocks ${record.block_start}-${record.block_end}`;
} else if (timeframe === "monthly") {
date = record.month_start;
} else {
date = record.date || record.week_start;
}

            // Only adjust the date if it's not a blocks timeframe
            let adjustedDate = date;
            if (timeframe !== "blocks") {
              try {
                // Handle different date formats
                let dateObj;
                if (date.includes("-")) {
                  // Handle YYYY-MM-DD format
                  dateObj = new Date(date);
                } else if (date.includes("/")) {
                  // Handle MM/DD/YYYY format
                  const [month, day, year] = date.split("/");
                  dateObj = new Date(
                    parseInt(year),
                    parseInt(month) - 1,
                    parseInt(day)
                  );
                } else {
                  // Try parsing as is
                  dateObj = new Date(date);
                }

                if (isNaN(dateObj.getTime())) {
                  console.error("Invalid date:", date);
                  return null;
                }

                dateObj.setUTCHours(12);
                adjustedDate = dateObj.toISOString().split("T")[0];
              } catch (error) {
                console.error("Error processing date:", date, error);
                return null;
              }
            }

            return {
              date: adjustedDate,
              block_start: record.block_start,
              block_end: record.block_end,
              month_start: record.month_start,
              month_end: record.month_end,
              buyVolume: record.buy_volume_tao,
              sellVolume: record.sell_volume_tao,
              netVolume: record.buy_volume_tao - record.sell_volume_tao,
              buys: parseInt(record.buys || 0),
              sells: parseInt(record.sells || 0),
              totalTransactions:
                parseInt(record.buys || 0) + parseInt(record.sells || 0),
              uniqueBuyers: record.buyers?.length || 0,
              uniqueSellers: record.sellers?.length || 0,
            };
          })
          .filter(Boolean) // Remove any null entries from failed date parsing
          .sort((a: any, b: any) => {
            if (timeframe === "blocks") {
              return (a.block_start || 0) - (b.block_start || 0);
            }
            return a.date.localeCompare(b.date);
          })
      : [];

// For blocks timeframe, only show last 5 entries for subnet data
const displaySubnetData =
timeframe === "blocks" ? subnetData.slice(-5) : subnetData;

const COLORS = ["#3B82F6", "#EF4444"];

// Update the tooltip formatter to handle both date types
const formatTooltipDate = (label: string) => {
if (timeframe === "blocks") return label;
const dateObj = new Date(label);
dateObj.setUTCHours(12);
return dateObj.toLocaleDateString("en-US", {
year: "numeric",
month: "short",
day: "numeric",
timeZone: "UTC",
});
};

return (

<div className="space-y-8">
{/_ Network-wide charts _/}
<div className="grid grid-cols-1 gap-8">
{/_ Volume Chart _/}
<div className="bg-white rounded-lg shadow p-6">
<h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
TAO Volume Over Time
</h3>
<div className="h-80">
<ResponsiveContainer width="100%" height="100%">
<LineChart data={displayData}>
<CartesianGrid strokeDasharray="3 3" />
<XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  interval="preserveStartEnd"
                  minTickGap={50}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
<YAxis
tickFormatter={(value) => `${formatNumber(value)} TAO`}
width={100}
/>
<Tooltip
formatter={(value: number) => [
`${formatNumber(value)} TAO`,
"",
]}
labelFormatter={formatTooltipDate}
/>
<Legend />
<Line
                  type="monotone"
                  dataKey="buy"
                  stroke="#10B981"
                  name="Buy Volume"
                />
<Line
                  type="monotone"
                  dataKey="sell"
                  stroke="#EF4444"
                  name="Sell Volume"
                />
<Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3B82F6"
                  name="Total Volume"
                />
</LineChart>
</ResponsiveContainer>
</div>
</div>
</div>

      {/* Subnet-specific charts */}
      {selectedSubnet !== null && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Subnet Volume Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Subnet {selectedSubnet} Volume
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displaySubnetData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    interval="preserveStartEnd"
                    minTickGap={50}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tickFormatter={(value) => `${formatNumber(value)} TAO`}
                    width={100}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `${formatNumber(value)} TAO`,
                      "",
                    ]}
                    labelFormatter={formatTooltipDate}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="buyVolume"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    name="Buy Volume"
                  />
                  <Area
                    type="monotone"
                    dataKey="sellVolume"
                    stackId="1"
                    stroke="#EF4444"
                    fill="#EF4444"
                    name="Sell Volume"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subnet Transactions Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Subnet {selectedSubnet} Transactions
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displaySubnetData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    interval="preserveStartEnd"
                    minTickGap={50}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number, name: string, props: any) => {
                      const data = props.payload;
                      if (!data)
                        return ["0 buys, 0 sells (0 total)", "Transactions"];
                      return [
                        `${formatNumber(data.buys)} buys, ${formatNumber(
                          data.sells
                        )} sells (${formatNumber(
                          data.totalTransactions
                        )} total)`,
                        "Transactions",
                      ];
                    }}
                    labelFormatter={formatTooltipDate}
                  />
                  <Legend />
                  <Bar
                    dataKey="totalTransactions"
                    fill="#3B82F6"
                    name="Total Transactions"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subnet Net Volume Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Subnet {selectedSubnet} Net Volume
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={displaySubnetData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    interval="preserveStartEnd"
                    minTickGap={50}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tickFormatter={(value) => `${formatNumber(value)} TAO`}
                    width={100}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `${formatNumber(value)} TAO`,
                      "",
                    ]}
                    labelFormatter={formatTooltipDate}
                  />
                  <Legend />
                  <Bar dataKey="netVolume" fill="#3B82F6" name="Net Volume">
                    {displaySubnetData.map((entry: any, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.netVolume >= 0 ? "#3B82F6" : "#EF4444"}
                      />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>

);
};
