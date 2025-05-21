"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStakingStats } from "@/hooks/useStakingStats";
import { useTaoPrice } from "@/hooks/useTaoPrice";
import { useSubnets } from "@/hooks/useSubnets";
import { useAlphaPrices } from "@/hooks/useAlphaPrices";
import {
  Activity,
  TrendingUp,
  Users,
  Table,
  TrendingDown,
  Coins,
  Wallet,
  Zap,
  BarChart,
} from "lucide-react";
import {
  formatNumber,
  formatTaoValue,
  formatAlphaValue,
  formatAlphaPrice,
  formatTransactionCount,
} from "@/utils/format";
import { StatsCard } from "@/components/StatsCard";
import { NetworkCharts } from "@/components/NetworkCharts";
import { SubnetComparison } from "@/components/SubnetComparison";
import { SubnetGridSelector } from "../components/SubnetGridSelector";
import { SubnetStatsSidepanel } from "../components/SubnetStatsSidepanel";
import { SubnetCharts } from "@/components/SubnetCharts";
import { MainVolumeChart } from "@/components/MainVolumeChart";
import { StakingStatsTemporalRecord } from "@/types";
import { STATS_TIMEFRAMES, StatsTimeframe } from "@/types/staking";
import { SubnetData } from "@/types";
import { Subnet, StakingStatsRecord } from "@/types";
import { TimeIntervalDropdown } from "@/components/common/TimeIntervalDropdown";

type View = "overview" | "comparison";

interface NetworkMetrics {
  totalVolume: number;
  totalTransactions: number;
  buySellRatio: number;
  totalTaoInPools: number;
  rootTao: number;
  totalTaoInNetwork: number;
  taoInSubnetsPercentage: number;
  taoOnRootPercentage: number;
  totalStakedAlpha: number;
  rootEmission: number;
  sumAlphaPrices: number;
}

