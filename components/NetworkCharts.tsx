import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
  ReferenceLine,
} from "recharts";
import {
  formatNumber,
  formatTransactionCount,
  formatTaoValue,
  formatAlphaValue,
} from "@/utils/format";
import {
  StakingStatsBlocksRecord,
  StakingStatsRecord,
  StakingStatsTemporalRecord,
} from "@/types";
import { StatsTimeframe } from "@/types/staking";
import { useTheme } from "@/hooks/useTheme";

interface NetworkChartsProps {
  stakingData: StakingStatsRecord[];
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
  selectedSubnet: number | null;
  alphaPrices: Record<number, number>;
  timeframe?: StatsTimeframe;
  
  // New props for network-wide charts
  showNetworkWideTradingVolumeChart?: boolean;
  showNetworkWideTransactionsChart?: boolean;

  // Props for subnet-specific charts (defaults to true for backward compatibility)
  showTradingVolumeChart?: boolean; // This is for subnet-specific Trading Volume (TAO)
  showSubnetVolumeChart?: boolean;
  showSubnetTransactionsChart?: boolean; // This is for subnet-specific Transactions
  showSubnetNetVolumeChart?: boolean;
}

export const NetworkCharts: React.FC<NetworkChartsProps> = ({
  stakingData,
  // networkMetrics, // This prop is available but might not be directly used by all charts if data comes from processed stakingData
  selectedSubnet,
  timeframe = "daily",
  
  showNetworkWideTradingVolumeChart = false,
  showNetworkWideTransactionsChart = false,
  showTradingVolumeChart = true, 
  showSubnetVolumeChart = true,
  showSubnetTransactionsChart = true, 
  showSubnetNetVolumeChart = true,
}) => {
  const theme = useTheme();

  const chartColors = React.useMemo(() => {
    const isDark = theme === "dark";
    return {
      buy: isDark ? "hsl(var(--chart-2-dark))" : "hsl(var(--chart-2))",
      sell: isDark ? "hsl(var(--chart-3-dark))" : "hsl(var(--chart-3))",
      net: isDark ? "hsl(var(--chart-1-dark))" : "hsl(var(--chart-1))",
      transactions: isDark ? "hsl(var(--chart-1-dark))" : "hsl(var(--chart-1))",
      grid: isDark ? "hsl(var(--border-dark))" : "hsl(var(--border))",
      text: isDark ? "hsl(var(--muted-foreground-dark))" : "hsl(var(--muted-foreground))",
      tooltipBg: isDark ? "hsl(var(--popover-dark))" : "hsl(var(--popover))",
      tooltipBorder: isDark ? "hsl(var(--border-dark))" : "hsl(var(--border))",
      tooltipText: isDark ? "hsl(var(--popover-foreground-dark))" : "hsl(var(--popover-foreground))",
      
      buyFallback: isDark ? "#10B981" : "#10B981",
      sellFallback: isDark ? "#EF4444" : "#EF4444",
      netFallback: isDark ? "#3B82F6" : "#3B82F6",
      transactionsFallback: isDark ? "#3B82F6" : "#3B82F6",
      gridFallback: isDark ? "rgba(255, 255, 255, 0.1)" : "#E5E7EB",
      textFallback: isDark ? "#9CA3AF" : "#6B7280",
      tooltipBgFallback: isDark ? "#1F2937" : "#FFFFFF",
      tooltipBorderFallback: isDark ? "#374151" : "#E5E7EB",
      tooltipTextFallback: isDark ? "#F3F4F6" : "#111827",
    };
  }, [theme]);

  const processedVolumeAndTransactionData = React.useMemo(() => {
    const data = stakingData
      .filter((record) => {
        if (!record || Object.keys(record).length === 0) return false;
        return (
          (record as StakingStatsTemporalRecord).tsStart ||
          ((record as StakingStatsBlocksRecord).blockStart &&
            (record as StakingStatsBlocksRecord).blockEnd)
        );
      })
      .reduce((acc: any[], record: StakingStatsRecord) => {
        let date: string;
        let blockStartNum: number | undefined = undefined;

        if (timeframe === "blocks") {
          const blockRecord = record as StakingStatsBlocksRecord;
          date = `Blocks ${blockRecord.blockStart}-${blockRecord.blockEnd}`;
          blockStartNum = blockRecord.blockStart;
        } else {
          date = (record as StakingStatsTemporalRecord).tsStart || "";
        }

        let adjustedDate = date;
        if (timeframe !== "blocks" && date) {
          try {
            let dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) {
                if (date.includes("/")) {
                    const parts = date.split("/");
                    dateObj = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                }
            }
            if (isNaN(dateObj.getTime())) {
                 return acc;
            }
            dateObj.setUTCHours(12);
            adjustedDate = dateObj.toISOString().split("T")[0];
          } catch (error) {
            return acc;
          }
        }
        
        const existingEntry = acc.find((item) => item.date === adjustedDate);
        
        const currentBuyVolumeTao = parseFloat(record.buyVolumeTao || "0");
        const currentSellVolumeTao = parseFloat(record.sellVolumeTao || "0");
        const currentBuys = record.buys || 0;
        const currentSells = record.sells || 0;

        if (existingEntry) {
          existingEntry.networkBuyVolumeTao = (existingEntry.networkBuyVolumeTao || 0) + currentBuyVolumeTao;
          existingEntry.networkSellVolumeTao = (existingEntry.networkSellVolumeTao || 0) + currentSellVolumeTao;
          existingEntry.networkTotalVolumeTao = existingEntry.networkBuyVolumeTao + existingEntry.networkSellVolumeTao;
          
          existingEntry.networkTotalBuys = (existingEntry.networkTotalBuys || 0) + currentBuys;
          existingEntry.networkTotalSells = (existingEntry.networkTotalSells || 0) + currentSells;
          existingEntry.networkTotalTransactions = existingEntry.networkTotalBuys + existingEntry.networkTotalSells;

          if (record.netUid !== undefined) {
            if (!existingEntry.subnets) existingEntry.subnets = {};
            if (!existingEntry.subnets[record.netUid]) {
                 existingEntry.subnets[record.netUid] = {
                    buyVolumeTao: 0,
                    sellVolumeTao: 0,
                    buys: 0,
                    sells: 0,
                    totalTransactions: 0,
                 };
            }
            existingEntry.subnets[record.netUid].buyVolumeTao += currentBuyVolumeTao;
            existingEntry.subnets[record.netUid].sellVolumeTao += currentSellVolumeTao;
            existingEntry.subnets[record.netUid].buys += currentBuys;
            existingEntry.subnets[record.netUid].sells += currentSells;
            existingEntry.subnets[record.netUid].totalTransactions = existingEntry.subnets[record.netUid].buys + existingEntry.subnets[record.netUid].sells;
          }

        } else {
          const newEntry: any = {
            date: adjustedDate,
            networkBuyVolumeTao: currentBuyVolumeTao,
            networkSellVolumeTao: currentSellVolumeTao,
            networkTotalVolumeTao: currentBuyVolumeTao + currentSellVolumeTao,
            networkTotalBuys: currentBuys,
            networkTotalSells: currentSells,
            networkTotalTransactions: currentBuys + currentSells,
            subnets: {},
          };
          if (blockStartNum !== undefined) {
            newEntry.block_start = blockStartNum;
          }
           if (record.netUid !== undefined) {
             newEntry.subnets[record.netUid] = {
                buyVolumeTao: currentBuyVolumeTao,
                sellVolumeTao: currentSellVolumeTao,
                buys: currentBuys,
                sells: currentSells,
                totalTransactions: currentBuys + currentSells,
             };
           }
          acc.push(newEntry);
        }
        return acc;
      }, [])
      .sort((a, b) => {
        if (timeframe === "blocks") {
          return (a.block_start || 0) - (b.block_start || 0);
        }
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (isNaN(dateA) || isNaN(dateB)) return 0;
        return dateA - dateB;
      });
      if (timeframe === "blocks") {
        return data.length > 10 ? data.slice(-10) : data;
      }
      return data;
  }, [stakingData, timeframe]);


  const subnetSpecificChartData = React.useMemo(() => {
    if (selectedSubnet === null) return [];
    
    return stakingData
      .filter((record: StakingStatsRecord) => record.netUid === selectedSubnet)
      .map((record: StakingStatsRecord) => {
        let date: string | null = null;
        if (timeframe === "blocks") {
          const blockRecord = record as StakingStatsBlocksRecord;
          if (!blockRecord.blockStart || !blockRecord.blockEnd) return null;
          date = `Blocks ${blockRecord.blockStart}-${blockRecord.blockEnd}`;
        } else {
          const dateRecord = record as StakingStatsTemporalRecord;
          date = dateRecord.tsStart || null;
        }

        let adjustedDate = date;
        if (timeframe !== "blocks" && date) {
          try {
            let dateObj = new Date(date);
             if (isNaN(dateObj.getTime())) { 
                if (date.includes("/")) {
                    const parts = date.split("/");
                    dateObj = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                }
            }
            if (isNaN(dateObj.getTime())) return null;
            dateObj.setUTCHours(12);
            adjustedDate = dateObj.toISOString().split("T")[0];
          } catch (error) {
            return null;
          }
        }
        if (!adjustedDate) return null;

        return {
          date: adjustedDate,
          block_start: (record as StakingStatsBlocksRecord).blockStart,
          block_end: (record as StakingStatsBlocksRecord).blockEnd,
          
          taoBuyVolume: parseFloat(record.buyVolumeTao || "0"),
          taoSellVolumeForStack: record.sellVolumeTao ? -parseFloat(record.sellVolumeTao) : 0,
          taoNetVolume: parseFloat(record.buyVolumeTao || "0") - parseFloat(record.sellVolumeTao || "0"),

          alphaBuyVolume: parseFloat(record.buyVolumeAlpha || "0"), 
          alphaSellVolumeForStack: record.sellVolumeAlpha ? -parseFloat(record.sellVolumeAlpha) : 0, 

          buys: record.buys || 0,
          sells: record.sells || 0,
          totalTransactions: (record.buys || 0) + (record.sells || 0),
        };
      })
      .filter(Boolean) 
      .sort((a: any, b: any) => {
        if (!a || !b || !a.date || !b.date) return 0;
        if (timeframe === "blocks") {
          return (a.block_start || 0) - (b.block_start || 0);
        }
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (isNaN(dateA) || isNaN(dateB)) return 0;
        return dateA - dateB;
      });
  }, [selectedSubnet, stakingData, timeframe]);

  const displaySubnetData = timeframe === "blocks" ? (subnetSpecificChartData.length > 10 ? subnetSpecificChartData.slice(-10) : subnetSpecificChartData) : subnetSpecificChartData;
  const displayNetworkData = timeframe === "blocks" ? (processedVolumeAndTransactionData.length > 10 ? processedVolumeAndTransactionData.slice(-10) : processedVolumeAndTransactionData) : processedVolumeAndTransactionData;


  const formatDate = (date: string) => {
    if (!date) return "";
    if (timeframe === "blocks" && date.startsWith("Blocks")) {
      const parts = date.split(" ")[1];
      if (parts) {
        const [startBlock, endBlock] = parts.split("-");
        return `${startBlock}-${endBlock}`;
      }
      return date;
    }
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return date;
      return dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
    } catch (error) {
      return date;
    }
  };

  const formatTooltipDate = (label: string) => {
    if (!label) return "";
    if (timeframe === "blocks" && label.startsWith("Blocks")) return label;
    const dateObj = new Date(label);
    if (isNaN(dateObj.getTime())) return label;
    dateObj.setUTCHours(12);
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  const NetworkVolumeTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && label) {
      const entry = payload[0].payload;
      const buy = entry.networkBuyVolumeTao || 0;
      const sell = entry.networkSellVolumeTao || 0;
      const total = entry.networkTotalVolumeTao || buy + sell;
      const net = buy - sell;

      return (
        <div 
          className="rounded-md p-3 shadow-sm text-sm"
          style={{ 
            backgroundColor: chartColors.tooltipBgFallback, 
            border: `1px solid ${chartColors.tooltipBorderFallback}`,
            color: chartColors.tooltipTextFallback 
          }}
        >
          <div className="font-medium mb-1" style={{ color: chartColors.tooltipTextFallback }}>
            {formatTooltipDate(label)}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span style={{ color: theme === 'dark' ? 'hsl(var(--muted-foreground-dark))' : 'hsl(var(--muted-foreground))' }}>Buy Volume:</span>
              <span className="font-medium" style={{ color: chartColors.buyFallback }}>
                {formatTaoValue(buy)} τ
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: theme === 'dark' ? 'hsl(var(--muted-foreground-dark))' : 'hsl(var(--muted-foreground))' }}>Sell Volume:</span>
              <span className="font-medium" style={{ color: chartColors.sellFallback }}>
                {formatTaoValue(sell)} τ
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t" style={{ borderColor: chartColors.gridFallback }}>
              <span style={{ color: theme === 'dark' ? 'hsl(var(--muted-foreground-dark))' : 'hsl(var(--muted-foreground))' }}>Total Volume:</span>
              <span className="font-medium" style={{ color: chartColors.tooltipTextFallback }}>
                {formatTaoValue(total)} τ
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: theme === 'dark' ? 'hsl(var(--muted-foreground-dark))' : 'hsl(var(--muted-foreground))' }}>Net Volume:</span>
              <span
                className="font-medium"
                 style={{ color: net >= 0 ? chartColors.buyFallback : chartColors.sellFallback }}
              >
                {net >= 0 ? "+" : ""}
                {formatTaoValue(net)} τ
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  const NetworkTransactionsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && label) {
      const entry = payload[0].payload;
      const buys = entry.networkTotalBuys || 0;
      const sells = entry.networkTotalSells || 0;
      const total = entry.networkTotalTransactions || 0;
      return (
        <div 
          className="rounded-md p-3 shadow-sm text-sm"
          style={{ 
            backgroundColor: chartColors.tooltipBgFallback, 
            border: `1px solid ${chartColors.tooltipBorderFallback}`,
            color: chartColors.tooltipTextFallback 
          }}
        >
          <div className="font-medium mb-1" style={{color: chartColors.tooltipTextFallback}}>{formatTooltipDate(label)}</div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span style={{ color: theme === 'dark' ? 'hsl(var(--muted-foreground-dark))' : 'hsl(var(--muted-foreground))' }}>Buy Transactions:</span>
              <span className="font-medium" style={{color: chartColors.tooltipTextFallback}}>{formatTransactionCount(buys)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: theme === 'dark' ? 'hsl(var(--muted-foreground-dark))' : 'hsl(var(--muted-foreground))' }}>Sell Transactions:</span>
              <span className="font-medium" style={{color: chartColors.tooltipTextFallback}}>{formatTransactionCount(sells)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t" style={{ borderColor: chartColors.gridFallback }}>
              <span style={{ color: theme === 'dark' ? 'hsl(var(--muted-foreground-dark))' : 'hsl(var(--muted-foreground))' }}>Total Transactions:</span>
              <span className="font-medium" style={{color: chartColors.tooltipTextFallback}}>{formatTransactionCount(total)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderNetworkWideCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {showNetworkWideTradingVolumeChart && (
        <div className="bg-background rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow duration-300">
          <h3 className="text-lg font-medium text-foreground mb-4">
            Trading Volume (TAO) - Network Wide
          </h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayNetworkData} margin={{ top: 5, right: 10, bottom: 20, left: 15 }}>
                <defs>
                  <linearGradient id="networkWideVolumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.netFallback} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={chartColors.netFallback} stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridFallback} />
                <XAxis dataKey="date" tickFormatter={formatDate} height={60} angle={-45} textAnchor="end" tick={{ fill: chartColors.textFallback, fontSize: 12 }} axisLine={{ stroke: chartColors.gridFallback }} />
                <YAxis yAxisId="left" tickFormatter={(value) => `${formatTaoValue(value)}τ`} tick={{ fill: chartColors.textFallback, fontSize: 12 }} axisLine={{ stroke: chartColors.gridFallback }} />
                <Tooltip content={<NetworkVolumeTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, color: chartColors.textFallback }} />
                <Bar yAxisId="left" dataKey="networkTotalVolumeTao" name="Total Volume" fill="url(#networkWideVolumeGradient)" radius={[4, 4, 0, 0]} barSize={20}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {showNetworkWideTransactionsChart && (
        <div className="bg-background rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow duration-300">
          <h3 className="text-lg font-medium text-foreground mb-4">
            Network Transactions
          </h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayNetworkData} margin={{ top: 5, right: 10, bottom: 20, left: 15 }}>
                <defs>
                  <linearGradient id="networkWideTransactionsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.transactionsFallback} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={chartColors.transactionsFallback} stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridFallback} />
                <XAxis dataKey="date" tickFormatter={formatDate} height={60} angle={-45} textAnchor="end" tick={{ fill: chartColors.textFallback, fontSize: 12 }} axisLine={{ stroke: chartColors.gridFallback }} />
                <YAxis tickFormatter={(value) => formatTransactionCount(value)} tick={{ fill: chartColors.textFallback, fontSize: 12 }} axisLine={{ stroke: chartColors.gridFallback }} />
                <Tooltip content={<NetworkTransactionsTooltip />}/>
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, color: chartColors.textFallback }} />
                <Bar dataKey="networkTotalTransactions" name="Total Transactions" fill="url(#networkWideTransactionsGradient)" radius={[4, 4, 0, 0]} barSize={20}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );

  const renderSubnetSpecificCharts = () => (
    selectedSubnet !== null && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {showTradingVolumeChart && (
          <div className="bg-background rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow duration-300">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Trading Volume (TAO) - Subnet {selectedSubnet}
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displaySubnetData} margin={{ top: 5, right: 20, bottom: 60, left: 20 }}>
                  <defs>
                    <linearGradient id="subnetTaoBuyAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.buyFallback} stopOpacity={0.7} />
                      <stop offset="95%" stopColor={chartColors.buyFallback} stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="subnetTaoSellAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.sellFallback} stopOpacity={0.1} />
                      <stop offset="95%" stopColor={chartColors.sellFallback} stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridFallback} />
                  <XAxis dataKey="date" tickFormatter={formatDate} interval="preserveStartEnd" minTickGap={30} angle={-45} textAnchor="end" height={60} tick={{ fill: chartColors.textFallback, fontSize: 12 }} axisLine={{ stroke: chartColors.gridFallback }}/>
                  <YAxis tickFormatter={(value) => `${formatTaoValue(value)} τ`} width={80} tick={{ fill: chartColors.textFallback, fontSize: 12 }} axisLine={{ stroke: chartColors.gridFallback }} domain={['auto', 'auto']} />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                        return [`${formatTaoValue(value)} τ`, name]; 
                    }}
                    labelFormatter={formatTooltipDate} 
                    contentStyle={{ backgroundColor: chartColors.tooltipBgFallback, border: `1px solid ${chartColors.tooltipBorderFallback}`, borderRadius: "0.5rem", color: chartColors.tooltipTextFallback }} 
                    itemStyle={{ color: chartColors.tooltipTextFallback }}
                    cursor={{ stroke: chartColors.gridFallback, strokeWidth: 1 }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: "1rem", color: chartColors.textFallback }} />
                  <ReferenceLine y={0} stroke={chartColors.gridFallback} strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="taoBuyVolume" stroke={chartColors.buyFallback} fill="url(#subnetTaoBuyAreaGradient)" name="Buy Volume" strokeWidth={2} />
                  <Area type="monotone" dataKey="taoSellVolumeForStack" stroke={chartColors.sellFallback} fill="url(#subnetTaoSellAreaGradient)" name="Sell Volume" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {showSubnetVolumeChart && (
           <div className="bg-background rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow duration-300">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Buy/Sell Alpha Volume - Subnet {selectedSubnet}
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displaySubnetData} margin={{ top: 5, right: 20, bottom: 60, left: 20 }}>
                  <defs>
                    <linearGradient id="subnetAlphaBuyAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.buyFallback} stopOpacity={0.7} />
                      <stop offset="95%" stopColor={chartColors.buyFallback} stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="subnetAlphaSellAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.sellFallback} stopOpacity={0.1} />
                      <stop offset="95%" stopColor={chartColors.sellFallback} stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridFallback} />
                  <XAxis dataKey="date" tickFormatter={formatDate} interval="preserveStartEnd" minTickGap={30} angle={-45} textAnchor="end" height={60} tick={{ fill: chartColors.textFallback, fontSize: 12 }} axisLine={{ stroke: chartColors.gridFallback }}/>
                  <YAxis tickFormatter={(value) => `${formatAlphaValue(value)} α`} width={80} tick={{ fill: chartColors.textFallback, fontSize: 12 }} axisLine={{ stroke: chartColors.gridFallback }} domain={['auto', 'auto']} />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                        return [`${formatAlphaValue(value)} α`, name]; 
                    }}
                    labelFormatter={formatTooltipDate} 
                    contentStyle={{ backgroundColor: chartColors.tooltipBgFallback, border: `1px solid ${chartColors.tooltipBorderFallback}`, borderRadius: "0.5rem", color: chartColors.tooltipTextFallback }} 
                    itemStyle={{ color: chartColors.tooltipTextFallback }}
                    cursor={{ stroke: chartColors.gridFallback, strokeWidth: 1 }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: "1rem", color: chartColors.textFallback }} />
                  <ReferenceLine y={0} stroke={chartColors.gridFallback} strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="alphaBuyVolume" stroke={chartColors.buyFallback} fill="url(#subnetAlphaBuyAreaGradient)" name="Buy Volume" strokeWidth={2} />
                  <Area type="monotone" dataKey="alphaSellVolumeForStack" stroke={chartColors.sellFallback} fill="url(#subnetAlphaSellAreaGradient)" name="Sell Volume" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {showSubnetTransactionsChart && (
            <div className="bg-background rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow duration-300">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Transactions - Subnet {selectedSubnet}
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displaySubnetData}>
                  <defs>
                    <linearGradient id="subnetBarGradientBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.transactionsFallback} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={chartColors.transactionsFallback} stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridFallback} />
                  <XAxis dataKey="date" tickFormatter={formatDate} interval="preserveStartEnd" minTickGap={30} angle={-45} textAnchor="end" height={60} tick={{ fill: chartColors.textFallback, fontSize: 12 }} axisLine={{ stroke: chartColors.gridFallback }} />
                  <YAxis tickFormatter={formatTransactionCount} tick={{ fill: chartColors.textFallback, fontSize: 12 }} axisLine={{ stroke: chartColors.gridFallback }} />
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => {
                        const { buys, sells } = props.payload;
                        return [
                            `${formatTransactionCount(value)} (Buys: ${formatTransactionCount(buys)}, Sells: ${formatTransactionCount(sells)})`, 
                            "Total Transactions"
                        ];
                    }}
                    labelFormatter={formatTooltipDate} 
                    contentStyle={{ backgroundColor: chartColors.tooltipBgFallback, border: `1px solid ${chartColors.tooltipBorderFallback}`, borderRadius: "0.5rem", color: chartColors.tooltipTextFallback}} 
                    itemStyle={{ color: chartColors.tooltipTextFallback }}
                    cursor={{ fill: theme === 'dark' ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)"}} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: "1rem", color: chartColors.textFallback }} />
                  <Bar dataKey="totalTransactions" fill="url(#subnetBarGradientBlue)" name="Total Transactions" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {showSubnetNetVolumeChart && (
          <div className="bg-background rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow duration-300">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Net Volume (TAO) - Subnet {selectedSubnet}
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={displaySubnetData}>
                  <defs>
                    <linearGradient id="subnetPositiveGradient" x1="0" y1="0" x2="0" y2="1" >
                      <stop offset="5%" stopColor={chartColors.buyFallback} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={chartColors.buyFallback} stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="subnetNegativeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.sellFallback} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={chartColors.sellFallback} stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridFallback} />
                  <XAxis dataKey="date" tickFormatter={formatDate} interval="preserveStartEnd" minTickGap={30} angle={-45} textAnchor="end" height={60} tick={{ fill: chartColors.textFallback, fontSize: 12 }} axisLine={{ stroke: chartColors.gridFallback }}/>
                  <YAxis tickFormatter={(v) => formatTaoValue(v) + " τ"} width={80} tick={{ fill: chartColors.textFallback, fontSize: 12 }} axisLine={{ stroke: chartColors.gridFallback }}/>
                  <Tooltip formatter={(value: number) => [`${formatTaoValue(value)} τ`, "Net Volume"]} labelFormatter={formatTooltipDate} 
                           contentStyle={{ backgroundColor: chartColors.tooltipBgFallback, border: `1px solid ${chartColors.tooltipBorderFallback}`, borderRadius: "0.5rem", color: chartColors.tooltipTextFallback}} 
                           itemStyle={{ color: chartColors.tooltipTextFallback }}
                           cursor={{ fill: theme === 'dark' ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)"}}/>
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: "1rem", color: chartColors.textFallback }} />
                  <ReferenceLine y={0} stroke={chartColors.gridFallback} />
                  <Bar dataKey="taoNetVolume" name="Net Volume" radius={[4, 4, 0, 0]} barSize={20}>
                    {displaySubnetData.map((entry: any, index) => (
                      <Cell key={`cell-${index}`} fill={ entry.taoNetVolume >= 0 ? "url(#subnetPositiveGradient)" : "url(#subnetNegativeGradient)" } />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    )
  );
  
  if (showNetworkWideTradingVolumeChart || showNetworkWideTransactionsChart) {
    return renderNetworkWideCharts();
  }
  if (selectedSubnet !== null && (showTradingVolumeChart || showSubnetVolumeChart || showSubnetTransactionsChart || showSubnetNetVolumeChart)) {
    return renderSubnetSpecificCharts();
  }

  return null;
};

export default NetworkCharts;
