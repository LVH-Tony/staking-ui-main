import { SubnetToken } from "@/types/staking";

export function calculateStakeMetrics(
  token: SubnetToken,
  rootHoldings: number,
  totalGlobalStakes: number,
) {
  return {
    // Calculate percentage of total stakes
    stakePercentage: (token.balance / totalGlobalStakes) * 100,
    // Calculate effective stake considering root holdings
    effectiveStake:
      token.balance + (rootHoldings * token.balance) / totalGlobalStakes,
    // Calculate estimated daily rewards based on APY
    estimatedDailyRewards: (token.balance * token.apy) / 365,
  };
}
