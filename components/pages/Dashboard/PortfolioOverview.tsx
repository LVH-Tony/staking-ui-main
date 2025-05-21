import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface SubnetToken {
  balance: number;
  netuid: number;
  name: string;
}

interface Metrics {
  subnetTokens: SubnetToken[];
  totalBalance: number;
}

interface PortfolioOverviewProps {
  metrics: Metrics;
  onWithdraw: () => Promise<void>;
  loading: boolean;
}

export function PortfolioOverview({
  metrics,
  onWithdraw,
  loading,
}: PortfolioOverviewProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Portfolio Overview</h2>
        <Button onClick={onWithdraw} variant="outline">
          Withdraw All
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
          <span className="font-medium">Total Balance</span>
          <span className="font-bold">
            ${metrics.totalBalance.toLocaleString()}
          </span>
        </div>

        <div className="space-y-2">
          {metrics.subnetTokens.map((token) => (
            <div
              key={token.netuid}
              className="flex justify-between items-center p-4 border rounded-lg"
            >
              <span className="text-gray-600">{token.name}</span>
              <span className="font-medium">
                ${token.balance.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
