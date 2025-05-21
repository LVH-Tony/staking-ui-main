import { useState, useCallback, useEffect } from "react";
import type {
  StakingMetrics,
  StakingOperation,
  SubnetToken,
} from "@/types/staking";
import { useWallet } from "@/hooks/useWallet";
import { useSubnets } from "@/hooks/useSubnets";
import { useAlphaPrices } from "@/hooks/useAlphaPrices";
import { useTaoPrice } from "@/hooks/useTaoPrice";
import { useSubnetAndValidators } from "@/contexts/subnetsAndValidators";

const MOCK_INITIAL_METRICS: StakingMetrics = {
  totalTaoBalance: 0,
  stakedTao: 0,
  freeTao: 0,
  totalUsdValue: 0,
  rootHoldings: 0,
  totalGlobalStakes: 0,
  sn0EmissionsTotal: 0,
  subnetTokens: [],
  performanceFee: 0,
  activeValidators: 0,
  totalStaked: 0,
};

export function useStaking() {
  const { connected } = useWallet();
  const [metrics, setMetrics] = useState<StakingMetrics>(MOCK_INITIAL_METRICS);
  const [operations, setOperations] = useState<StakingOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const { subnets, loading: subnetsLoading } = useSubnets();
  const { latestPrices, isLoading: alphaPricesLoading } = useAlphaPrices();
  const { price: taoPrice } = useTaoPrice();
  const { validators, loading: validatorsLoading } = useSubnetAndValidators();

  // Update metrics when subnets data changes
  useEffect(() => {
    if (!subnets || subnetsLoading) return;

    const rootSubnet = subnets.find((s) => s.net_uid === 0);
    const nonRootSubnets = subnets.filter((s) => s.net_uid !== 0);

    // Calculate total network emission (excluding root)
    const totalNetworkEmission = nonRootSubnets.reduce(
      (sum, s) => sum + s.emission,
      0
    );

    // Convert subnet data to SubnetToken format
    const subnetTokens: SubnetToken[] = nonRootSubnets.map((subnet) => {
      const alphaPrice = latestPrices[subnet.net_uid] || 0;
      const totalAlpha = subnet.alpha_staked + subnet.alpha_in_pool;
      const usdValue = subnet.tao_in_pool * (taoPrice || 0);

      return {
        netuid: subnet.net_uid,
        symbol: `${subnet.net_uid}`,
        balance: subnet.tao_in_pool,
        subnetTokenBalance: subnet.alpha_in_pool,
        usdValue,
        totalSupply: subnet.alpha_in_pool,
        taoRatio: subnet.tao_in_pool / totalAlpha,
        sn0Emissions: subnet.emission,
        apy: subnet.emission / totalAlpha,
        alpha_staked: subnet.alpha_staked,
      };
    });

    // Sort subnet tokens by emission
    subnetTokens.sort((a, b) => (b.sn0Emissions || 0) - (a.sn0Emissions || 0));

    // Calculate total staked amount (TAO in pools + Root TAO)
    const totalTaoInPools = nonRootSubnets.reduce(
      (sum, subnet) => sum + subnet.tao_in_pool,
      0
    );
    const rootTao = rootSubnet?.tao_in_pool || 0;
    const totalStaked = totalTaoInPools + rootTao;

    setMetrics((prev) => ({
      ...prev,
      rootHoldings: rootSubnet?.tao_in_pool || 0,
      sn0EmissionsTotal: totalNetworkEmission,
      subnetTokens,
      totalTaoBalance: subnets.reduce((sum, s) => sum + s.tao_in_pool, 0),
      activeValidators: validators?.length || 0,
      totalStaked,
    }));
  }, [subnets, subnetsLoading, latestPrices, taoPrice, validators]);

  return {
    metrics,
    operations,
    loading:
      loading || subnetsLoading || alphaPricesLoading || validatorsLoading,
  };
}
