import { BASE_API_URL } from "@/constants/shared";
import { useQuery } from "@tanstack/react-query";

interface UdfHistoryResponse {
  s: "ok";
  t: number[];
  o: number[];
  h: number[];
  l: number[];
  c: number[];
}

export type HistoryTimeframe = "1min" | "5min" | "15min" | "60min" | "1day";

interface UseUdfHistoryProps {
  timeframe: HistoryTimeframe;
  netUid: number;
}

const getTimeframes = (timeframe: HistoryTimeframe) => {
  const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
  const oneMinute = 60;
  const oneHour = 60 * oneMinute;
  const oneDay = 24 * oneHour;
  const oneWeek = 7 * oneDay;
  const oneMonth = 30 * oneDay;
  const oneYear = 365 * oneDay;

  let from: number;
  switch (timeframe) {
    case "1min":
    case "5min":
      from = now - oneDay; // Last 1 day for 1min and 5min
      break;
    case "15min":
      from = now - oneWeek; // Last 1 week for 15min
      break;
    case "60min":
      from = now - oneMonth; // Last 1 month for 1 hour
      break;
    case "1day":
    default:
      from = now - oneYear; // Last 1 year for 1 day
      break;
  }

  return {
    from,
    to: now,
  };
};

export const useUdfHistory = ({ timeframe, netUid }: UseUdfHistoryProps) => {
  const fetchUdfHistory = async (): Promise<UdfHistoryResponse> => {
    const { from, to } = getTimeframes(timeframe);
    const response = await fetch(
      `${BASE_API_URL}/udf/history?symbol=SUB-${netUid}&from=${from}&to=${to}&resolution=${timeframe}`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch UDF history");
    }

    const data = await response.json();

    if (data.s !== "ok") {
      throw new Error("Invalid response from UDF history");
    }
    return data;
  };

  const { data, isLoading, error } = useQuery<UdfHistoryResponse>({
    queryKey: ["udfHistory", netUid, timeframe],
    queryFn: fetchUdfHistory,
    refetchInterval: 5 * 60 * 1000, // Poll every 5 minutes
  });

  return {
    data: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  };
};
