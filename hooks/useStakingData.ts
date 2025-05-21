import { useState, useEffect } from "react";

interface StakingRecord {
  id: string;
  height: number;
  timestamp: string;
  extrinsic_id: number;
  coldkey: string;
  hotkey: string;
  net_uid: number;
  alpha: string;
  tao: string;
  action: "STAKING" | "UNSTAKING";
}

interface StakingApiResponse {
  data: StakingRecord[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface StakingFilters {
  page?: number;
  limit?: number;
  sortDirection?: "ASC" | "DESC";
  netUid?: number;
  action?: "STAKING" | "UNSTAKING";
  coldkey?: string;
  hotkey?: string;
}

const DEFAULT_FILTERS: StakingFilters = {
  page: 1,
  limit: 10,
  sortDirection: "DESC",
};

export const useStakingData = (
  filters: StakingFilters | null = DEFAULT_FILTERS,
) => {
  const [stakingData, setStakingData] = useState<StakingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: filters?.page || 1,
    totalPages: 0,
    total: 0,
  });

  useEffect(() => {
    const fetchStakingData = async () => {
      // If filters is null, don't fetch data
      if (!filters) {
        setStakingData([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Construct URL with query parameters
        const queryParams = new URLSearchParams({
          page: (filters.page || 1).toString(),
          limit: (filters.limit || 10).toString(),
          sortDirection: filters.sortDirection || "DESC",
        });

        if (filters.netUid !== undefined) {
          queryParams.append("netUid", filters.netUid.toString());
        }
        if (filters.action) {
          queryParams.append("action", filters.action);
        }
        if (filters.coldkey) {
          queryParams.append("coldkey", filters.coldkey);
        }
        if (filters.hotkey) {
          queryParams.append("hotkey", filters.hotkey);
        }

        const url = `https://api.app.trustedstake.ai/staking?${queryParams.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch staking data");
        }

        const data: StakingApiResponse = await response.json();

        setStakingData(data.data);
        setPagination({
          currentPage: data.page,
          totalPages: data.totalPages,
          total: data.total,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to fetch staking data"),
        );
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStakingData();

    // Only set up polling if the component is mounted
    let mounted = true;
    const interval = setInterval(() => {
      if (mounted) {
        fetchStakingData();
      }
    }, 60 * 1000);

    // Cleanup function
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [
    filters?.page,
    filters?.limit,
    filters?.sortDirection,
    filters?.netUid,
    filters?.action,
    filters?.coldkey,
    filters?.hotkey,
  ]);

  // Helper functions
  const getStakingsBySubnet = (netUid: number) =>
    stakingData.filter((record) => record.net_uid === netUid);

  const getStakingsByColdkey = (coldkey: string) =>
    stakingData.filter((record) => record.coldkey === coldkey);

  const getStakingsByHotkey = (hotkey: string) =>
    stakingData.filter((record) => record.hotkey === hotkey);

  const getTotalTaoStaked = () =>
    stakingData
      .filter((record) => record.action === "STAKING")
      .reduce((sum, record) => sum + parseFloat(record.tao), 0);

  const getTotalTaoUnstaked = () =>
    stakingData
      .filter((record) => record.action === "UNSTAKING")
      .reduce((sum, record) => sum + parseFloat(record.tao), 0);

  return {
    stakingData,
    loading,
    error,
    pagination,
    // Helper functions
    getStakingsBySubnet,
    getStakingsByColdkey,
    getStakingsByHotkey,
    getTotalTaoStaked,
    getTotalTaoUnstaked,
  };
};
