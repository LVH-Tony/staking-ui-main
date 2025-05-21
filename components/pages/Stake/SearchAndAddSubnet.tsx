"use client";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

import {
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Wallet,
  ArrowRight,
} from "lucide-react";
import SubnetTable, { BalanceInfo } from "./SubnetTable";
import { useAccount } from "@/contexts/accounts";
import { StakingDest, Subnet, ValidatorInfo } from "@/types";
import PercentageSlider from "@/components/common/PercentageSlider";

function DelegationInfo({
  setDelegatedAmount,
  delegatedAmount,
}: {
  delegatedAmount: number;
  setDelegatedAmount: (balance: number) => void;
}) {
  const {
    state: { balance },
  } = useAccount();

  const [percentageToDelegate, setPercentageToDelegate] = useState(0);

  const onPercentageToDelegateChange = (newPercentage: number) => {
    setPercentageToDelegate(newPercentage);
    const delegatedBalance = balance * (newPercentage / 100);
    setDelegatedAmount(delegatedBalance);
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/80 backdrop-blur-sm border border-border shadow-lg rounded-xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-md">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                My TAO Balance
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">
                {balance.toFixed(2)}
              </span>
              <span className="text-sm font-medium text-muted-foreground">τ</span>
            </div>
          </div>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border border-border shadow-lg rounded-xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-lg shadow-md">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Available to Delegate
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">
                {delegatedAmount.toFixed(2)}
              </span>
              <span className="text-sm font-medium text-muted-foreground">τ</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-card/80 backdrop-blur-sm border border-border shadow-lg rounded-xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground">
              Amount to Delegate
            </p>
            <span className="text-sm font-semibold text-foreground">
              {percentageToDelegate}%
            </span>
          </div>
          <PercentageSlider
            value={percentageToDelegate}
            onValueChange={onPercentageToDelegateChange}
          />
        </div>
      </Card>
    </div>
  );
}

interface IProps {
  stakingDests: StakingDest[];
  setStakingDests: (subnets: StakingDest[]) => void;
  subnets: Subnet[];
  validators: ValidatorInfo[];
  delegatedAmount: number;
  setDelegatedAmount: (balance: number) => void;
}

export default function SearchAndAddSubnet({
  stakingDests,
  setStakingDests,
  subnets,
  validators,
  delegatedAmount,
  setDelegatedAmount,
}: IProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-card/80 backdrop-blur-sm border border-border shadow-lg rounded-xl overflow-hidden">
        <CardContent className="p-6">
          {/* Selected Subnets Tags */}
          {stakingDests.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-3">
                Selected Subnets
              </h3>
              <div className="flex gap-2 flex-wrap">
                {stakingDests.map(({ net_uid, hotkey, validatorName }, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-sm"
                  >
                    {`${subnets[net_uid].custom_display_name || subnets[net_uid].name} // ${validatorName}`}
                    <button
                      className="ml-2 text-white/80 hover:text-white focus:outline-none transition-colors"
                      onClick={() =>
                        setStakingDests(
                          stakingDests.filter((_, i) => i !== idx),
                        )
                      }
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subnet Table */}
          <SubnetTable
            stakingDests={stakingDests}
            setStakingDests={setStakingDests}
            subnets={subnets}
            validators={validators}
          />

          {/* Delegation Info */}
          <DelegationInfo
            setDelegatedAmount={setDelegatedAmount}
            delegatedAmount={delegatedAmount}
          />
        </CardContent>
      </Card>
    </div>
  );
}
