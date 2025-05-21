import { useQuery } from "@tanstack/react-query";
import { TaoPriceData } from "@/types";

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bittensor&vs_currencies=usd&include_24hr_change=true";

interface TaoPriceResponse {
  bittensor: {
    usd: number;
    usd_24h_change: number;
  };
}

const fetchTaoPrice = async (): Promise<TaoPriceData> => {
  const response = await fetch(COINGECKO_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch TAO price");
  }
  const data: TaoPriceResponse = await response.json();
  return {
    current: data.bittensor.usd,
    timestamp: new Date().toISOString(),
    change: {
      "1D": data.bittensor.usd_24h_change,
      "1W": data.bittensor.usd_24h_change,
      "1M": data.bittensor.usd_24h_change,
      ALL: data.bittensor.usd_24h_change,
    },
  };
};

export const useTaoPrice = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["taoPrice"],
    queryFn: fetchTaoPrice,
    refetchInterval: 5 * 60 * 1000, // Poll every 5 minutes
  });

  return {
    price: data?.current ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    change: data?.change ?? null,
  };
};
