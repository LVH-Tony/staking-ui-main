import React from "react";
import { formatNumber, formatTaoValue, formatAlphaValue, formatAlphaPrice, formatTransactionCount } from "@/utils/format";
import { TrendingUp, Wallet, Users, Activity, Coins, Zap, Info, ArrowUpDown } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface StatItem {
  label: string;
  value: string;
  icon: JSX.Element;
  tooltip?: string; // Tooltip is optional
}

interface SubnetStatsSidepanelProps {
  subnetMetrics: {
    alphaPrice: number;
    marketCap: number;
    totalTransactions: number;
    emission: number;
    emissionRank: number;
    emissionPercentage: number;
    taoInPool: number;
    alphaInPool: number;
    alphaStaked: number;
    utilization: number;
    alphaDistributionRatio: number;
    alphaSupply: number;
    totalVolume?: number;
    buySellRatio?: number;
    uniqueBuyersCount?: number;
    uniqueSellersCount?: number;
    uniqueTradersCount?: number;
  };
  taoPrice: number | undefined | null;
  loading: boolean;
}

export const SubnetStatsSidepanel: React.FC<SubnetStatsSidepanelProps> = ({
  subnetMetrics,
  taoPrice,
  loading,
}) => {
  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-accent rounded w-1/3"></div>
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-4 bg-accent rounded w-full"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statGroups: Array<{ title: string; stats: StatItem[] }> = [
    {
      title: "Market Metrics",
      stats: [
        {
          label: "Alpha Price",
          value: `${formatAlphaPrice(subnetMetrics.alphaPrice)} τ`,
          tooltip: taoPrice ? `$${formatNumber(subnetMetrics.alphaPrice * taoPrice)} USD` : "USD value unavailable",
          icon: <Coins className="w-4 h-4 text-primary" />,
        },
        {
          label: "Market Cap",
          value: `${formatTaoValue(subnetMetrics.marketCap)} τ`,
          tooltip: taoPrice ? `$${formatNumber(subnetMetrics.marketCap * taoPrice)} USD` : "USD value unavailable",
          icon: <Wallet className="w-4 h-4 text-primary/80" />,
        },
        {
          label: "Total Volume",
          value: subnetMetrics.totalVolume ? `${formatTaoValue(subnetMetrics.totalVolume)} τ` : "-",
          tooltip: taoPrice && subnetMetrics.totalVolume ? `$${formatNumber(subnetMetrics.totalVolume * taoPrice)} USD` : "Total trading volume in TAO",
          icon: <TrendingUp className="w-4 h-4 text-primary/80" />,
        },
        {
          label: "Buy/Sell Ratio",
          value: subnetMetrics.buySellRatio ? formatNumber(subnetMetrics.buySellRatio) : "-",
          tooltip: "Ratio of buy volume to sell volume",
          icon: <ArrowUpDown className="w-4 h-4 text-primary/70" />,
        },
        {
          label: "Transactions",
          value: formatTransactionCount(String(subnetMetrics.totalTransactions)),
          icon: <Activity className="w-4 h-4 text-primary/70" />,
        },
        {
          label: "Unique Buyers",
          value: subnetMetrics.uniqueBuyersCount !== undefined ? formatNumber(subnetMetrics.uniqueBuyersCount, 0) : "-",
          tooltip: "Number of unique buyers in the selected period",
          icon: <Users className="w-4 h-4 text-primary/70" />,
        },
        {
          label: "Unique Sellers",
          value: subnetMetrics.uniqueSellersCount !== undefined ? formatNumber(subnetMetrics.uniqueSellersCount, 0) : "-",
          tooltip: "Number of unique sellers in the selected period",
          icon: <Users className="w-4 h-4 text-primary/70" />,
        },
        {
          label: "Total Unique Traders",
          value: subnetMetrics.uniqueTradersCount !== undefined ? formatNumber(subnetMetrics.uniqueTradersCount, 0) : "-",
          tooltip: "Total number of unique traders (buyers and/or sellers) in the selected period",
          icon: <Users className="w-4 h-4 text-primary/70" />,
        },
      ],
    },
    {
      title: "Liquidity Metrics",
      stats: [
        {
          label: "TAO in Pool",
          value: `${formatTaoValue(subnetMetrics.taoInPool)} τ`,
          icon: <Wallet className="w-4 h-4 text-primary/80" />,
        },
        {
          label: "Alpha in Pool",
          value: `${formatAlphaValue(subnetMetrics.alphaInPool)} α`,
          icon: <Users className="w-4 h-4 text-primary/80" />,
        },
        {
          label: "Alpha Staked",
          value: `${formatAlphaValue(subnetMetrics.alphaStaked)} α`,
          icon: <Users className="w-4 h-4 text-primary/70" />,
        },
      ],
    },
    {
      title: "Network Metrics",
      stats: [
        {
          label: "Emission",
          value: `${formatAlphaValue(subnetMetrics.emission)} α`,
          tooltip: `Rank #${formatNumber(subnetMetrics.emissionRank)} (${formatNumber(subnetMetrics.emissionPercentage)}%)`,
          icon: <Zap className="w-4 h-4 text-primary/80" />,
        },
        {
          label: "Utilization",
          value: `${formatNumber(subnetMetrics.utilization)}%`,
          tooltip: "Percentage of total Alpha staked",
          icon: <TrendingUp className="w-4 h-4 text-primary/80" />,
        },
        {
          label: "Alpha Distribution",
          value: formatNumber(subnetMetrics.alphaDistributionRatio),
          tooltip: "Staked α / Pool α ratio",
          icon: <TrendingUp className="w-4 h-4 text-primary/70" />,
        },
      ],
    },
  ];

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="p-4 border-b border-border sticky top-0 z-10 rounded-t-lg">
        <h3 className="text-sm font-medium text-muted-foreground">Subnet Metrics</h3>
      </CardHeader>
      <CardContent className="p-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        <div className="space-y-6">
          {statGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.title}
              </h4>
              <div className="space-y-3">
                {group.stats.map((stat) => (
                  <div key={stat.label} className="flex items-start">
                    <div className="mr-3 mt-0.5">{stat.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-muted-foreground mr-1">{stat.label}</div>
                        {stat.tooltip && (
                          <div className="group relative inline-block">
                            <Info 
                              className="h-3.5 w-3.5 text-muted-foreground cursor-help" 
                              tabIndex={0}
                              role="button"
                              aria-label={`Information about ${stat.label}`} 
                            />
                            <div 
                              className="pointer-events-none absolute z-10 w-max max-w-xs opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 bg-popover text-popover-foreground text-xs rounded-md py-1.5 px-2.5 bottom-full mb-1 -translate-x-1/2 left-1/2 before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-popover"
                              role="tooltip"
                            >
                              {stat.tooltip}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-lg font-semibold">{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 