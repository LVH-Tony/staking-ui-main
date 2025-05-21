"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { truncateAddress } from "@/utils";

import SearchAndAddSubnet from "@/components/pages/Stake/SearchAndAddSubnet";
import { Alert, AlertTitle } from "@/components/ui/alert";

import { useApi } from "@/contexts/api";
import { StakingDest } from "@/types";
import {
  ActionButtons,
  StakingDests,
} from "@/components/pages/Stake/StakingDests";
import StakingSummary from "@/components/pages/Stake/StakingSummary";
import MoveStake from "@/components/pages/Stake/MoveStake";
import WalletConnectMessage from "@/components/common/WalletConnectMessage";
import {
  Loader2,
  Coins,
  ArrowRightLeft,
  Plus,
  ArrowUpDown,
} from "lucide-react";
import { useSubnetAndValidators } from "@/contexts/subnetsAndValidators";
import { Button } from "@/components/ui/button";
import SimpleSwap from "@/components/pages/Stake/SimpleSwap";

type View = "stake" | "move" | "swap";

// SearchParamsHandler component to handle URL parameters
function SearchParamsHandler({
  setPrePopulatedValues,
  setView,
}: {
  setPrePopulatedValues: (
    values: { subnet: number; hotkey: string } | null,
  ) => void;
  setView: (view: View) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const subnet = searchParams.get("subnet");
    const hotkey = searchParams.get("hotkey");
    const action = searchParams.get("action");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if (action === "edit" && subnet && hotkey) {
      const subnetId = parseInt(subnet);
      setPrePopulatedValues({
        subnet: subnetId,
        hotkey: hotkey,
      });
      setView("move");
    } else if (fromParam && toParam) {
      // If 'from' and 'to' params are present, switch to swap view
      // SimpleSwap component will handle the actual values of fromParam and toParam
      setView("swap");
    }
    // Note: The `netUid` param used in MainVolumeChart's link (`to=Subnet ${selectedSubnet}&netUid=${selectedSubnet}`)
    // is primarily for SimpleSwap to correctly identify the subnet if needed, but `to=Subnet ${selectedSubnet}` is the key for selection.

  }, [searchParams, setPrePopulatedValues, setView]);

  return null;
}

export default function StakePage() {
  const {
    state: { currentAccount },
  } = useApi();

  const [stakingDests, setStakingDests] = useState<StakingDest[]>([]);
  const { subnets, validators, loading } = useSubnetAndValidators();
  const [delegatedAmount, setDelegatedAmount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [view, setView] = useState<View>("stake");
  const [prePopulatedValues, setPrePopulatedValues] = useState<{
    subnet: number;
    hotkey: string;
  } | null>(null);

  if (!currentAccount) return <WalletConnectMessage />;

  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-lg max-w-md w-full">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"></div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-xl shadow-md relative z-10">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              Loading Stake Data
            </h3>
            <p className="text-sm text-muted-foreground">
              Fetching subnets and validators information...
            </p>
          </div>
        </div>
      </div>
    );

  const showActionButtons = stakingDests.length > 0;

  const handleStakingPercentageChange = (
    index: number,
    newPercentage: number,
  ) => {
    if (index < 0 || index >= stakingDests.length) return;

    const otherStakingTotalPercentage = stakingDests.reduce(
      (sum, dest, i) => sum + (i === index ? 0 : dest.percentage),
      0,
    );

    const maxAvailablePercentage = 100 - otherStakingTotalPercentage;

    // Use the smaller of new percentage or max available, rounded to 1 decimal
    const finalPercentage = Number(
      Math.min(newPercentage, maxAvailablePercentage).toFixed(1),
    );

    const oldPercentage = stakingDests[index].percentage;

    if (oldPercentage === finalPercentage) return;
    setStakingDests((prev) =>
      prev.map((dest, i) =>
        i === index ? { ...dest, percentage: finalPercentage } : dest,
      ),
    );
  };
  const handleDeleteStakingDest = (index: number) => {
    setStakingDests((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    setShowSummary(true);
  };

  const handleReset = () => {
    setStakingDests([]);
  };

  const disableNextButton =
    stakingDests?.reduce((acc, dest) => acc + dest.percentage, 0) !== 100;

  return (
    <div className="space-y-8">
      <Suspense fallback={null}>
        <SearchParamsHandler
          setPrePopulatedValues={setPrePopulatedValues}
          setView={setView}
        />
      </Suspense>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-md">
            <Coins className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Stake</h1>
            <p className="text-sm text-muted-foreground">
              Delegate your TAO tokens to validators across subnets
            </p>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center justify-between border-b border-border">
        <nav className="-mb-px flex space-x-4">
          <button
            onClick={() => setView("stake")}
            className={`${
              view === "stake"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Stake
          </button>
          <button
            onClick={() => setView("move")}
            className={`${
              view === "move"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Move Stake
          </button>
          <button
            onClick={() => setView("swap")}
            className={`${
              view === "swap"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            Simple Swap
          </button>
        </nav>
      </div>

      {/* Content Section */}
      <div className="space-y-6">
        {view === "stake" ? (
          <>
            <SearchAndAddSubnet
              stakingDests={stakingDests}
              setStakingDests={setStakingDests}
              subnets={subnets}
              validators={validators}
              delegatedAmount={delegatedAmount}
              setDelegatedAmount={setDelegatedAmount}
            />

            {stakingDests.length > 0 && (
              <div className="space-y-6">
                <StakingDests
                  dests={stakingDests}
                  subnets={subnets}
                  onDelete={handleDeleteStakingDest}
                  onPercentageChange={handleStakingPercentageChange}
                />
                <ActionButtons
                  show={showActionButtons}
                  onNext={handleNext}
                  disableNextButton={disableNextButton}
                  onReset={handleReset}
                />
              </div>
            )}
          </>
        ) : view === "move" ? (
          <MoveStake prePopulatedValues={prePopulatedValues} />
        ) : (
          <SimpleSwap />
        )}
      </div>

      {showSummary && (
        <StakingSummary
          open={showSummary}
          setOpen={setShowSummary}
          stakingDests={stakingDests}
          delegatedAmount={delegatedAmount}
        />
      )}
    </div>
  );
}
