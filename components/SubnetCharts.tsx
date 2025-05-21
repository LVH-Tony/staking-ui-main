import React from "react";
import NetworkCharts from "./NetworkCharts";

interface SubnetChartsProps {
  stakingData: any[];
  subnets: any[];
  selectedSubnet: number | null;
  timeframe?: "daily" | "weekly" | "monthly" | "blocks";
  networkMetrics?: {
    totalVolume: number;
    totalTransactions: number;
    buySellRatio: number;
    totalTaoInPools: number;
    rootTao: number;
    totalStakedAlpha: number;
    rootEmission: number;
    sumAlphaPrices: number;
  };
  alphaPrices?: Record<number, number>;
}

export const SubnetCharts: React.FC<SubnetChartsProps> = ({
  stakingData,
  subnets,
  selectedSubnet,
  timeframe = "daily",
  networkMetrics = {
    totalVolume: 0,
    totalTransactions: 0,
    buySellRatio: 1,
    totalTaoInPools: 0,
    rootTao: 0,
    totalStakedAlpha: 0,
    rootEmission: 0,
    sumAlphaPrices: 0,
  },
  alphaPrices = {},
}) => {
  // Early return if no subnet selected or root (0) subnet
  if (selectedSubnet === null || selectedSubnet === 0) {
    return null;
  }

  return (
    <NetworkCharts
      stakingData={stakingData}
      subnets={subnets}
      selectedSubnet={selectedSubnet}
      timeframe={timeframe as any}
      networkMetrics={networkMetrics}
      alphaPrices={alphaPrices}
    />
  );
}; 