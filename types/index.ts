export type FixedU128 = {
  bits: `0x${string}`;
};
export interface ValidatorInfo {
  hotkey: string;
  name: string;
  url: string;
  description: string;
  signature: string;
  netuids: number[];
}

export interface SubnetBase {
  net_uid: number;
  name: string;
  updated_at: string;
  network_registered_at: string;
  tempo: number;
}

export interface SubnetData extends SubnetBase {
  alpha_staked: number;
  tao_in_pool: number;
  emission: number;
  alpha_in_pool: number;
}

export interface SubnetRawData {
  net_uid: number;
  name: string;
  updated_at?: string;
  network_registered_at?: number;
  tempo?: number;
  alpha_staked: string;
  tao_in_pool: string;
  emission: string;
  alpha_in_pool: string;
  tao_volume?: string;
  symbol?: string;
}

export interface SubnetIdentity {
  net_uid: number;
  updated_at: string;
  subnet_name: string;
  github_repo: string;
  subnet_contact: string;
  subnet_url: string;
  discord: string;
  description: string;
  additional: string;
}

export interface Subnet extends SubnetData {
  bittensor_id: string;
  owner: string;
  github: string;
  hw_requirements: string;
  image_url: string;
  description: string;
  symbol?: string;
  tao_volume?: number;
  discord?: string;
  discord_username?: string;
  additional?: string;
  custom_display_name?: string;
}

export interface StakingDest {
  net_uid: number;
  hotkey: string;
  validatorName: string;
  percentage: number;
}

export type TxStatus = {
  visible?: boolean;
  type?: "success" | "error" | "info" | "warning";
  message?: string;
  meta?: {
    action: string;
    amount: number;
    validator: ValidatorInfo;
  };
};

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

export interface StakingStatsTemporalRecord {
  netUid: number;
  tsStart: string;
  tsEnd: string;
  buyVolumeTao: string;
  buyVolumeAlpha: string;
  sellVolumeTao: string;
  sellVolumeAlpha: string;
  totalVolumeTao: string;
  totalVolumeAlpha: string;
  buys: number;
  sells: number;
  transactions: number;
  buyers: number;
  sellers: number;
  traders: number;
}

export interface StakingStatsBlocksRecord {
  netUid: number;
  blockStart: number;
  blockEnd: number;
  buyVolumeTao: string;
  buyVolumeAlpha: string;
  sellVolumeTao: string;
  sellVolumeAlpha: string;
  totalVolumeTao: string;
  totalVolumeAlpha: string;
  buys: number;
  sells: number;
  transactions: number;
  buyers: number;
  sellers: number;
  traders: number;
}

export type StakingStatsRecord =
  | StakingStatsTemporalRecord
  | StakingStatsBlocksRecord;

export interface AlphaPriceData {
  net_uid: number;
  price_in_tao: number;
  timestamp: string;
}

export interface TaoPriceData {
  current: number;
  timestamp: string;
  change: {
    "1D": number;
    "1W": number;
    "1M": number;
    ALL: number;
  };
}
