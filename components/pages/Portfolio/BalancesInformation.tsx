import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSubnetAndValidators } from "@/contexts/subnetsAndValidators";
import { formatBalance, truncateAddress } from "@/utils";
import { TrendingUp, Coins, Lock, Wallet, ExternalLink, ArrowRightLeft, Pencil, FileText } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MoveStakeDialog } from "./MoveStakeDialog";
import { SimpleSwapDialog } from "./SimpleSwapDialog";

export interface IBalancesInfo {
  netUid: number;
  hotkey: string;
  tao: number;
  alpha: number;
  price: number;
  avgBuyPrice?: number;
  pnl?: number;
}

export interface IBalances {
  totalStakedBalance: number;
  totalUnstakedBalance: number;
  balanceStakedToRoot: number;
  balanceStakedToAlpha: number;
}

function BalancesTable({ balancesInfo }: { balancesInfo: IBalancesInfo[] }) {
  const { getSubnetById, getValidatorByHotkey } = useSubnetAndValidators();
  const [moveStakeDialogOpen, setMoveStakeDialogOpen] = useState(false);
  const [simpleSwapDialogOpen, setSimpleSwapDialogOpen] = useState(false);
  const [selectedStake, setSelectedStake] = useState<{
    subnet: number;
    hotkey: string;
  } | null>(null);

  if (!balancesInfo || !balancesInfo.length) return null;
  return (
    <>
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-lg shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Staking Details</h3>
              <p className="text-sm text-muted-foreground">
                Your active staking positions across subnets
              </p>
            </div>
          </div>
        </CardHeader>
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-accent/50">
                <TableHead className="font-semibold text-muted-foreground w-[15%]">
                  Subnet
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground w-[20%]">
                  Hotkey
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground w-[15%]">
                  Tao
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground w-[15%]">
                  Alpha
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground w-[12%]">
                  Price
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground w-[13%]">
                  Avg Buy Price
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground w-[10%]">
                  PnL
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground w-[10%]">
                  Details
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground w-[10%]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balancesInfo?.map(
                ({ netUid, hotkey, alpha, price, tao, avgBuyPrice, pnl }, index) => (
                  <TableRow
                    key={`${netUid}-${index}`}
                    className="hover:bg-accent/50"
                  >
                    <TableCell className="font-medium">
                      {getSubnetById(netUid)?.name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {getValidatorByHotkey(hotkey)?.name ||
                        truncateAddress(hotkey)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {tao.toFixed(4)} τ
                    </TableCell>
                    <TableCell>{alpha.toFixed(4)}</TableCell>
                    <TableCell>{price.toFixed(8)}</TableCell>
                    <TableCell>
                      {netUid === 0 ? (
                        <span className="text-muted-foreground">N/A</span>
                      ) : avgBuyPrice !== undefined ? (
                        avgBuyPrice.toFixed(8)
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-accent animate-pulse"></div>
                          <span className="text-muted-foreground">Calculating...</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {netUid === 0 ? (
                        <span className="text-muted-foreground">N/A</span>
                      ) : pnl !== undefined ? (
                        <span className={pnl >= 0 ? "text-green-500" : "text-red-500"}>
                          {pnl.toFixed(4)} τ
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-accent animate-pulse"></div>
                          <span className="text-muted-foreground">Calculating...</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={{
                          pathname: '/wallet/history',
                          query: {
                            subnets: netUid.toString(),
                            type: 'all',
                            timeRange: 'all'
                          }
                        }}
                        className="flex items-center justify-center gap-1.5 px-2.5 py-1 text-sm font-medium bg-accent/50 hover:bg-accent rounded-md transition-colors duration-200 min-w-[80px]"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Details
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedStake({ subnet: netUid, hotkey });
                            setMoveStakeDialogOpen(true);
                          }}
                          className="flex items-center justify-center gap-1.5 px-2.5 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200 min-w-[80px] dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          Move
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStake({ subnet: netUid, hotkey });
                            setSimpleSwapDialogOpen(true);
                          }}
                          className="flex items-center justify-center gap-1.5 px-2.5 py-1 text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors duration-200 min-w-[80px] dark:bg-purple-950 dark:hover:bg-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      <MoveStakeDialog
        open={moveStakeDialogOpen}
        onOpenChange={setMoveStakeDialogOpen}
        prePopulatedValues={selectedStake}
      />
      <SimpleSwapDialog
        open={simpleSwapDialogOpen}
        onOpenChange={setSimpleSwapDialogOpen}
      />
    </>
  );
}

export default function BalancesInformation({
  balances: {
    totalStakedBalance,
    totalUnstakedBalance,
    balanceStakedToRoot,
    balanceStakedToAlpha,
  },
  balancesInfo,
}: {
  balancesInfo: IBalancesInfo[];
  balances: IBalances;
}) {
  // Calculate total earnings
  const totalEarnings = useMemo(() => {
    return balancesInfo.reduce((sum, balance) => {
      if (balance.pnl !== undefined) {
        return sum + balance.pnl;
      }
      return sum;
    }, 0);
  }, [balancesInfo]);

  return (
    <>
      <div className="space-y-6">
        {/* All cards in a single grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Balance"
            value={totalStakedBalance + totalUnstakedBalance}
            icon={<Wallet className="w-6 h-6" />}
            gradient="from-indigo-500 to-violet-600"
          />
          <StatCard
            title="Total Staked"
            value={totalStakedBalance}
            icon={<Lock className="w-6 h-6" />}
            gradient="from-blue-500 to-cyan-600"
          />
          <StatCard
            title="Total Earnings"
            value={totalEarnings}
            icon={<TrendingUp className="w-6 h-6" />}
            gradient={totalEarnings >= 0 ? "from-green-500 to-emerald-600" : "from-red-500 to-rose-600"}
          />
          <StatCard
            title="Staked to Root"
            value={balanceStakedToRoot}
            icon={<TrendingUp className="w-6 h-6" />}
            gradient="from-purple-500 to-fuchsia-600"
          />
          <StatCard
            title="Tao Staked as Alpha"
            value={balanceStakedToAlpha}
            icon={<Coins className="w-6 h-6" />}
            gradient="from-amber-500 to-orange-600"
          />
          <StatCard
            title="Not Staked"
            value={totalUnstakedBalance}
            icon={<Wallet className="w-6 h-6" />}
            gradient="from-gray-500 to-slate-600"
          />
        </div>
      </div>
      <div className="mt-6">
        <BalancesTable balancesInfo={balancesInfo} />
      </div>
    </>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
}

function StatCard({
  title,
  value,
  icon,
  gradient,
}: StatCardProps) {
  return (
    <Card className="backdrop-blur-sm border border-border shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`bg-gradient-to-br ${gradient} p-2 rounded-lg shadow-md text-white dark:text-white`}
          >
            {icon}
          </div>
          <p
            className="text-sm font-medium text-muted-foreground"
          >
            {title}
          </p>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className="text-2xl font-bold"
          >
            {formatBalance(value)}
          </span>
          <span
            className="text-sm font-medium text-muted-foreground"
          >
            τ
          </span>
        </div>
      </div>
    </Card>
  );
}
