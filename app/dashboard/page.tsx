"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  BarChart3,
  Network,
  DollarSign,
  Coins,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";
import { useStaking } from "@/hooks/useStaking";
import { useApi } from "@/contexts/api";
import { useAccount } from "@/contexts/accounts";
import WalletConnectMessage from "@/components/common/WalletConnectMessage";
import { SubnetCard } from "@/components/pages/Dashboard/cards/SubnetCard";
import { ApyCard } from "@/components/pages/Dashboard/cards/ApyCard";
import { useTaoPrice } from "@/hooks/useTaoPrice";
import { TopSubnetCard } from "@/components/pages/Dashboard/cards/TopSubnetCard";
import { useSubnetAndValidators } from "@/contexts/subnetsAndValidators";
import { formatBalance, parseFixedU128 } from "@/utils";
import Link from "next/link";

// Define a type for subnet alpha balance
interface SubnetAlphaBalance {
  netUid: number;
  name: string;
  symbol: string;
  alpha: number;
  taoValue: number;
}

export default function Dashboard() {
  const { metrics, loading } = useStaking();
  const {
    state: { currentAccount, api, apiState },
  } = useApi();
  const {
    state: { balance: freeBalance },
  } = useAccount();
  const { getSubnetById } = useSubnetAndValidators();

  const { price: taoPrice } = useTaoPrice();

  // State for user balances
  const [userBalances, setUserBalances] = useState({
    totalTaoBalance: 0,
    stakedToRoot: 0,
    totalAlphaBalance: 0,
    totalAlphaTaoValue: 0,
    alphaPercentage: 0,
  });
  // Add state for top subnet alpha balances
  const [topSubnetAlphaBalances, setTopSubnetAlphaBalances] = useState<
    SubnetAlphaBalance[]
  >([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentAccount?.address || !api || apiState !== "READY") {
      setUserBalances({
        totalTaoBalance: 0,
        stakedToRoot: 0,
        totalAlphaBalance: 0,
        totalAlphaTaoValue: 0,
        alphaPercentage: 0,
      });
      setTopSubnetAlphaBalances([]);
      return;
    }

    const fetchBalances = async () => {
      setIsLoadingBalances(true);
      setBalanceError(null);
      try {
        const hotkeysRaw = await api.query.subtensorModule.stakingHotkeys(
          currentAccount.address,
        );

        const hotkeys = hotkeysRaw.map((key: any) => key.toString());
        let totalStakedBalance = 0;
        let balanceStakedToRoot = 0;
        let totalAlphaBalance = 0;
        let totalAlphaTaoValue = 0;

        // Track alpha balances by subnet
        const subnetAlphaBalances: Record<number, SubnetAlphaBalance> = {};

        for await (const hotkey of hotkeys) {
          const res = await api.query.subtensorModule.alpha.entries(
            hotkey,
            currentAccount.address,
          );

          for await (const [key, value] of res) {
            const netUid = Number(key.toHuman()[2]);
            const alpha_share = parseFixedU128(value.toJSON().bits);
            const total_hotkey_alpha = (
              await api.query.subtensorModule.totalHotkeyAlpha(hotkey, netUid)
            ).toJSON();
            const total_hotkey_shares_raw = (
              await api.query.subtensorModule.totalHotkeyShares(hotkey, netUid)
            ).toJSON();
            const total_hotkey_shares = parseFixedU128(
              total_hotkey_shares_raw.bits,
            );
            const alpha =
              (alpha_share * total_hotkey_alpha) /
              total_hotkey_shares /
              1000000000;
            const tao_in = (
              await api.query.subtensorModule.subnetTAO(netUid)
            ).toString();
            const alpha_in = (
              await api.query.subtensorModule.subnetAlphaIn(netUid)
            ).toString();
            const price = netUid === 0 ? 1 : Number(tao_in) / Number(alpha_in);
            const tao = alpha * price;

            if (netUid === 0) {
              balanceStakedToRoot += tao;
            } else {
              totalAlphaBalance += alpha;
              totalAlphaTaoValue += tao;

              // Track subnet alpha balances
              if (!subnetAlphaBalances[netUid]) {
                // Get subnet info if available
                const subnet = getSubnetById(netUid);
                const subnetName = subnet?.name || `Subnet ${netUid}`;
                const subnetSymbol = subnet?.symbol || "";
                subnetAlphaBalances[netUid] = {
                  netUid,
                  name: subnetName,
                  symbol: subnetSymbol,
                  alpha: 0,
                  taoValue: 0,
                };
              }

              subnetAlphaBalances[netUid].alpha += alpha;
              subnetAlphaBalances[netUid].taoValue += tao;
            }

            totalStakedBalance += tao;
          }
        }

        const totalTaoBalance = totalStakedBalance + freeBalance;
        const alphaPercentage =
          totalTaoBalance > 0
            ? (totalAlphaTaoValue / totalTaoBalance) * 100
            : 0;

        setUserBalances({
          totalTaoBalance,
          stakedToRoot: balanceStakedToRoot,
          totalAlphaBalance,
          totalAlphaTaoValue,
          alphaPercentage,
        });

        // Set top 5 subnet alpha balances (excluding Subnet 0)
        const top5SubnetAlphaBalances = Object.values(subnetAlphaBalances)
          .filter((balance) => balance.netUid !== 0)
          .sort((a, b) => b.alpha - a.alpha)
          .slice(0, 5);

        setTopSubnetAlphaBalances(top5SubnetAlphaBalances);
      } catch (error) {
        console.error("Error fetching balances:", error);
        setBalanceError("Failed to load balance data");
      } finally {
        setIsLoadingBalances(false);
      }
    };

    fetchBalances();
  }, [currentAccount?.address, api, apiState, freeBalance, getSubnetById]);

  // Mock data for platform metrics
  const platformData = {
    pnl: 0,
    pnlPercentage: 0,
  };

  const currentPlatformPnL = platformData;
  const isPlatformPnLPositive = currentPlatformPnL.pnl >= 0;

  if (!currentAccount) return <WalletConnectMessage />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow-md">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Dashboard Overview
            </h1>
            <p className="text-sm text-muted-foreground">Your main overview</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Platform PNL</h2>
                <p className="text-sm text-muted-foreground">Global performance</p>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <p
                className={`text-2xl font-bold ${
                  isPlatformPnLPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {currentPlatformPnL.pnl !== 0 ? (
                  <>
                    {isPlatformPnLPositive ? "+" : "-"}$
                    {Math.abs(currentPlatformPnL.pnl).toLocaleString()}
                  </>
                ) : (
                  "-"
                )}
              </p>
              <p
                className={`text-sm ${
                  isPlatformPnLPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {currentPlatformPnL.pnl !== 0 ? (
                  <>
                    ({isPlatformPnLPositive ? "+" : "-"}
                    {Math.abs(currentPlatformPnL.pnlPercentage)}%)
                  </>
                ) : (
                  ""
                )}
              </p>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              Total TAO Managed: {formatBalance(5316.197)} τ
              <span className="ml-1 text-muted-foreground/70">
                (${((5316.197 * (taoPrice || 0))).toLocaleString(undefined, {maximumFractionDigits: 0})})
              </span>
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">TAO Price</h2>
                <p className="text-sm text-muted-foreground">Current market price</p>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-foreground">${taoPrice?.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div>
          <ApyCard apy={0} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Your TAO Balance</h2>
                <p className="text-sm text-muted-foreground">Total holdings</p>
              </div>
            </div>
          </div>
          <div className="mt-2">
            {isLoadingBalances ? (
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
              </div>
            ) : balanceError ? (
              <div className="text-red-500 text-sm">{balanceError}</div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-foreground">
                    {formatBalance(userBalances.totalTaoBalance)} τ
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ($
                    {(
                      userBalances.totalTaoBalance * (taoPrice || 0)
                    ).toLocaleString()}
                    )
                  </p>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>
                    Staked to Root: {formatBalance(userBalances.stakedToRoot)} τ
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Coins className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Your Alpha Balance</h2>
                <p className="text-sm text-muted-foreground">Total alpha holdings</p>
              </div>
            </div>
          </div>
          <div className="mt-2">
            {isLoadingBalances ? (
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
              </div>
            ) : balanceError ? (
              <div className="text-red-500 text-sm">{balanceError}</div>
            ) : (
              <div className="flex flex-col">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-foreground">
                      {formatBalance(userBalances.totalAlphaBalance)} α
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ($
                      {(
                        userBalances.totalAlphaTaoValue * (taoPrice || 0)
                      ).toLocaleString()}
                      )
                    </p>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>
                      TAO Value:{" "}
                      {formatBalance(userBalances.totalAlphaTaoValue)} τ
                    </p>
                    <p>
                      Percentage of TAO Balance:{" "}
                      {userBalances.alphaPercentage.toFixed(2)}%
                    </p>
                  </div>
                </div>

                {topSubnetAlphaBalances.length > 0 && (
                  <Link
                    href="/portfolio"
                    className="text-xs font-medium bg-primary/10 hover:bg-primary/20 rounded-lg px-3 py-2 mt-4 w-full flex flex-col transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-primary">TOP 5 HOLDINGS</p>
                      <ChevronRight className="w-3 h-3 text-primary group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="space-y-0.5 w-full">
                      {topSubnetAlphaBalances.map((balance) => (
                        <div key={balance.netUid} className="flex items-center justify-between w-full gap-x-3">
                          <span className="text-foreground whitespace-nowrap shrink-0">SN{balance.netUid}</span>
                          <span className="text-primary text-xs leading-tight truncate min-w-0 text-right flex-1">
                            {formatBalance(balance.alpha)} α
                          </span>
                        </div>
                      ))}
                    </div>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Network className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Network Stats</h2>
                <p className="text-sm text-muted-foreground">Global metrics</p>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Total Subnets: {metrics.subnetTokens.length}</p>
              <p>Active Validators: {metrics.activeValidators}</p>
              <p>Total Staked: {formatBalance(metrics.totalStaked)} τ</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Top Subnets by Emission</h2>
            <div className="text-sm text-muted-foreground">
              Showing top {Math.min(metrics.subnetTokens.length, 6)} of{" "}
              {metrics.subnetTokens.length} subnets
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...metrics.subnetTokens]
              .sort((a, b) => (b.sn0Emissions || 0) - (a.sn0Emissions || 0))
              .slice(0, 6)
              .map((token, index) => (
                <TopSubnetCard
                  key={token.netuid}
                  token={token}
                  rank={index + 1}
                  index={index}
                  taoPrice={taoPrice || undefined}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
