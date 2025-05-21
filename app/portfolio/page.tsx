"use client";

import WalletConnectMessage from "@/components/common/WalletConnectMessage";
import BalancesInformation, {
  IBalances,
  IBalancesInfo,
} from "@/components/pages/Portfolio/BalancesInformation";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { useAccount } from "@/contexts/accounts";
import { useApi } from "@/contexts/api";
import { parseFixedU128 } from "@/utils";
import {
  Loader2,
  Wallet,
  Lock,
  TrendingUp,
  Coins,
  Briefcase,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useStakingData } from "@/hooks/useStakingData";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

// Cache for PnL calculations
const pnlCache = new Map();

export default function PortfolioPage() {
  const {
    state: { currentAccount, api },
  } = useApi();

  const {
    state: { balance: freeBalance },
  } = useAccount();

  const [balances, setBalances] = useState<IBalances>(() => ({
    totalUnstakedBalance: freeBalance,
    totalStakedBalance: 0,
    balanceStakedToAlpha: 0,
    balanceStakedToRoot: 0,
  }));
  const [isLoading, setIsLoading] = useState(false);
  const [balancesInfo, setBalancesInfo] = useState<IBalancesInfo[]>([]);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const unsubscribeFunctionsRef = useRef<(() => void)[]>([]);
  const balancesInfoRef = useRef<IBalancesInfo[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const [isCalculatingPnL, setIsCalculatingPnL] = useState(false);

  // Get staking data for calculating average buy prices
  const { stakingData, loading: stakingDataLoading } = useStakingData({
    coldkey: currentAccount?.address,
    sortDirection: "DESC",
    limit: 1000,
  });

  // Cleanup function for API subscriptions
  useEffect(() => {
    return () => {
      // Clean up all subscriptions when component unmounts
      unsubscribeFunctionsRef.current.forEach((unsubscribe) => {
        try {
          unsubscribe();
        } catch (error) {
          console.error("Error cleaning up subscription:", error);
        }
      });
      unsubscribeFunctionsRef.current = [];
    };
  }, []);

  // Memoize fetchAlphaBalances to prevent recreation on every render
  const fetchAlphaBalances = useCallback(
    async (walletAddress: string) => {
      if (!api) return;
      setIsLoading(true);
      try {
        let totalStakedBalance = 0;
        let balanceStakedToAlpha = 0;
        let balanceStakedToRoot = 0;
        const balancesInfo: IBalancesInfo[] = [];
        const newUnsubscribeFunctions: (() => void)[] = [];
        const promises: Promise<void>[] = [];

        // Get all hotkeys for the coldkey
        const hotkeysRaw =
          await api.query.subtensorModule.stakingHotkeys(walletAddress);
        const hotkeyAddresses = hotkeysRaw.map((key: any) => key.toString());

        // Process each hotkey
        for (const hotkey of hotkeyAddresses) {
          promises.push(
            (async () => {
              const res = await api.query.subtensorModule.alpha.entries(
                hotkey,
                walletAddress,
              );

              // Get unique subnets from alpha entries
              const subnetIds = new Set<number>();
              for (const [key] of res) {
                const netUid = Number(key.toHuman()[2]);
                subnetIds.add(netUid);
              }

              // Batch get subnet data
              const subnetDataMap = new Map<
                number,
                {
                  tao: string;
                  alpha: string;
                }
              >();

              const subnetPromises = [];
              for (const netUid of subnetIds) {
                subnetPromises.push(
                  Promise.all([
                    api.query.subtensorModule.subnetTAO(netUid),
                    api.query.subtensorModule.subnetAlphaIn(netUid),
                  ]).then(([tao, alpha]) => {
                    subnetDataMap.set(netUid, {
                      tao: tao.toString(),
                      alpha: alpha.toString(),
                    });
                  }),
                );
              }
              await Promise.all(subnetPromises);

              // Batch get hotkey data for relevant subnets
              const hotkeyDataPromises = [];
              const hotkeyDataMap = new Map<
                number,
                {
                  totalAlpha: any;
                  totalShares: number;
                }
              >();

              for (const netUid of subnetIds) {
                hotkeyDataPromises.push(
                  Promise.all([
                    api.query.subtensorModule.totalHotkeyAlpha(hotkey, netUid),
                    api.query.subtensorModule.totalHotkeyShares(hotkey, netUid),
                  ]).then(([alpha, shares]) => {
                    hotkeyDataMap.set(netUid, {
                      totalAlpha: alpha.toJSON(),
                      totalShares: parseFixedU128(shares.toJSON().bits),
                    });
                  }),
                );
              }
              await Promise.all(hotkeyDataPromises);

              // Process alpha entries
              for (const [key, value] of res) {
                const netUid = Number(key.toHuman()[2]);
                const alpha_share = parseFixedU128(value.toJSON().bits);
                const hotkeyData = hotkeyDataMap.get(netUid);
                const subnetData = subnetDataMap.get(netUid);

                if (!hotkeyData || !subnetData) continue;

                const alpha =
                  (alpha_share * hotkeyData.totalAlpha) /
                  hotkeyData.totalShares /
                  1000000000;
                const price =
                  netUid === 0
                    ? 1
                    : Number(subnetData.tao) / Number(subnetData.alpha);
                const tao = alpha * price;

                const rootBalance = netUid === 0 ? tao : 0;
                const alphaBalance = netUid !== 0 ? tao : 0;

                balanceStakedToRoot += rootBalance;
                balanceStakedToAlpha += alphaBalance;

                balancesInfo.push({
                  netUid,
                  hotkey,
                  alpha,
                  price,
                  tao,
                  avgBuyPrice: undefined,
                });

                totalStakedBalance += tao;
              }
            })(),
          );
        }

        await Promise.all(promises);

        // Update unsubscribe functions ref
        unsubscribeFunctionsRef.current = [
          ...unsubscribeFunctionsRef.current,
          ...newUnsubscribeFunctions,
        ];

        // Batch all state updates together
        setBalances((prev) => ({
          ...prev,
          totalStakedBalance,
          balanceStakedToAlpha,
          balanceStakedToRoot,
        }));
        setBalancesInfo(balancesInfo.sort((a, b) => a.netUid - b.netUid));
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [api],
  );

  // Initialize balances when account changes
  useEffect(() => {
    if (currentAccount) {
      setBalances({
        totalUnstakedBalance: 0,
        totalStakedBalance: 0,
        balanceStakedToAlpha: 0,
        balanceStakedToRoot: 0,
      });
      fetchAlphaBalances(currentAccount.address);
    }
  }, [currentAccount?.address, fetchAlphaBalances]);

  // Update free balance when it changes
  useEffect(() => {
    setBalances((prev) => ({
      ...prev,
      totalUnstakedBalance: freeBalance,
    }));
  }, [freeBalance]);

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../../public/workers/calculatePnL.worker.js", import.meta.url),
    );

    workerRef.current.onmessage = (e) => {
      const results = e.data;
      const updatedBalancesInfo = balancesInfoRef.current.map((balance) => {
        if (balance.netUid !== 0) {
          const subnetResult = results[balance.netUid];
          if (subnetResult) {
            return {
              ...balance,
              avgBuyPrice: subnetResult.avgBuyPrice,
              pnl: subnetResult.pnl,
            };
          }
        }
        return balance;
      });

      // Update cache
      const cacheKey = JSON.stringify(stakingData);
      pnlCache.set(cacheKey, results);

      // Update the ref first
      balancesInfoRef.current = updatedBalancesInfo;
      // Then update the state
      setBalancesInfo(updatedBalancesInfo);
      setIsCalculatingPnL(false);
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Update balancesInfo with PnL and average buy prices
  useEffect(() => {
    if (stakingData && !stakingDataLoading && !isCalculatingPnL) {
      const cacheKey = JSON.stringify(stakingData);
      const cachedResults = pnlCache.get(cacheKey);

      if (cachedResults) {
        // Use cached results
        const updatedBalancesInfo = balancesInfoRef.current.map((balance) => {
          if (balance.netUid !== 0) {
            const subnetResult = cachedResults[balance.netUid];
            if (subnetResult) {
              return {
                ...balance,
                avgBuyPrice: subnetResult.avgBuyPrice,
                pnl: subnetResult.pnl,
              };
            }
          }
          return balance;
        });

        // Update the ref first
        balancesInfoRef.current = updatedBalancesInfo;
        // Then update the state
        setBalancesInfo(updatedBalancesInfo);
      } else {
        // Calculate new results using Web Worker
        setIsCalculatingPnL(true);
        workerRef.current?.postMessage({
          stakingData,
          balancesInfo: balancesInfoRef.current,
        });
      }
    }
  }, [stakingData, stakingDataLoading]);

  // Update the ref when balancesInfo changes from other sources
  useEffect(() => {
    balancesInfoRef.current = balancesInfo;
  }, [balancesInfo]);

  // Calculate total earnings whenever balancesInfo changes
  useEffect(() => {
    if (balancesInfo.length > 0) {
      const total = balancesInfo.reduce((sum, balance) => {
        if (balance.pnl !== undefined) {
          return sum + balance.pnl;
        }
        return sum;
      }, 0);
      setTotalEarnings(total);
    }
  }, [balancesInfo]);

  if (!currentAccount) return <WalletConnectMessage />;

  if (isLoading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="flex flex-col items-center justify-center p-8 space-y-4 backdrop-blur-sm border border-border shadow-lg max-w-md w-full">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
            <div className="bg-gradient-to-br from-primary to-primary/70 p-4 rounded-xl shadow-md relative z-10">
              <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">
              Fetching Portfolio
            </h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we load your staking positions and balances...
            </p>
          </div>
        </Card>
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-primary/70 p-3 rounded-lg shadow-md">
            <Briefcase className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Portfolio Overview</h2>
            <p className="text-sm text-muted-foreground">
              View your staking positions and earnings across all subnets
            </p>
          </div>
        </div>
      </div>
      <BalancesInformation balancesInfo={balancesInfo} balances={balances} />
    </div>
  );
}
