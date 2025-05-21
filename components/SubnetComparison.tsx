import React, { useState, useMemo, useEffect } from "react";
import {
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
} from "recharts";
import {
  formatNumber,
  formatTaoValue,
  formatAlphaValue,
} from "../utils/format";
import {
  ArrowUpDown,
  TrendingUp,
  Wallet,
  Users,
  Zap,
  ChevronDown,
  ChevronUp,
  Check,
  Activity,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import Link from "next/link";

interface SubnetComparisonProps {
  subnets: any[];
  stakingData: any[];
  alphaPrices: Record<number, number>;
  loading: boolean;
  initialSelectedSubnet?: number | null;
  timeframe: "daily" | "weekly" | "monthly" | "blocks";
}

type SortField =
  | "net_uid"
  | "alpha_price"
  | "volume"
  | "tao_pool"
  | "alpha_staked"
  | "alpha_in_pool"
  | "marketcap"
  | "emission"
  | "utilization"
  | "last_updated";
type SortDirection = "asc" | "desc";

interface EmissionDataEntry {
  name: string;
  value: number;
  percentage: number;
  isMinorShares?: boolean;
  subnets?: string[];
}

export const SubnetComparison = ({
  subnets,
  stakingData,
  alphaPrices,
  loading,
  initialSelectedSubnet,
  timeframe,
}: SubnetComparisonProps) => {
  const theme = useTheme();
  const [sortField, setSortField] = useState<SortField>("net_uid");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSubnets, setSelectedSubnets] = useState<number[]>([]);
  const [isGridExpanded, setIsGridExpanded] = useState(false);

  useEffect(() => {
    if (initialSelectedSubnet !== undefined && initialSelectedSubnet !== null) {
        setSelectedSubnets([initialSelectedSubnet]);
    } else {
        setSelectedSubnets([]);
    }
  }, [initialSelectedSubnet]);

  // Get latest staking data for each subnet
  const latestStakingData = useMemo(() => {
    const data: Record<number, any> = {};
    stakingData.forEach((record) => {
      if (!data[record.netUid]) {
        data[record.netUid] = record;
      }
    });
    return data;
  }, [stakingData]);

  // Helper function to get timeframe label
  const getTimeframeLabel = () => {
    switch (timeframe) {
      case "daily":
        return "24h";
      case "weekly":
        return "7d";
      case "monthly":
        return "30d";
      case "blocks":
        return "Block";
      default:
        return "24h";
    }
  };

  // Prepare data for comparison table
  const comparisonData = useMemo(() => {
    return subnets
      .filter((subnet) => subnet.net_uid !== 0) // Filter out subnet 0
      .map((subnet) => {
        const stakingRecord = latestStakingData[subnet.net_uid] || {};
        const alphaPrice = alphaPrices[subnet.net_uid] || 0;
        const utilization =
          subnet.alpha_staked + subnet.alpha_in_pool > 0
            ? (subnet.alpha_staked /
                (subnet.alpha_staked + subnet.alpha_in_pool)) *
              100
            : 0;
        
        const totalAlpha = subnet.alpha_staked + subnet.alpha_in_pool;
        const marketcap = totalAlpha * alphaPrice;

        const buyVolume = stakingRecord.buyVolumeTao ? parseFloat(String(stakingRecord.buyVolumeTao)) : 0;
        const sellVolume = stakingRecord.sellVolumeTao ? parseFloat(String(stakingRecord.sellVolumeTao)) : 0;
        const calculatedVolume = buyVolume + sellVolume;

        return {
          net_uid: subnet.net_uid,
          symbol: subnet.symbol || `SN${subnet.net_uid}`,
          alpha_price: alphaPrice,
          volume: calculatedVolume,
          tao_pool: subnet.tao_in_pool,
          alpha_staked: subnet.alpha_staked,
          alpha_in_pool: subnet.alpha_in_pool,
          marketcap,
          emission: subnet.emission,
          utilization,
          last_updated: subnet.updated_at,
        };
      })
      .sort((a, b) => {
        const multiplier = sortDirection === "asc" ? 1 : -1;
        if (sortField === "last_updated") {
          return (new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime()) * multiplier;
        }
        return (a[sortField] - b[sortField]) * multiplier;
      });
  }, [subnets, latestStakingData, alphaPrices, sortField, sortDirection]);

  // Filter comparison data based on selected subnets
  const filteredComparisonData = useMemo(() => {
    if (selectedSubnets.length === 0) {
      return comparisonData.slice(0, isExpanded ? undefined : 5);
    }
    return comparisonData.filter((subnet) => selectedSubnets.includes(subnet.net_uid));
  }, [comparisonData, selectedSubnets, isExpanded]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleSubnetSelection = (netUid: number) => {
    setSelectedSubnets((prev) => {
      if (prev.includes(netUid)) {
        return prev.filter((id) => id !== netUid);
      }
      return [...prev, netUid];
    });
  };

  // Prepare data for ranked lists - only show selected subnets if any are selected
  const rankedData = useMemo(() => {
    const dataToRank = selectedSubnets.length > 0
      ? comparisonData.filter((subnet) => selectedSubnets.includes(subnet.net_uid))
      : comparisonData;

    return {
      volume: [...dataToRank]
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 10),
      liquidity: [...dataToRank]
        .sort((a, b) => b.tao_pool - a.tao_pool)
        .slice(0, 10),
      stakedAlpha: [...dataToRank]
        .sort((a, b) => b.alpha_staked - a.alpha_staked)
        .slice(0, 10),
    };
  }, [comparisonData, selectedSubnets]);

  // Prepare data for emission share pie chart - only show selected subnets if any are selected
  const emissionData = useMemo(() => {
    // Get all subnets except root (0)
    const nonRootSubnets = subnets.filter((subnet) => subnet.net_uid !== 0);
    
    // Calculate total network emission (excluding root)
    const totalNetworkEmission = nonRootSubnets.reduce(
      (sum, subnet) => sum + subnet.emission,
      0
    );

    let selectedSubnetsData;
    if (selectedSubnets.length > 0) {
      // For selected subnets view
      const selectedData = nonRootSubnets
        .filter((subnet) => selectedSubnets.includes(subnet.net_uid))
        .map((subnet) => ({
          name: `Subnet ${subnet.net_uid}`,
          value: subnet.emission,
          percentage: (subnet.emission / totalNetworkEmission) * 100,
        } as EmissionDataEntry))
        .sort((a, b) => b.value - a.value);

      // Group small percentages (less than 1%) into "Minor Shares"
      const [significantShares, minorShares] = selectedData.reduce(
        ([sig, minor], item) => {
          if (item.percentage >= 1) {
            return [[...sig, item], minor];
          }
          return [sig, [...minor, item]];
        },
        [[], []] as [EmissionDataEntry[], EmissionDataEntry[]]
      );

      // Add minor shares as a single slice if any exist
      if (minorShares.length > 0) {
        const minorSharesTotal = minorShares.reduce((sum, item) => sum + item.value, 0);
        significantShares.push({
          name: `Minor Shares (${minorShares.length} subnets)`,
          value: minorSharesTotal,
          percentage: (minorSharesTotal / totalNetworkEmission) * 100,
          isMinorShares: true,
          subnets: minorShares.map(share => share.name),
        });
      }

      // Calculate total emission for selected subnets
      const selectedTotalEmission = selectedData.reduce(
        (sum, data) => sum + data.value,
        0
      );

      // Add "Others" slice if there are unselected subnets with emissions
      if (selectedTotalEmission < totalNetworkEmission) {
        significantShares.push({
          name: "Others",
          value: totalNetworkEmission - selectedTotalEmission,
          percentage: ((totalNetworkEmission - selectedTotalEmission) / totalNetworkEmission) * 100,
        });
      }

      return {
        data: significantShares,
        top10Percentage: (selectedTotalEmission / totalNetworkEmission) * 100,
      };
    } else {
      // For top 10 view - no "Others" slice
      const top10Data = nonRootSubnets
        .map((subnet) => ({
          name: `Subnet ${subnet.net_uid}`,
          value: subnet.emission,
          percentage: (subnet.emission / totalNetworkEmission) * 100,
        } as EmissionDataEntry))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      return {
        data: top10Data,
        top10Percentage: (top10Data.reduce((sum, data) => sum + data.value, 0) / totalNetworkEmission) * 100,
      };
    }
  }, [subnets, selectedSubnets]);

  // Group subnets into rows for the grid
  const subnetGrid = useMemo(() => {
    const allSubnets = subnets
      .filter(subnet => subnet.net_uid !== 0)
      .sort((a, b) => a.net_uid - b.net_uid);
    
    // Group into rows of 8 for a more compact layout
    const rows: any[][] = [];
    for (let i = 0; i < allSubnets.length; i += 8) {
      rows.push(allSubnets.slice(i, i + 8));
    }
    return {
      rows,
      totalSubnets: allSubnets.length
    };
  }, [subnets]);

  const COLORS = useMemo(() => {
    const isDark = theme === "dark";
    // Attempt to use CSS variables, provide fallbacks if not defined
    // Ensure these CSS variables (--chart-1, --chart-1-dark, etc.) are defined in your global CSS / Tailwind config
    return [
      isDark ? "hsl(var(--chart-1-dark, var(--chart-1)))" : "hsl(var(--chart-1))", // Primary
      isDark ? "hsl(var(--chart-2-dark, var(--chart-2)))" : "hsl(var(--chart-2))", // Secondary / Accent
      isDark ? "hsl(var(--chart-3-dark, var(--chart-3)))" : "hsl(var(--chart-3))", // Tertiary / Accent
      isDark ? "hsl(var(--chart-4-dark, var(--chart-4)))" : "hsl(var(--chart-4))",
      isDark ? "hsl(var(--chart-5-dark, var(--chart-5)))" : "hsl(var(--chart-5))",
      // Fallback to more generic colors if specific chart vars aren't themed
      isDark ? "#52525b" : "#3B82F6", // zinc-600 dark, blue-500 light
      isDark ? "#ef4444" : "#EF4444", // red-500 (consistent)
      isDark ? "#22c55e" : "#10B981", // green-500 dark, emerald-500 light
      isDark ? "#eab308" : "#F59E0B", // yellow-500 dark, amber-500 light
      isDark ? "#a855f7" : "#8B5CF6", // purple-500 dark, violet-500 light
    ];
  }, [theme]);

  return (
    <div className="space-y-8">
      {/* Subnet Selection Grid */}
      <div className="bg-card rounded-lg shadow border border-border">
        <div className="p-4 pb-3 border-b border-border">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-foreground">Select Subnets to Compare</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedSubnets.length === 0 
                  ? "Select subnets to compare them" 
                  : `${selectedSubnets.length} subnet${selectedSubnets.length === 1 ? '' : 's'} selected`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {selectedSubnets.length > 0 && (
                <button
                  onClick={() => setSelectedSubnets([])}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Clear Selection
                </button>
              )}
              <button
                onClick={() => setIsGridExpanded(!isGridExpanded)}
                className="flex items-center text-sm text-primary hover:text-primary/80"
              >
                {isGridExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        <div className={`${isGridExpanded ? 'h-[400px]' : 'h-[240px]'} transition-all duration-300`}>
          <div className="h-full p-4 overflow-y-auto">
            <div className="grid grid-cols-8 gap-1.5">
              {subnetGrid.rows.slice(0, isGridExpanded ? undefined : 3).map((row, rowIndex) => (
                row.map((subnet) => {
                  const isSelected = selectedSubnets.includes(subnet.net_uid);
                  const isTop10 = comparisonData
                    .sort((a, b) => b.marketcap - a.marketcap)
                    .slice(0, 10)
                    .some(s => s.net_uid === subnet.net_uid);
                  
                  return (
                    <button
                      key={subnet.net_uid}
                      onClick={() => toggleSubnetSelection(subnet.net_uid)}
                      className={`
                        relative h-12 rounded-lg flex items-center justify-center
                        text-sm font-medium transition-all duration-200
                        ${isSelected 
                          ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90' 
                          : 'bg-accent hover:bg-accent/80 border border-border'
                        }
                        ${isTop10 && !isSelected ? 'highlight-animation' : ''}
                      `}
                    >
                      <div className="flex flex-col items-center leading-none">
                        <span className="text-[9px] opacity-60 mb-0.5">SN</span>
                        <span className="font-mono text-xs">{subnet.net_uid}</span>
                      </div>
                    </button>
                  );
                })
              ))}
            </div>
            {!isGridExpanded && subnetGrid.rows.length > 3 && (
              <div className="mt-2 text-center text-sm text-muted-foreground">
                {subnetGrid.totalSubnets - 24} more subnets...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-card rounded-lg shadow border border-border overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-foreground">
              Subnet Comparison
            </h3>
            {comparisonData.length > 5 && selectedSubnets.length === 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center text-sm font-medium text-primary hover:text-primary/80"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show All ({comparisonData.length} subnets)
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-accent sticky top-0 z-10">
                <tr>
                  {[
                    { field: "net_uid", label: "NetUID" },
                    { field: "alpha_price", label: "Alpha Price" },
                    { field: "volume", label: `τ Volume (${getTimeframeLabel()})` },
                    { field: "tao_pool", label: "τ Pool" },
                    { field: "alpha_staked", label: "Alpha Staked" },
                    { field: "alpha_in_pool", label: "Alpha in Pool" },
                    { field: "marketcap", label: "Market Cap" },
                    { field: "emission", label: "Emission" },
                    { field: "utilization", label: "Utilization" },
                    { field: "last_updated", label: "Last Updated" },
                  ].map(({ field, label }) => (
                    <th
                      key={field}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent"
                      onClick={() => handleSort(field as SortField)}
                    >
                      <div className="flex items-center">
                        {label}
                        {sortField === field && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredComparisonData.map((subnet) => (
                  <tr 
                    key={subnet.net_uid}
                    className={`hover:bg-accent/50 ${selectedSubnets.includes(subnet.net_uid) ? (theme === 'dark' ? 'bg-primary/20' : 'bg-primary/10') : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/statistics?subnet_uid=${subnet.net_uid}`} className="text-primary hover:text-primary/80 hover:underline flex items-center group">
                        <span className="font-semibold">{subnet.net_uid}</span>
                        {subnet.symbol && subnet.symbol !== `SN${subnet.net_uid}` && (
                          <span className="ml-1.5 text-xs text-muted-foreground group-hover:text-primary/90">
                            ({subnet.symbol})
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatTaoValue(subnet.alpha_price)} τ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatTaoValue(subnet.volume)} τ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatTaoValue(subnet.tao_pool)} τ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatAlphaValue(subnet.alpha_staked)} α
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatAlphaValue(subnet.alpha_in_pool)} α
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatTaoValue(subnet.marketcap)} τ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatTaoValue(subnet.emission)} τ/block
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatNumber(subnet.utilization)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(subnet.last_updated).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ranked Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Subnets by Volume */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow duration-300">
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary" />
            {selectedSubnets.length > 0 ? 'Selected' : 'Top'} Subnets by τ Volume
          </h3>
          <div className="h-80 relative">
            {loading || rankedData.volume.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-accent/30">
                <div className="animate-pulse flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full ${theme === 'dark' ? 'bg-primary/30' : 'bg-primary/20'} mb-2`}></div>
                  <div className="text-sm text-muted-foreground">{loading ? 'Loading chart...' : 'No data for selected period'}</div>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankedData.volume}>
                  <defs>
                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme === 'dark' ? "hsl(var(--primary-dark, var(--primary)))" : "hsl(var(--primary))"} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={theme === 'dark' ? "hsl(var(--primary-dark, var(--primary)))" : "hsl(var(--primary))"} stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="net_uid" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `${formatTaoValue(value)} τ`,
                      "Volume"
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                    cursor={{ fill: theme === 'dark' ? 'hsl(var(--primary-dark, var(--primary)) / 0.2)' : 'hsl(var(--primary) / 0.1)' }}
                  />
                  <Bar 
                    dataKey="volume" 
                    fill="url(#volumeGradient)" 
                    name="Volume"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Subnets by Liquidity */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow duration-300">
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
            <Wallet className="w-5 h-5 mr-2 text-emerald-500 dark:text-emerald-400" />
            {selectedSubnets.length > 0 ? 'Selected' : 'Top'} Subnets by τ Pool
          </h3>
          <div className="h-80 relative">
            {loading || rankedData.liquidity.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-accent/30">
                <div className="animate-pulse flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full ${theme === 'dark' ? 'bg-emerald-500/30' : 'bg-emerald-500/20'} mb-2`}></div>
                  <div className="text-sm text-muted-foreground">{loading ? 'Loading chart...' : 'No data for selected period'}</div>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankedData.liquidity}>
                  <defs>
                    <linearGradient id="liquidityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme === 'dark' ? "hsl(var(--chart-2-dark, var(--chart-2)))" : "hsl(var(--chart-2))"} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={theme === 'dark' ? "hsl(var(--chart-2-dark, var(--chart-2)))" : "hsl(var(--chart-2))"} stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="net_uid" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `${formatTaoValue(value)} τ`,
                      "τ Pool"
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                    cursor={{ fill: theme === 'dark' ? 'hsl(var(--chart-2-dark, var(--chart-2)) / 0.2)' : 'hsl(var(--chart-2) / 0.1)' }}
                  />
                  <Bar 
                    dataKey="tao_pool" 
                    fill="url(#liquidityGradient)" 
                    name="τ Pool"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Subnets by Staked Alpha */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow duration-300">
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-purple-500 dark:text-purple-400" />
            {selectedSubnets.length > 0 ? 'Selected' : 'Top'} Subnets by Staked Alpha
          </h3>
          <div className="h-80 relative">
            {loading || rankedData.stakedAlpha.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-accent/30">
                <div className="animate-pulse flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full ${theme === 'dark' ? 'bg-purple-500/30' : 'bg-purple-500/20'} mb-2`}></div>
                  <div className="text-sm text-muted-foreground">{loading ? 'Loading chart...' : 'No data for selected period'}</div>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankedData.stakedAlpha}>
                  <defs>
                    <linearGradient id="stakedAlphaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme === 'dark' ? "hsl(var(--chart-3-dark, var(--chart-3)))" : "hsl(var(--chart-3))"} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={theme === 'dark' ? "hsl(var(--chart-3-dark, var(--chart-3)))" : "hsl(var(--chart-3))"} stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="net_uid" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `${formatAlphaValue(value)} α`,
                      "Staked Alpha"
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                    cursor={{ fill: theme === 'dark' ? 'hsl(var(--chart-3-dark, var(--chart-3)) / 0.2)' : 'hsl(var(--chart-3) / 0.1)' }}
                  />
                  <Bar
                    dataKey="alpha_staked"
                    fill="url(#stakedAlphaGradient)"
                    name="Staked Alpha"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Emission Share */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow duration-300">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-primary" />
          {selectedSubnets.length > 0 ? 'Selected' : 'Top 10'} Subnets by Emission Share
          <span className="text-sm text-muted-foreground ml-2">
            ({formatNumber(emissionData.top10Percentage)}% of total emissions)
          </span>
        </h3>
        <div className="h-[400px] relative">
          {loading || emissionData.data.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-accent/30">
              <div className="animate-pulse flex flex-col items-center">
                <div className={`h-8 w-8 rounded-full ${theme === 'dark' ? 'bg-primary/30' : 'bg-primary/20'} mb-2`}></div>
                <div className="text-sm text-muted-foreground">{loading ? 'Loading chart...' : 'No data for selected period'}</div>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={emissionData.data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  labelLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                  label={({ name, percentage, isMinorShares, ...rest }: EmissionDataEntry & { percentage: number }) => {
                    // Access fill color from the spread props if recharts passes it
                    const entryPayload = rest as any;
                    const fillColor = entryPayload?.payload?.fill || 'hsl(var(--foreground))'; 
                    if (isMinorShares) {
                      return <text fill={fillColor} x={entryPayload.x} y={entryPayload.y} dy={entryPayload.dy} textAnchor={entryPayload.textAnchor}>{`${name}: ${formatNumber(percentage)}%`}</text>;
                    }
                    return percentage >= 1 ? <text fill={fillColor} x={entryPayload.x} y={entryPayload.y} dy={entryPayload.dy} textAnchor={entryPayload.textAnchor}>{`${name}: ${formatNumber(percentage)}%`}</text> : null;
                  }}
                >
                  {emissionData.data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      style={{
                        filter: theme === 'dark' ? 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.5))' : 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.1))',
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: any) => {
                    const entry = props.payload.payload; // Access the actual payload for EmissionDataEntry props
                    if (entry.isMinorShares) {
                      return [
                        `${formatTaoValue(value)} τ/block\n${entry.subnets.join(', ')}`,
                        name,
                      ];
                    }
                    return [`${formatTaoValue(value)} τ/block`, name];
                  }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                  itemStyle={{
                    color: 'hsl(var(--popover-foreground))'
                  }}
                  labelStyle={{
                    color: 'hsl(var(--popover-foreground))'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Update the highlight styles for dark mode compatibility */}
      <style>{`
        @keyframes highlightPulse {
          0% {
            box-shadow: 0 0 0 0 hsl(var(--primary) / ${theme === 'dark' ? '0.2' : '0.1'});
          }
          25% {
            box-shadow: 0 0 0 2px hsl(var(--primary) / ${theme === 'dark' ? '0.3' : '0.2'});
          }
          50% {
            box-shadow: 0 0 0 2px hsl(var(--primary) / ${theme === 'dark' ? '0.3' : '0.2'});
          }
          100% {
            box-shadow: 0 0 0 0 hsl(var(--primary) / ${theme === 'dark' ? '0.2' : '0.1'});
          }
        }

        .highlight-animation {
          animation: highlightPulse 4s infinite;
          position: relative;
        }

        .highlight-animation::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border-radius: 8px; /* Match button's rounded-lg */
          border: 1px solid hsl(var(--primary) / ${theme === 'dark' ? '0.25' : '0.15'});
          z-index: -1;
        }
      `}</style>
    </div>
  );
};
