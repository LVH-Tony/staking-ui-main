import { useState, useEffect, useRef } from "react";
import {
  PaginatedResponse,
  StakingStatsBlocksRecord,
  StakingStatsRecord,
  StakingStatsTemporalRecord,
} from "@/types";
import { BASE_API_URL } from "@/constants/shared";
import { STATS_TIMEFRAMES, StatsTimeframe } from "@/types/staking";

const REFRESH_INTERVAL = 30000; // Refresh every 30 seconds

interface UseStakingStatsProps {
  timeframe: StatsTimeframe;
  netUid?: number;
}

const convertRaoToTao = (raoAmount: string | number): string => {
  return (parseFloat(String(raoAmount)) / 1e9).toFixed(2);
};

export const useStakingStats = ({
  timeframe,
  netUid,
}: UseStakingStatsProps) => {
  const [data, setData] = useState<StakingStatsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isInitialLoad = useRef(true);

  const fetchAllPages = async (silentRefresh = false) => {
    try {
      // Only set loading to true on initial load or non-silent refreshes
      if (!silentRefresh) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError(null);

      let allData: StakingStatsRecord[] = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const basePath =
          timeframe === "blocks"
            ? "/staking/stats/blocks"
            : "/staking/stats/temporal";

        const params = [
          `page=${currentPage}`,
          "limit=1000",
          "sortDirection=DESC",
          ...(timeframe !== "blocks" ? [`resolution=${timeframe}`] : []),
          ...(netUid ? [`net_uid=${netUid}`] : []),
        ].join("&");

        const url = `${BASE_API_URL}${basePath}?${params}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch staking stats");

        const result: PaginatedResponse<
          StakingStatsRecord | StakingStatsBlocksRecord
        > = await response.json();

        // Convert Rao to Tao for volume fields
        const convertedData: StakingStatsRecord[] = result.data.map(
          (record: StakingStatsRecord) => ({
            ...record,
            buyVolumeAlpha: convertRaoToTao(record.buyVolumeAlpha),
            buyVolumeTao: convertRaoToTao(record.buyVolumeTao),
            sellVolumeAlpha: convertRaoToTao(record.sellVolumeAlpha),
            sellVolumeTao: convertRaoToTao(record.sellVolumeTao),
            totalVolumeAlpha: convertRaoToTao(record.totalVolumeAlpha),
            totalVolumeTao: convertRaoToTao(record.totalVolumeTao),
          })
        );

        allData = [...allData, ...convertedData];

        hasMorePages = currentPage < result.totalPages;
        currentPage++;

        // Add a small delay between requests
        if (hasMorePages) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        const is1minOr5minTimeframe =
          timeframe === STATS_TIMEFRAMES["1min"] ||
          timeframe === STATS_TIMEFRAMES["5min"];

        if (is1minOr5minTimeframe) {
          // break the loop because huge data
          hasMorePages = false;
        }
      }

      // Sort data by date or block number
      allData.sort((a, b) => {
        if (timeframe === "blocks") {
          const blockA = a as StakingStatsBlocksRecord;
          const blockB = b as StakingStatsBlocksRecord;
          return (blockB.blockStart || 0) - (blockA.blockStart || 0); // Descending order
        }
        // Use string comparison for dates since they're in YYYY-MM-DD format
        // Sort in descending order (newest first)

        const dateA = a as StakingStatsTemporalRecord;
        const dateB = b as StakingStatsTemporalRecord;

        return (dateB.tsStart || "").localeCompare(dateA.tsStart || "");
      });

      setData(allData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      isInitialLoad.current = false;
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchAllPages();

    // Set up refresh interval with silent refresh
    const intervalId = setInterval(() => {
      fetchAllPages(true);
    }, REFRESH_INTERVAL);

    // Cleanup interval on unmount or when dependencies change
    return () => clearInterval(intervalId);
  }, [timeframe, netUid]);

  return { data, loading, error, isRefreshing };
};
