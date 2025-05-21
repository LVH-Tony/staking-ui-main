import { TrendingUp, Network, Zap } from "lucide-react";
import type { SubnetToken } from "@/types/staking";
import { motion } from "framer-motion";
import { useAlphaPrices } from "@/hooks/useAlphaPrices";

interface TopSubnetCardProps {
  token: {
    netuid: number;
    symbol: string;
    balance: number;
    subnetTokenBalance: number;
    totalSupply: number;
    taoRatio: number;
    sn0Emissions: number;
    alpha_staked: number;
  };
  rank: number;
  index: number;
  taoPrice?: number;
}

export function TopSubnetCard({ token, rank, index, taoPrice }: TopSubnetCardProps) {
  const { latestPrices } = useAlphaPrices();
  const alphaPrice = latestPrices[token.netuid] || 0;
  const marketCap = token.totalSupply * alphaPrice;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-border"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-lg">
            <Network className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground">
              Subnet {token.symbol}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">Rank #{rank}</span>
              <div className="flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-full">
                <Zap className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs font-medium text-green-500">
                  {token.sn0Emissions?.toFixed(4) || "0.0000"} τ
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground mb-1">TAO in Pool</span>
            <span className="text-lg font-semibold text-foreground">
              {token.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} τ
            </span>
            <span className="text-xs text-muted-foreground">
              ${taoPrice ? (token.balance * taoPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
            </span>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground mb-1">Alpha in Pool</span>
            <span className="text-lg font-semibold text-foreground">
              {token.subnetTokenBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} α
            </span>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground mb-1">Market Cap</span>
            <span className="text-lg font-semibold text-foreground">
              {marketCap.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} τ
            </span>
            <span className="text-xs text-muted-foreground">
              ${taoPrice ? (marketCap * taoPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
            </span>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Alpha Price</span>
            <div className="text-right">
              <span className="text-lg font-semibold text-foreground">
                {alphaPrice.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} τ
              </span>
              <div className="text-xs text-muted-foreground">
                ${taoPrice ? (alphaPrice * taoPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 