import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { BASE_API_URL } from "@/constants/shared";

interface AlphaPrice {
  net_uid: number;
  price_in_tao: number;
  timestamp: string;
}

interface AlphaPricesResponse {
  data: AlphaPrice[];
  total: number;
  page: number;
  page_size: number;
}

const fetchAlphaPrices = async (): Promise<AlphaPricesResponse> => {
  const response = await fetch(
    `${BASE_API_URL}/prices/latest?page=1&limit=1000&sortDirection=DESC`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch alpha prices");
  }
  return response.json();
};

export const useAlphaPrices = () => {
  const [latestPrices, setLatestPrices] = useState<Record<number, number>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isInitialLoad = useRef(true);

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["alphaPrices"],
    queryFn: fetchAlphaPrices,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Update isRefreshing based on isFetching
  useEffect(() => {
    if (isFetching && !isInitialLoad.current) {
      setIsRefreshing(true);
    } else {
      setIsRefreshing(false);
    }
  }, [isFetching]);

  useEffect(() => {
    if (data?.data) {
      const prices = data.data.reduce((acc, price) => {
        acc[price.net_uid] = price.price_in_tao;
        return acc;
      }, {} as Record<number, number>);
      setLatestPrices(prices);
      isInitialLoad.current = false;
    }
  }, [data]);

  return {
    latestPrices,
    isLoading,
    isRefreshing,
    error,
  };
};

export default useAlphaPrices;
