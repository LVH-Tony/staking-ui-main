export interface SubnetToken {
  netuid: number;
  symbol: string;
  balance: number;
  subnetTokenBalance: number;
  usdValue: number;
  totalSupply: number;
  taoRatio: number;
  sn0Emissions: number;
  apy: number;
  alphaBalance?: number;
  alpha_staked: number;
  stakeMetrics?: {
    [key: string]: number;
  };
}

export interface StakingMetrics {
  totalTaoBalance: number;
  stakedTao: number;
  freeTao: number;
  totalUsdValue: number;
  subnetTokens: SubnetToken[];
  performanceFee: number;
  rootHoldings: number;
  sn0EmissionsTotal: number;
  totalGlobalStakes?: number;
  activeValidators: number;
  totalStaked: number;
}

export interface StakingOperation {
  type: "stake" | "unstake";
  subnetId: number;
  amount: number;
  timestamp: Date;
  status: "pending" | "completed" | "failed";
  txHash?: string;
}

export interface StakingTransaction {
  id: string;
  height: number;
  timestamp: string;
  extrinsic_id: number;
  coldkey: string;
  hotkey: string;
  net_uid: number;
  tao: string;
  alpha: string;
  action: "STAKING" | "UNSTAKING";
}

export interface StakingResponse {
  data: StakingTransaction[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const STATS_TIMEFRAMES = {
  "1min": "1min",
  "5min": "5min",
  daily: "daily",
  weekly: "weekly",
  monthly: "monthly",
  blocks: "blocks",
} as const;

export type StatsTimeframe =
  (typeof STATS_TIMEFRAMES)[keyof typeof STATS_TIMEFRAMES];
