import React from "react";
import OHLCChart from "./OHLCChart";
import { Button } from "./ui/button";
import Link from "next/link";
import { Subnet } from "@/types";

interface MainVolumeChartProps {
  stakingData: any[];
  subnets: any[];
  selectedSubnet: number | null;
  selectedSubnetInfo: Subnet | null;
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

export const MainVolumeChart: React.FC<MainVolumeChartProps> = ({
  selectedSubnet,
  selectedSubnetInfo,
}) => {
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow duration-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          {selectedSubnetInfo && selectedSubnetInfo.symbol && (
            <span className="mr-2 px-2 py-1 rounded bg-primary/10 text-primary text-sm font-bold">
              {selectedSubnetInfo.symbol}
            </span>
          )}
          Alpha Price Chart
        </h3>
        {selectedSubnet !== null && selectedSubnetInfo && (
          <Link href={`/stake?from=TAO&to=Subnet ${selectedSubnet}&netUid=${selectedSubnet}`} passHref>
            <Button variant="outline" size="sm">
              Trade {selectedSubnetInfo.symbol || `SN${selectedSubnet}`}
            </Button>
          </Link>
        )}
      </div>
      <div className="h-[400px] pb-6">
        {selectedSubnet !== null ? (
          <OHLCChart height={370} netUid={selectedSubnet} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a subnet to view price chart
          </div>
        )}
      </div>
    </div>
  );
};
