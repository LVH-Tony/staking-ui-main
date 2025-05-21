"use client";

import React, { useMemo } from "react";
import { useTaoPrice } from "@/hooks/useTaoPrice";
import { useStakingStats } from "@/hooks/useStakingStats";
import { useSubnets } from "@/hooks/useSubnets";
import {
  ArrowUp,
  ArrowDown,
  Coins,
  BarChart3,
  Activity,
  TrendingUp,
} from "lucide-react";
import { formatNumber, formatTaoValue } from "@/utils/format";
import { useSidebar } from "@/contexts/sidebar";
import { StakingStatsTemporalRecord } from "@/types";

export default function NavbarStats() {
  const { isCollapsed } = useSidebar();
  const { price: taoPrice, change, loading: priceLoading } = useTaoPrice();
  const { subnets, loading: subnetsLoading } = useSubnets();
  const { data: stakingData, loading: statsLoading } = useStakingStats({
    timeframe: "daily",
  });

  // Calculate network metrics
  const networkMetrics = useMemo(() => {
    if (stakingData.length === 0)
      return { totalVolume: 0, totalTransactions: 0 };

    // Get the most recent records for each subnet
    const latestRecords = (stakingData as StakingStatsTemporalRecord[]).reduce(
      (acc: Record<number, StakingStatsTemporalRecord>, record) => {
        const recordDate = record.tsEnd || "";
        const accDate = acc[record.netUid]?.tsEnd || "";
        if (acc[record.netUid] && new Date(recordDate) > new Date(accDate)) {
          acc[record.netUid] = record;
        } else if (!acc[record.netUid]) {
          acc[record.netUid] = record;
        }
        return acc;
      },
      {}
    );

    // Calculate total volume and transactions
    const totalVolume = Object.values(latestRecords).reduce(
      (sum, record) => sum + parseFloat(record.totalVolumeTao),
      0
    );

    const totalTransactions = Object.values(latestRecords).reduce(
      (sum, record) => sum + record.transactions,
      0
    );

    return { totalVolume, totalTransactions };
  }, [stakingData]);

  // Calculate top subnets by volume
  const topSubnetsByVolume = useMemo(() => {
    if (stakingData.length === 0 || subnets.length === 0) return [];

    // Group latest records by subnet
    const latestRecordsBySubnet = (
      stakingData as StakingStatsTemporalRecord[]
    ).reduce((acc: Record<number, StakingStatsTemporalRecord>, record) => {
      const recordDate = record.tsStart || "";

      const accDate = acc[record.netUid]?.tsStart || "";
      if (acc[record.netUid] && new Date(recordDate) > new Date(accDate)) {
        acc[record.netUid] = record;
      } else if (!acc[record.netUid]) {
        acc[record.netUid] = record;
      }
      return acc;
    }, {});

    // Calculate volume for each subnet and create array with subnet info
    const subnetsWithVolume = Object.entries(latestRecordsBySubnet).map(
      ([netUid, record]) => {
        const subnet = subnets.find((s) => s.net_uid === parseInt(netUid));

        const volume = parseFloat(record.totalVolumeTao);
        return {
          netUid: parseInt(netUid),
          name: subnet?.name || `Subnet ${netUid}`,
          symbol: subnet?.symbol || "",
          volume,
        };
      }
    );

    // Sort by volume (highest first) and take top 5
    return subnetsWithVolume
      .filter((s) => s.netUid !== 0) // Exclude root subnet
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
  }, [stakingData, subnets]);

  // Use static content if no data available
  const displaySubnets = useMemo(() => {
    if (topSubnetsByVolume.length === 0) {
      return [
        { netUid: 1, symbol: "S1", volume: 1000000 },
        { netUid: 2, symbol: "S2", volume: 800000 },
        { netUid: 3, symbol: "S3", volume: 600000 },
        { netUid: 4, symbol: "S4", volume: 400000 },
        { netUid: 5, symbol: "S5", volume: 200000 },
      ];
    }
    return topSubnetsByVolume;
  }, [topSubnetsByVolume]);

  // Show loading state if data is not available
  if (priceLoading || statsLoading || subnetsLoading) {
    return (
      <div className="flex items-center h-6 text-muted-foreground text-sm">
        <div className="animate-pulse w-64 h-4 bg-accent rounded"></div>
      </div>
    );
  }

  // Format TAO price change as percentage with sign
  const priceChangePercentage = change?.["1D"]
    ? change["1D"].toFixed(2)
    : "0.00";
  const isPriceUp = change?.["1D"] && change["1D"] > 0;

  // Create the subnet ticker items
  const tickerContent = displaySubnets.map((subnet, index) => (
    <div key={subnet.netUid} className="inline-flex items-center mr-6">
      <div className="flex items-center">
        <span className="bg-primary/10 text-primary text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center mr-1.5">
          {subnet.netUid}
        </span>
        <span className="font-medium text-sm text-foreground">
          {subnet.symbol || `S${subnet.netUid}`}
        </span>
      </div>
      <span className="ml-1.5 font-semibold text-sm text-primary">
        {formatTaoValue(subnet.volume)}
      </span>
      {index < displaySubnets.length - 1 && (
        <span className="mx-2 text-muted-foreground/30">•</span>
      )}
    </div>
  ));

  return (
    <div className="flex items-center space-x-3 md:space-x-4 lg:space-x-6 overflow-hidden flex-grow">
      {/* TAO Price - Always visible */}
      <div className="flex items-center flex-shrink-0">
        <Coins className="h-4 w-4 text-primary mr-1.5" />
        <span className="font-semibold text-sm text-foreground">TAO:</span>
        <span className="ml-1 text-sm text-foreground">
          ${taoPrice ? taoPrice.toFixed(2) : "0.00"}
        </span>
        <span
          className={`ml-1 text-xs flex items-center ${
            isPriceUp ? "text-green-500" : "text-red-500"
          }`}
        >
          {isPriceUp ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          {priceChangePercentage}%
        </span>
      </div>

      {/* Daily Volume - Hidden on very small screens */}
      <div className="hidden sm:flex items-center flex-shrink-0">
        <BarChart3 className="h-4 w-4 text-primary mr-1.5" />
        <span className="font-semibold text-sm text-foreground">Vol:</span>
        <span className="ml-1 text-sm text-foreground">
          {formatTaoValue(networkMetrics.totalVolume)}
        </span>
      </div>

      {/* Transactions - Hidden on medium and smaller screens */}
      <div className="hidden lg:flex items-center flex-shrink-0">
        <Activity className="h-4 w-4 text-primary mr-1.5" />
        <span className="font-semibold text-sm text-foreground">Tx:</span>
        <span className="ml-1 text-sm text-foreground">
          {formatNumber(networkMetrics.totalTransactions)}
        </span>
      </div>

      {/* Subnet Ticker - Hidden on mobile, visible on md screens and up */}
      <div className="hidden md:flex items-center relative h-8 bg-accent/50 rounded-md px-2 flex-grow max-w-xl overflow-hidden border border-border">
        {/* Label for ticker */}
        <div className="flex items-center min-w-[120px] mr-2 border-r border-border pr-2 flex-shrink-0">
          <TrendingUp className="h-3.5 w-3.5 text-primary mr-1.5" />
          <span className="text-xs font-medium text-muted-foreground">
            TOP 5 BY VOL:
          </span>
        </div>

        {/* Ticker content container */}
        <div className="flex-grow overflow-hidden h-full flex items-center">
          {/* Actual scrolling ticker */}
          <div className="ticker-scroll">
            {tickerContent}
            {tickerContent}
            {tickerContent}
          </div>
        </div>
      </div>
    </div>
  );
}
