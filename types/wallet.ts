export interface Transaction {
  id: string;
  type: "buy" | "sell";
  amount: number;
  timestamp: Date;
  status: "pending" | "completed" | "failed";
  metadata: {
    subnet: string;
    netuid: number;
    pricePerToken: number;
    totalValue: number;
    taoRatio: number;
    tokensReceived?: number;
    tokensSold?: number;
    fee: number;
    profit?: number;
    profitPercentage?: number;
  };
}
