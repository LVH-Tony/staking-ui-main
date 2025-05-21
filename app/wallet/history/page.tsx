"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Filter,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  History as HistoryIcon,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import type { Transaction } from "@/types/wallet";
import type { StakingTransaction, StakingResponse } from "@/types/staking";
import { useApi } from "@/contexts/api";
import { useStakingData } from "@/hooks/useStakingData";
import WalletConnectMessage from "@/components/common/WalletConnectMessage";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useSubnetAndValidators } from "@/contexts/subnetsAndValidators";

type TransactionType = "all" | "buy" | "sell" | "staking";
type TimeRange = "24h" | "7d" | "30d" | "90d" | "all";
type SortField =
  | "timestamp"
  | "action"
  | "net_uid"
  | "tao"
  | "status"
  | "alpha_price";
type SortDirection = "asc" | "desc";

const RAO_TO_TAO = 1e9;

const convertRaoToTao = (rao: string | number): number => {
  return Number(rao) / RAO_TO_TAO;
};

function HistoryContent() {
  // Helper functions first
  const getTimeRangeFilter = (
    tx: StakingTransaction,
    currentTimeRange: TimeRange,
  ) => {
    const now = new Date();
    const txDate = new Date(tx.timestamp);
    const diffInHours = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60);

    switch (currentTimeRange) {
      case "24h":
        return diffInHours <= 24;
      case "7d":
        return diffInHours <= 24 * 7;
      case "30d":
        return diffInHours <= 24 * 30;
      case "90d":
        return diffInHours <= 24 * 90;
      case "all":
        return true;
      default:
        return true;
    }
  };

  const getSortedTransactions = (
    transactions: StakingTransaction[],
    currentSortField: SortField,
    currentSortDirection: SortDirection,
  ) => {
    return [...transactions].sort((a, b) => {
      let comparison = 0;
      switch (currentSortField) {
        case "timestamp":
          comparison =
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case "action":
          comparison = a.action.localeCompare(b.action);
          break;
        case "net_uid":
          comparison = a.net_uid - b.net_uid;
          break;
        case "tao":
          comparison = convertRaoToTao(a.tao) - convertRaoToTao(b.tao);
          break;
        case "alpha_price":
          comparison =
            convertRaoToTao(a.tao) / convertRaoToTao(a.alpha) -
            convertRaoToTao(b.tao) / convertRaoToTao(b.alpha);
          break;
        case "status":
          comparison = 0; // All statuses are "Completed" for now
          break;
      }
      return currentSortDirection === "asc" ? comparison : -comparison;
    });
  };

  const getPnL = (transactions: StakingTransaction[]) => {
    let totalBought = 0;
    let totalSold = 0;
    let totalBoughtValue = 0;
    let totalSoldValue = 0;
    let totalBoughtExcludingRoot = 0;
    let totalBoughtValueExcludingRoot = 0;
    let totalSoldExcludingRoot = 0;
    let totalSoldValueExcludingRoot = 0;

    transactions.forEach((tx) => {
      const taoAmount = convertRaoToTao(tx.tao);
      const alphaAmount = convertRaoToTao(tx.alpha);
      const price = taoAmount / alphaAmount;

      if (tx.action === "STAKING") {
        totalBought += taoAmount;
        totalBoughtValue += taoAmount * price;

        // Exclude subnet 0 from calculations
        if (tx.net_uid !== 0) {
          totalBoughtExcludingRoot += taoAmount;
          totalBoughtValueExcludingRoot += taoAmount * price;
        }
      } else {
        totalSold += taoAmount;
        totalSoldValue += taoAmount * price;

        // Exclude subnet 0 from calculations
        if (tx.net_uid !== 0) {
          totalSoldExcludingRoot += taoAmount;
          totalSoldValueExcludingRoot += taoAmount * price;
        }
      }
    });

    const netPnL = totalSoldExcludingRoot - totalBoughtExcludingRoot;
    const netPnLValue =
      totalSoldValueExcludingRoot - totalBoughtValueExcludingRoot;

    return {
      totalBought,
      totalSold,
      netPnL,
      netPnLValue,
      averageBuyPrice:
        totalBoughtExcludingRoot > 0
          ? totalBoughtValueExcludingRoot / totalBoughtExcludingRoot
          : 0,
      averageSellPrice:
        totalSoldExcludingRoot > 0
          ? totalSoldValueExcludingRoot / totalSoldExcludingRoot
          : 0,
    };
  };

  // Hooks
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    state: { currentAccount },
  } = useApi();
  const { subnets, loading: subnetsLoading } = useSubnetAndValidators();

  // All useState hooks
  const [transactionType, setTransactionType] =
    useState<TransactionType>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [stakingTransactions, setStakingTransactions] = useState<
    StakingTransaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubnets, setSelectedSubnets] = useState<Set<number>>(
    new Set(),
  );
  const [isSubnetFilterOpen, setIsSubnetFilterOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Staking data hook
  const {
    stakingData,
    loading: stakingLoading,
    error: stakingError,
  } = useStakingData(
    currentAccount?.address
      ? {
          coldkey: currentAccount.address,
          sortDirection: "DESC",
          limit: 1000,
        }
      : null,
  );

  // All useMemo hooks
  const uniqueSubnets = useMemo(() => {
    return Array.from(
      new Set(stakingTransactions.map((tx) => tx.net_uid)),
    ).sort((a, b) => a - b);
  }, [stakingTransactions]);

  const filteredTransactions = useMemo(() => {
    return getSortedTransactions(
      stakingTransactions.filter((tx) => {
        // Apply time range filter
        if (!getTimeRangeFilter(tx, timeRange)) return false;

        // Apply subnet filter if any subnets are selected
        if (selectedSubnets.size > 0 && !selectedSubnets.has(tx.net_uid)) {
          return false;
        }

        // Apply transaction type filter
        if (transactionType === "all") return true;
        if (transactionType === "buy" && tx.action === "STAKING") return true;
        if (transactionType === "sell" && tx.action === "UNSTAKING")
          return true;
        return false;
      }),
      sortField,
      sortDirection,
    );
  }, [
    stakingTransactions,
    selectedSubnets,
    transactionType,
    timeRange,
    sortField,
    sortDirection,
  ]);

  const pnl = useMemo(() => {
    return getPnL(filteredTransactions);
  }, [filteredTransactions]);

  const displayTransactions = useMemo(() => {
    return filteredTransactions;
  }, [filteredTransactions]);

  // All useEffect hooks
  useEffect(() => {
    if (typeof window === "undefined") return;

    const type = searchParams.get("type") as TransactionType;
    const range = searchParams.get("timeRange") as TimeRange;
    const subnetsParam = searchParams.get("subnets");

    if (type && ["all", "buy", "sell"].includes(type)) {
      setTransactionType(type);
    }
    if (range && ["24h", "7d", "30d", "90d", "all"].includes(range)) {
      setTimeRange(range);
    }
    if (subnetsParam) {
      const subnetIds = subnetsParam.split(",").map(Number);
      setSelectedSubnets(new Set(subnetIds));
    }
    setIsInitialLoad(false);
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined" || isInitialLoad) return;

    try {
      const params = new URLSearchParams(searchParams.toString());

      if (transactionType !== "all") {
        params.set("type", transactionType);
      } else {
        params.delete("type");
      }

      if (timeRange !== "30d") {
        params.set("timeRange", timeRange);
      } else {
        params.delete("timeRange");
      }

      if (selectedSubnets.size > 0) {
        params.set("subnets", Array.from(selectedSubnets).join(","));
      } else {
        params.delete("subnets");
      }

      const newSearch = params.toString();
      const newPath = `/wallet/history${newSearch ? `?${newSearch}` : ""}`;
      router.replace(newPath, { scroll: false });
    } catch (error) {
      console.error("Error updating URL:", error);
    }
  }, [
    transactionType,
    timeRange,
    selectedSubnets,
    router,
    isInitialLoad,
    searchParams,
  ]);

  useEffect(() => {
    if (!stakingData || stakingLoading) {
      return;
    }

    try {
      setStakingTransactions(stakingData);
    } catch (error) {
      console.error("Error setting staking transactions:", error);
      setStakingTransactions([]);
    }
  }, [stakingData, stakingLoading]);

  useEffect(() => {
    if (!stakingData?.length || selectedSubnets.size > 0) return;

    const uniqueSubnets = new Set(stakingData.map((tx) => tx.net_uid));
    setSelectedSubnets(uniqueSubnets);
  }, [stakingData]);

  // Show connect wallet message if no account
  if (!currentAccount?.address) {
    return <WalletConnectMessage />;
  }

  // Show loading state
  if (stakingLoading || subnetsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading transaction history...</div>
      </div>
    );
  }

  // Show error state
  if (stakingError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">
          Error loading transaction history. Please try again later.
        </div>
      </div>
    );
  }

  const handleSubnetToggle = (subnetId: number) => {
    setSelectedSubnets((prev) => {
      const newSelectedSubnets = new Set(prev);
      if (newSelectedSubnets.has(subnetId)) {
        newSelectedSubnets.delete(subnetId);
      } else {
        newSelectedSubnets.add(subnetId);
      }
      return newSelectedSubnets;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getAlphaPrice = (
    tao: string | number,
    alpha: string | number,
  ): string => {
    const taoAmount = convertRaoToTao(tao);
    const alphaAmount = convertRaoToTao(alpha);

    if (taoAmount < 0.00000001 || alphaAmount < 0.00000001) {
      return "0.000";
    }

    return (taoAmount / alphaAmount).toFixed(3);
  };

  const downloadCSV = () => {
    const headers = [
      "Date",
      "Type",
      "Amount (τ)",
      "Alpha Price (τ/α)",
      "Subnet",
      "Status",
    ].join(",");

    const rows = displayTransactions.map((tx) =>
      [
        new Date(tx.timestamp).toISOString(),
        tx.action === "STAKING" ? "Buy" : "Sell",
        convertRaoToTao(tx.tao).toFixed(3),
        getAlphaPrice(tx.tao, tx.alpha),
        `Subnet ${tx.net_uid}`,
        "Completed",
      ].join(","),
    );

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staking-transactions-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl shadow-md">
            <HistoryIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              Transaction History
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View and export your complete transaction history
            </p>
          </div>
        </div>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex gap-2">
              {(["all", "buy", "sell"] as TransactionType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setTransactionType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    transactionType === type
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <div className="flex gap-2">
              {(["24h", "7d", "30d", "90d", "all"] as TimeRange[]).map(
                (range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === range
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {range.toUpperCase()}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Subnet Filter */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSubnetFilterOpen(!isSubnetFilterOpen)}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              {isSubnetFilterOpen ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide Subnet Filter
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show Subnet Filter
                </>
              )}
            </button>
            {isSubnetFilterOpen && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedSubnets.size} of {uniqueSubnets.length} selected
                </span>
                <button
                  onClick={() => setSelectedSubnets(new Set())}
                  className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setSelectedSubnets(new Set(uniqueSubnets))}
                  className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Select All
                </button>
              </div>
            )}
          </div>
          {isSubnetFilterOpen && (
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {uniqueSubnets.map((subnetId) => (
                <button
                  key={subnetId}
                  onClick={() => handleSubnetToggle(subnetId)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedSubnets.has(subnetId)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  Subnet {subnetId}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PnL Summary */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Bought</p>
              <p className="font-medium dark:text-gray-200">{pnl.totalBought.toFixed(3)} τ</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Sold</p>
              <p className="font-medium dark:text-gray-200">{pnl.totalSold.toFixed(3)} τ</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Net PnL</p>
              <p
                className={`font-medium ${
                  pnl.netPnL >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {pnl.netPnL.toFixed(3)} τ
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Buy Price</p>
              <p className="font-medium dark:text-gray-200">
                {pnl.averageBuyPrice.toFixed(3)} τ/α
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th
                  className="text-left pb-4 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={() => handleSort("timestamp")}
                >
                  <div className="flex items-center gap-1">
                    Date & Time
                    <SortIcon field="timestamp" />
                  </div>
                </th>
                <th className="text-left pb-4 font-medium">
                  <div className="flex items-center gap-1">Type</div>
                </th>
                <th
                  className="text-right pb-4 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={() => handleSort("tao")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount (τ)
                    <SortIcon field="tao" />
                  </div>
                </th>
                <th
                  className="text-right pb-4 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={() => handleSort("alpha_price")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Alpha Price (τ/α)
                    <SortIcon field="alpha_price" />
                  </div>
                </th>
                <th className="text-left pb-4 font-medium pl-8">
                  <div className="flex items-center gap-1">Subnet</div>
                </th>
                <th className="text-right pb-4 font-medium">
                  <div className="flex items-center justify-end gap-1">
                    Status
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {isLoading || subnetsLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : displayTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No transactions found
                  </td>
                </tr>
              ) : (
                displayTransactions.map((tx) => (
                  <tr key={tx.id} className="group hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="py-4">
                      <div>
                        <p className="font-medium dark:text-gray-200">
                          {new Date(tx.timestamp).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(tx.timestamp).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        {tx.action === "STAKING" ? (
                          <ArrowUpCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <ArrowDownCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className="capitalize dark:text-gray-200">
                          {tx.action === "STAKING" ? "Buy" : "Sell"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <span className="font-medium dark:text-gray-200">
                        {convertRaoToTao(tx.tao).toFixed(3)} τ
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="font-medium dark:text-gray-200">
                        {getAlphaPrice(tx.tao, tx.alpha)} τ/α
                      </span>
                    </td>
                    <td className="py-4 pl-8">
                      <div className="flex items-center gap-1">
                        <span className="font-medium dark:text-gray-200">Subnet {tx.net_uid}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-green-500 font-medium">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function History() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HistoryContent />
    </Suspense>
  );
}