function StatisticsPageContent() {
  const [timeframe, setTimeframe] = useState<StatsTimeframe>(
    STATS_TIMEFRAMES.daily
  );
  const [selectedSubnet, setSelectedSubnet] = useState<number | null>(null);
  const [view, setView] = useState<View>("overview");

  const searchParams = useSearchParams();

  const {
    subnets,
    loading: subnetsLoading,
    isRefreshing: subnetsRefreshing,
    error: subnetsError,
  } = useSubnets();
  const {
    data: stakingData,
    loading: stakingLoading,
    isRefreshing: stakingRefreshing,
  } = useStakingStats({
    timeframe,
    netUid: view === "comparison" ? undefined : (selectedSubnet ?? undefined),
  });

  const { price: taoPrice, loading: priceLoading } = useTaoPrice();
  const {
    latestPrices,
    isLoading: alphaPricesLoading,
    isRefreshing: alphaPricesRefreshing,
  } = useAlphaPrices();

  // Add state for cached metrics and last updated time
  const [cachedNetworkMetrics, setCachedNetworkMetrics] =
    useState<NetworkMetrics | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Use a ref to track if this is the first load
  const isFirstLoad = useRef(true);

  // Effect to read subnet_uid from URL on initial load
  useEffect(() => {
    const subnetUidFromQuery = searchParams.get("subnet_uid");
    if (subnetUidFromQuery) {
      const netUid = parseInt(subnetUidFromQuery, 10);
      if (!isNaN(netUid)) {
        setSelectedSubnet(netUid);
        setView("overview");
      }
    }
  }, [searchParams]);

  // Calculate network-wide metrics
  const calculateNetworkMetrics = () => {
    // Get the most recent records for each subnet
    const latestRecords = (stakingData as StakingStatsTemporalRecord[]).reduce(
      (
        acc: Record<number, StakingStatsTemporalRecord>,
        r: StakingStatsTemporalRecord
      ) => {
        const record = r as StakingStatsTemporalRecord;
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

    // Calculate total volume from latest records
    const totalVolume = Object.values(latestRecords).reduce(
      (sum, record) => sum + parseInt(record.totalVolumeTao),
      0
    );

    // Calculate total transactions from latest records
    const totalTransactions = Object.values(latestRecords).reduce(
      (sum, record) => sum + parseInt(String(record.transactions || "0")),
      0
    );

    // Calculate buy/sell ratio
    const totalBuyVolume = Object.values(latestRecords).reduce(
      (sum, record) => sum + parseInt(record.buyVolumeTao),
      0
    );
    const totalSellVolume = Object.values(latestRecords).reduce(
      (sum, record) => sum + parseInt(record.sellVolumeTao),
      0
    );
    const buySellRatio =
      totalSellVolume > 0 ? totalBuyVolume / totalSellVolume : 0;

    // Total TAO in AMM Pools (excluding Root)
    const totalTaoInPools = subnets.reduce(
      (sum, subnet) => (subnet.net_uid !== 0 ? sum + subnet.tao_in_pool : sum),
      0
    );

    // Root TAO
    const rootTao =
      subnets.find((subnet) => subnet.net_uid === 0)?.tao_in_pool || 0;

    // Total TAO in Network
    const totalTaoInNetwork = totalTaoInPools + rootTao;

    // Calculate percentages
    const taoInSubnetsPercentage = (totalTaoInPools / totalTaoInNetwork) * 100;
    const taoOnRootPercentage = (rootTao / totalTaoInNetwork) * 100;

    // Total Staked Alpha
    const totalStakedAlpha = subnets.reduce(
      (sum, subnet) => sum + subnet.alpha_staked,
      0
    );

    // Root Emission
    const rootEmission =
      subnets.find((subnet) => subnet.net_uid === 0)?.emission || 0;

    // Sum of Alpha Prices (excluding subnet 0 and only for subnets with >= 2000 ALPHA in pool)
    const sumAlphaPrices = subnets
      .filter((subnet) => subnet.net_uid !== 0 && subnet.alpha_in_pool >= 2000) // Exclude subnet 0 and filter for >= 2000 ALPHA in pool
      .reduce((sum, subnet) => sum + (latestPrices[subnet.net_uid] || 0), 0);

    return {
      totalVolume,
      totalTransactions,
      buySellRatio,
      totalTaoInPools,
      rootTao,
      totalTaoInNetwork,
      taoInSubnetsPercentage,
      taoOnRootPercentage,
      totalStakedAlpha,
      rootEmission,
      sumAlphaPrices,
    };
  };

  // Update cached metrics when data changes
  useEffect(() => {
    if (stakingData.length > 0 && subnets.length > 0) {
      const newMetrics = calculateNetworkMetrics();
      setCachedNetworkMetrics(newMetrics);
      setIsUpdating(false);
    }
  }, [stakingData, subnets, latestPrices]);

  // Set updating state when loading starts
  useEffect(() => {
    if (stakingLoading || subnetsLoading || alphaPricesLoading) {
      setIsUpdating(true);
    }
  }, [stakingLoading, subnetsLoading, alphaPricesLoading]);

  // Update isUpdating based on refreshing state
  useEffect(() => {
    if (stakingRefreshing || subnetsRefreshing || alphaPricesRefreshing) {
      setIsUpdating(true);
    }
  }, [stakingRefreshing, subnetsRefreshing, alphaPricesRefreshing]);

  // Use cached metrics for display
  const networkMetrics = cachedNetworkMetrics || calculateNetworkMetrics();

  // Calculate volumes for the selected timeframe
  const calculateVolumes = () => {
    // Get the most recent record
    const latestRecord = stakingData[0]; // Data is already sorted by date descending

    // Calculate volumes from the latest record
    const totalBuyVolume = latestRecord?.buyVolumeTao || 0;
    const totalSellVolume = latestRecord?.sellVolumeTao || 0;

    // Calculate unique participants from the latest record
    const uniqueBuyers = Array.isArray(latestRecord?.buyers)
      ? latestRecord.buyers.length
      : 0;
    const uniqueSellers = Array.isArray(latestRecord?.sellers)
      ? latestRecord.sellers.length
      : 0;

    return {
      totalBuyVolume,
      totalSellVolume,
      uniqueBuyers,
      uniqueSellers,
    };
  };

  const volumes = calculateVolumes();

  // Get selected subnet data
  const selectedSubnetData = selectedSubnet
    ? subnets.find((subnet) => subnet.net_uid === selectedSubnet)
    : null;

  // Calculate subnet-specific metrics
  const calculateSubnetMetrics = () => {
    if (!selectedSubnet) return null;

    const subnet = subnets.find((s) => s.net_uid === selectedSubnet);
    if (!subnet) return null;

    // Get the latest staking stats for this subnet
    const latestStats = (stakingData as StakingStatsTemporalRecord[])
      .filter((record) => record.netUid === selectedSubnet)
      .sort(
        (a, b) =>
          new Date(b.tsEnd || "").getTime() - new Date(a.tsEnd || "").getTime()
      )[0];

    // Get total transactions from the latest record's buys and sells
    const totalTransactions = latestStats
      ? parseInt(String(latestStats.buys || "0")) +
        parseInt(String(latestStats.sells || "0"))
      : 0;

    const alphaPrice = latestPrices[selectedSubnet] || 0;
    const utilization =
      subnet.alpha_staked + subnet.alpha_in_pool > 0
        ? (subnet.alpha_staked / (subnet.alpha_staked + subnet.alpha_in_pool)) *
          100
        : 0;

    // Calculate Alpha Distribution Ratio
    const alphaDistributionRatio =
      subnet.alpha_in_pool > 0 ? subnet.alpha_staked / subnet.alpha_in_pool : 0;

    // Calculate Market Cap
    const marketCap = subnet.alpha_staked * (latestPrices[selectedSubnet] || 0);

    // Calculate Alpha Supply
    const alphaSupply = subnet.alpha_in_pool + subnet.alpha_staked;

    // Calculate emission percentage and rank
    const filteredSubnets = subnets.filter((s) => s.net_uid !== 0); // Exclude root subnet
    const totalEmission = filteredSubnets.reduce(
      (sum, s) => sum + s.emission,
      0
    );
    const emissionPercentage = (subnet.emission / totalEmission) * 100;
    const emissionRank =
      filteredSubnets
        .sort((a, b) => b.emission - a.emission)
        .findIndex((s) => s.net_uid === subnet.net_uid) + 1;

    // Calculate volume metrics
    const buyVolume = latestStats
      ? parseFloat(String(latestStats.buyVolumeTao || 0))
      : 0;
    const sellVolume = latestStats
      ? parseFloat(String(latestStats.sellVolumeTao || 0))
      : 0;
    const totalVolume = buyVolume + sellVolume;
    const buySellRatio = sellVolume > 0 ? buyVolume / sellVolume : 0;

    // Directly use the counts from latestStats
    const uniqueBuyersCount = typeof latestStats?.buyers === 'number' ? latestStats.buyers : 0;
    const uniqueSellersCount = typeof latestStats?.sellers === 'number' ? latestStats.sellers : 0;
    const uniqueTradersCount = typeof latestStats?.traders === 'number' ? latestStats.traders : 0;

    return {
      alphaPrice,
      taoInPool: subnet.tao_in_pool,
      alphaInPool: subnet.alpha_in_pool,
      alphaStaked: subnet.alpha_staked,
      utilization,
      emission: subnet.emission,
      alphaDistributionRatio,
      marketCap,
      alphaSupply,
      emissionPercentage,
      emissionRank,
      totalTransactions,
      totalVolume,
      buySellRatio,
      uniqueBuyersCount,
      uniqueSellersCount,
      uniqueTradersCount,
    };
  };

  const subnetMetrics = calculateSubnetMetrics();

  const selectedSubnetInfo = useMemo(() => {
    if (selectedSubnet === null || !subnets || subnets.length === 0) return null;
    return subnets.find(subnet => subnet.net_uid === selectedSubnet) || null;
  }, [selectedSubnet, subnets]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-md">
            <BarChart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Bittensor Network Statistics
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor Bittensor network performance and subnet metrics
            </p>
          </div>
        </div>
      </div>

      {/* View Tabs and Controls */}
      <div className="flex items-center justify-between border-b border-border">
        <nav className="-mb-px flex space-x-4">
          <button
            onClick={() => setView("overview")}
            className={`${
              view === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Activity className="w-4 h-4 mr-2" />
            Overview
          </button>
          <button
            onClick={() => {
              setSelectedSubnet(null);
              setView("comparison");
            }}
            className={`${
              view === "comparison"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Table className="w-4 h-4 mr-2" />
            Subnet Comparison
          </button>
        </nav>

        <div className="flex gap-3">
          {view === "overview" && (
            <SubnetGridSelector
              subnets={subnets}
              selectedSubnet={selectedSubnet}
              onSubnetSelect={setSelectedSubnet}
              disabled={false}
            />
          )}

          <TimeIntervalDropdown
            selectedInterval={timeframe}
            onIntervalSelect={setTimeframe}
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-6">
        {view === "overview" ? (
          <>
            {/* Subnet Identity Banner - Only show for specific subnet selection */}
            {selectedSubnet !== null &&
              selectedSubnet !== 0 &&
              (() => {
                const selectedSubnetData = subnets.find(
                  (s) => s.net_uid === selectedSubnet
                );
                if (!selectedSubnetData) return null;

                return (
                  <div className="bg-card rounded-lg shadow-sm p-3 mb-3 border border-border">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center bg-primary/10 text-primary rounded-md w-8 h-8 text-sm font-medium">
                          {selectedSubnet}
                        </span>
                        <span className="inline-flex items-center justify-center px-3 py-1.5 bg-primary/10 text-primary rounded-lg font-medium">
                          {selectedSubnetData.symbol && (
                            <span className="font-mono mr-2">
                              {selectedSubnetData.symbol}
                            </span>
                          )}
                          <span>{selectedSubnetData.name || "Unknown"}</span>
                        </span>
                      </div>

                      {selectedSubnetData.description && (
                        <div className="flex-1 text-sm text-muted-foreground line-clamp-1">
                          {selectedSubnetData.description}
                        </div>
                      )}

                      <div className="flex gap-3 ml-auto">
                        {selectedSubnetData.github && (
                          <a
                            href={selectedSubnetData.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-primary hover:text-primary/80"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fillRule="evenodd"
                                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </a>
                        )}

                        {selectedSubnetData.discord && (
                          <a
                            href={selectedSubnetData.discord}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                            </svg>
                          </a>
                        )}

                        {selectedSubnetData.image_url && (
                          <a
                            href={selectedSubnetData.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                              />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* Network-wide metrics (Initial Set) */}
            <div
              className={`grid grid-cols-1 md:grid-cols-2 ${
                selectedSubnet && selectedSubnet !== 0
                  ? "lg:grid-cols-3 hidden"
                  : "lg:grid-cols-4"
              } gap-3`}
            >
              <StatsCard
                title="TAO Price"
                value={taoPrice ? `$${formatNumber(taoPrice)}` : "-"}
                loading={priceLoading && !taoPrice}
                icon={Coins}
              />
              <StatsCard
                title="Total Volume"
                value={`${formatTaoValue(networkMetrics.totalVolume)} τ`}
                subValue={
                  taoPrice
                    ? `$${formatNumber(networkMetrics.totalVolume * taoPrice)}`
                    : "-"
                }
                loading={stakingLoading}
                icon={TrendingUp}
              />
              <StatsCard
                title="Buy/Sell Ratio"
                value={formatNumber(networkMetrics.buySellRatio)}
                loading={stakingLoading}
                icon={TrendingUp}
              />
              {(!selectedSubnet || selectedSubnet === 0) && (
                <StatsCard
                  title="Total Transactions"
                  value={formatNumber(networkMetrics.totalTransactions, 0)}
                  loading={stakingLoading}
                  icon={Activity}
                />
              )}
            </div>

            {/* Restored Network Liquidity and Alpha Metrics (only for network-wide view) */}
            {(!selectedSubnet || selectedSubnet === 0) && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <StatsCard
                  title="Total TAO in AMM Pools"
                  value={`${formatTaoValue(networkMetrics.totalTaoInPools)} τ`}
                  subValue={
                    taoPrice
                      ? `$${formatNumber(
                          networkMetrics.totalTaoInPools * taoPrice
                        )}`
                      : "-"
                  }
                  loading={subnetsLoading && !cachedNetworkMetrics} // Use cachedNetworkMetrics for loading condition
                  icon={Wallet}
                />
                <StatsCard
                  title="Root TAO"
                  value={`${formatTaoValue(networkMetrics.rootTao)} τ`}
                  subValue={
                    taoPrice
                      ? `$${formatNumber(networkMetrics.rootTao * taoPrice)}`
                      : "-"
                  }
                  loading={subnetsLoading && !cachedNetworkMetrics}
                  icon={Coins}
                />
                <StatsCard
                  title="Total Staked Alpha"
                  value={`${formatAlphaValue(
                    networkMetrics.totalStakedAlpha
                  )} α`}
                  loading={subnetsLoading && !cachedNetworkMetrics}
                  icon={Users}
                />
                <StatsCard
                  title="Sum of Alpha Prices"
                  value={formatNumber(networkMetrics.sumAlphaPrices)}
                  loading={alphaPricesLoading && !cachedNetworkMetrics}
                  icon={TrendingUp}
                />
              </div>
            )}

            {/* Network Wide Charts (only for network-wide view) */}
            {(!selectedSubnet || selectedSubnet === 0) && (
              <div className="mt-6 grid grid-cols-12 gap-3">
                <div className="col-span-12 bg-card rounded-lg shadow-sm min-h-[500px] p-6">
                  <NetworkCharts
                    stakingData={stakingData}
                    subnets={subnets}
                    networkMetrics={networkMetrics}
                    selectedSubnet={null}
                    alphaPrices={latestPrices}
                    timeframe={timeframe}
                    showNetworkWideTradingVolumeChart={true}
                    showNetworkWideTransactionsChart={true}
                    showTradingVolumeChart={false}
                    showSubnetVolumeChart={false}
                    showSubnetTransactionsChart={false}
                    showSubnetNetVolumeChart={false}
                  />
                </div>
              </div>
            )}

            {/* Conditional rendering for subnet-specific view (when selectedSubnet is not null and not 0) */}
            {selectedSubnet && selectedSubnet !== 0 && (
              <>
                {/* Top section with sidepanel and volume chart */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-1">
                    <div className="h-[500px]">
                      {subnetMetrics && (
                        <SubnetStatsSidepanel
                          subnetMetrics={subnetMetrics}
                          taoPrice={taoPrice}
                          loading={subnetsLoading || stakingLoading || alphaPricesLoading}
                        />
                      )}
                    </div>
                  </div>
                  <div className="lg:col-span-3">
                    <MainVolumeChart
                      stakingData={stakingData}
                      subnets={subnets}
                      selectedSubnet={selectedSubnet}
                      selectedSubnetInfo={selectedSubnetInfo}
                      timeframe={timeframe as "daily" | "weekly" | "monthly" | "blocks"}
                      networkMetrics={networkMetrics}
                      alphaPrices={latestPrices}
                    />
                  </div>
                </div>

                {/* Full-width subnet-specific charts section using the same NetworkCharts component */}
                <div className="mt-4">
                  <NetworkCharts
                    stakingData={stakingData}
                    subnets={subnets}
                    networkMetrics={networkMetrics}
                    selectedSubnet={selectedSubnet}
                    alphaPrices={latestPrices}
                    timeframe={timeframe}
                    
                    showNetworkWideTradingVolumeChart={false}
                    showNetworkWideTransactionsChart={false}
                    
                    showTradingVolumeChart={true}
                    showSubnetVolumeChart={true}
                    showSubnetTransactionsChart={true}
                    showSubnetNetVolumeChart={true}
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <SubnetComparison
            subnets={subnets}
            stakingData={stakingData}
            alphaPrices={latestPrices}
            loading={subnetsLoading || stakingLoading || alphaPricesLoading}
            initialSelectedSubnet={selectedSubnet}
            timeframe={timeframe as "daily" | "weekly" | "monthly" | "blocks"}
          />
        )}
      </div>
    </div>
  );
}

export default function StatisticsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StatisticsPageContent />
    </Suspense>
  );
}
