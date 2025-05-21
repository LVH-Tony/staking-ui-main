import { TrendingUp } from "lucide-react";
import type { SubnetToken } from "@/types/staking";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface SubnetCardProps {
  token: SubnetToken;
}

export function SubnetCard({ token }: SubnetCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Subnet {token.symbol}
              <span className="text-sm font-normal text-muted-foreground">
                #{token.netuid}
              </span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Emissions: {token.sn0Emissions?.toFixed(4) || "0.0000"} τ
            </p>
          </div>
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="bg-accent/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Subnet Token Balance</span>
              <span className="text-sm font-medium">
                {token.subnetTokenBalance.toFixed(2)} {token.symbol}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">TAO Value</span>
              <span className="text-sm font-medium">
                {token.balance.toFixed(2)} τ
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">USD Value:</span>
              <div className="text-right">
                <span className="font-medium">
                  ${token.usdValue.toLocaleString()}
                </span>
                <p className="text-xs text-muted-foreground">
                  ${(token.usdValue / token.subnetTokenBalance).toFixed(2)} per{" "}
                  {token.symbol}
                </p>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Market Cap:</span>
              <span className="font-medium">
                $
                {(token.subnetTokenBalance
                  ? (token.usdValue / token.subnetTokenBalance) *
                    token.totalSupply
                  : 0
                ).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Exchange Rate:</span>
              <div className="flex items-center gap-1">
                <span className="font-medium">
                  {token.taoRatio.toFixed(1)} {token.symbol} = 1 τ
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
