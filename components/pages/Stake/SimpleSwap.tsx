import { useState, useEffect, useMemo } from "react";
import { useSubnetAndValidators } from "@/contexts/subnetsAndValidators";
import { useApi } from "@/contexts/api";
import { useAccount } from "@/contexts/accounts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUpDown, CheckCircle } from "lucide-react";
import { useStaking } from "@/hooks/useStaking";
import { useSubnets as useSubnetsData } from "@/hooks/useSubnets";
import { SubnetToken } from "@/types/staking";
import { Subnet } from "@/types";
import { useAlphaPrices } from "@/hooks/useAlphaPrices";
import { toast } from "sonner";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import { UNIT } from "@/constants/shared";
import { ValidatorInfo } from "@/types";
import { TokenGridSelector, TokenInfo } from "@/components/TokenGridSelector";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { parseFixedU128 } from "@/utils";
import { useStakingData } from "@/hooks/useStakingData";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRouter, useSearchParams } from 'next/navigation';

// Interface for detailed balance information
interface IBalancesInfo {
  netUid: number;
  hotkey: string;
  tao: number;
  alpha: number;
  price: number;
}

export default function SimpleSwap() {
  const { validators } = useSubnetAndValidators();
  const { subnets, loading: subnetsLoading } = useSubnetsData();
  const { state: { api, currentAccount, currentSigner } } = useApi();
  const { state: { balance: freeBalance } } = useAccount();
  const { metrics, loading: stakingLoading } = useStaking();
  const { latestPrices, isLoading: pricesLoading } = useAlphaPrices();
  const { getStakingsByColdkey, loading: stakingDataLoading } = useStakingData({
      coldkey: currentAccount?.address,
      limit: 500,
  });

  const router = useRouter();
  const searchParams = useSearchParams();

  const [fromToken, setFromToken] = useState<string>("");
  const [toToken, setToToken] = useState<string>("");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [fromHotkey, setFromHotkey] = useState<string | null>(null);
  const [toHotkey, setToHotkey] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [txStatus, setTxStatus] = useState({
    visible: false,
    type: "info" as "info" | "error" | "success",
    message: "",
  });
  const [fromSpecificAlphaBalance, setFromSpecificAlphaBalance] = useState<number | null>(null);
  const [isFromBalanceLoading, setIsFromBalanceLoading] = useState(false);
  const [balancesInfo, setBalancesInfo] = useState<IBalancesInfo[]>([]);
  const [isLoadingBalancesInfo, setIsLoadingBalancesInfo] = useState(false);
  const [isFromManualInput, setIsFromManualInput] = useState(false);
  const [isToManualInput, setIsToManualInput] = useState(false);

  const isLoading = subnetsLoading || stakingLoading || pricesLoading || stakingDataLoading || isLoadingBalancesInfo;

  useEffect(() => {
    const fromQuery = searchParams.get('from');
    const toQuery = searchParams.get('to');

    if (fromQuery) {
      setFromToken(fromQuery);
    }
    if (toQuery) {
      setToToken(toQuery);
    }
  }, [searchParams, router]);

  const currentStakes = useMemo(() => {
      return getStakingsByColdkey(currentAccount?.address || "");
  }, [getStakingsByColdkey, currentAccount?.address]);

  const allTokens: TokenInfo[] = [
    { id: "TAO", name: "TAO" },
    ...subnets
      .filter(subnet => subnet.net_uid !== 0)
      .sort((a, b) => a.net_uid - b.net_uid)
      .map(subnet => ({
        id: `Subnet ${subnet.net_uid}`,
        name: `${subnet.net_uid}`,
        net_uid: subnet.net_uid,
      })),
  ];

  const getSubnetIdFromToken = (tokenId: string): number | null => {
    if (tokenId.startsWith("Subnet")) {
      try {
        return parseInt(tokenId.split(" ")[1]);
      } catch (e) {
        console.error("Error parsing subnet ID from token:", tokenId, e);
        return null;
      }
    }
    return null;
  };

  const fromTokens = allTokens;

  const getTokenSymbol = (tokenId: string): string => {
    if (tokenId === "TAO") return "τ";
    
    const subnetId = getSubnetIdFromToken(tokenId);
    if (subnetId === null) return "";
    
    const subnet = subnets.find(s => s.net_uid === subnetId);
    return subnet?.symbol || `α${subnetId}`;
  };

  const getTokenName = (tokenId: string): string => {
    if (tokenId === "TAO") return "TAO";
    
    const subnetId = getSubnetIdFromToken(tokenId);
    if (subnetId === null) return "";
    
    const subnet = subnets.find(s => s.net_uid === subnetId);
    return subnet?.name || `Subnet ${subnetId}`;
  };

  const toTokens = useMemo(() => {
    if (!fromToken) return [];

    const fromSubnetId = getSubnetIdFromToken(fromToken);
    
    if (fromToken === "TAO") {
      return allTokens.filter(token => token.id !== "TAO");
    } else if (fromSubnetId !== null) {
      return [
        { id: "TAO", name: "TAO" },
        ...allTokens.filter(token => {
          const tokenSubnetId = getSubnetIdFromToken(token.id);
          return token.id !== "TAO" && tokenSubnetId !== fromSubnetId;
        })
      ];
    }
    
    return [];
  }, [fromToken, allTokens]);

  const isAlphaToAlphaMove = useMemo(() => {
    if (!fromToken || !toToken) return false;
    
    const fromSubnetId = getSubnetIdFromToken(fromToken);
    const toSubnetId = getSubnetIdFromToken(toToken);
    
    return fromSubnetId !== null && toSubnetId !== null;
  }, [fromToken, toToken]);

  const isCrossSubnetMove = useMemo(() => {
    if (!fromToken || !toToken) return false;
    
    const fromSubnetId = getSubnetIdFromToken(fromToken);
    const toSubnetId = getSubnetIdFromToken(toToken);
    
    return fromSubnetId !== null && toSubnetId !== null && fromSubnetId !== toSubnetId;
  }, [fromToken, toToken]);

  const showMoveStakeHelperMessage = useMemo(() => {
    const fromSubnetId = getSubnetIdFromToken(fromToken);
    return fromSubnetId !== null;
  }, [fromToken]);

  const calculateAlphaBalance = async (hotkey: string, netUid: number): Promise<number | null> => {
    if (!api || !currentAccount) return null;

    setIsFromBalanceLoading(true);
    try {
      const [alphaShare, totalHotkeyAlpha, totalHotkeyShares] = await Promise.all([
        api.query.subtensorModule.alpha(hotkey, currentAccount.address, netUid),
        api.query.subtensorModule.totalHotkeyAlpha(hotkey, netUid),
        api.query.subtensorModule.totalHotkeyShares(hotkey, netUid)
      ]);

      const alphaShareJson = alphaShare.toJSON();
      const totalHotkeySharesJson = totalHotkeyShares.toJSON();
      const totalAlphaJson = totalHotkeyAlpha.toJSON();

      const alphaShareBits = typeof alphaShareJson === 'object' && alphaShareJson !== null && 'bits' in alphaShareJson ? alphaShareJson.bits : undefined;
      const totalHotkeySharesBits = typeof totalHotkeySharesJson === 'object' && totalHotkeySharesJson !== null && 'bits' in totalHotkeySharesJson ? totalHotkeySharesJson.bits : undefined;
      const totalAlphaValueNum = typeof totalAlphaJson === 'number' ? totalAlphaJson : (typeof totalAlphaJson === 'object' && totalAlphaJson !== null ? parseFloat(totalAlphaJson.toString()) : 0);

      if (alphaShareBits === undefined || totalHotkeySharesBits === undefined) {
          console.error("Failed to get bits from alphaShare or totalHotkeyShares", { alphaShareJson, totalHotkeySharesJson });
          setIsFromBalanceLoading(false);
          return null;
      }

      const alphaShareValue = parseFixedU128(alphaShareBits);
      const totalSharesValue = parseFixedU128(totalHotkeySharesBits);

      const balance = totalSharesValue > 0 ? (alphaShareValue * totalAlphaValueNum) / totalSharesValue / UNIT : 0;
      setFromSpecificAlphaBalance(balance);
      setIsFromBalanceLoading(false);
      return balance;
    } catch (error) {
      console.error("Error calculating alpha balance:", error);
      setFromSpecificAlphaBalance(null);
      setIsFromBalanceLoading(false);
      return null;
    }
  };

  useEffect(() => {
    const fromSubnetId = getSubnetIdFromToken(fromToken);
    if (api && currentAccount && fromHotkey && fromSubnetId !== null) {
      calculateAlphaBalance(fromHotkey, fromSubnetId);
    } else {
      setFromSpecificAlphaBalance(null);
      setIsFromBalanceLoading(false);
    }
  }, [api, currentAccount, fromToken, fromHotkey]);

  const calculateConversion = (amount: number, from: string, to: string) => {
    if (!amount || !from || !to || isLoading) return 0;

    const fromSubnetId = getSubnetIdFromToken(from);
    const toSubnetId = getSubnetIdFromToken(to);

    if (from === "TAO" && toSubnetId !== null) {
      const alphaPrice = latestPrices[toSubnetId] || 0;
      if (!alphaPrice) return 0;
      return amount / alphaPrice;
    } else if (fromSubnetId !== null && to === "TAO") {
      const alphaPrice = latestPrices[fromSubnetId] || 0;
      if (!alphaPrice) return 0;
      return amount * alphaPrice;
    } else if (fromSubnetId !== null && toSubnetId !== null && fromSubnetId !== toSubnetId) {
      const fromAlphaPrice = latestPrices[fromSubnetId] || 0;
      if (!fromAlphaPrice) return 0;
      const taoAmount = amount * fromAlphaPrice;
      
      const toAlphaPrice = latestPrices[toSubnetId] || 0;
      if (!toAlphaPrice) return 0;
      return taoAmount / toAlphaPrice;
    }
    
    return amount;
  };

  const handleSwap = async () => {
    if (!api || !currentAccount || !currentSigner || !fromAmount || !fromToken || !toToken) {
      toast.error("Please ensure all fields are filled correctly and wallet is connected.");
      return;
    }

    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount specified.");
      return;
    }

    setPending(true);
    setTxStatus({ visible: true, type: "info", message: "Preparing transaction..." });
    try {
      let tx;
      const fromSubnetId = getSubnetIdFromToken(fromToken);
      const toSubnetId = getSubnetIdFromToken(toToken);

      if (fromSubnetId !== null && toSubnetId !== null) {
        if (!fromHotkey || !toHotkey) {
          toast.error("Please select both origin and destination validators.");
          setPending(false); return;
        }
        
        if (fromSubnetId === toSubnetId && fromHotkey === toHotkey) {
          toast.error("Origin and destination validators cannot be the same.");
          setPending(false); return;
        }
        
        if (fromSpecificAlphaBalance === null || amount > fromSpecificAlphaBalance) {
          toast.error("Insufficient Alpha balance on the selected validator.");
          setPending(false); return;
        }
        
        let moveTypeLabel, amountInRao;
        
        if (fromSubnetId === toSubnetId) {
          amountInRao = Math.floor(amount * UNIT);
          moveTypeLabel = "Moving";
        } else {
          amountInRao = Math.floor(amount * UNIT);
          moveTypeLabel = "Cross-subnet moving";
        }
        
        tx = api.tx.subtensorModule.moveStake(
          fromHotkey,
          toHotkey,
          fromSubnetId,
          toSubnetId,
          amountInRao
        );
        
        setTxStatus({ 
          visible: true, 
          type: "info", 
          message: `${moveTypeLabel} ${amount} Alpha from ${fromHotkey.slice(0, 6)}... on Subnet ${fromSubnetId} to ${toHotkey.slice(0, 6)}... on Subnet ${toSubnetId}` 
        });
      } else if (fromToken === "TAO" && toSubnetId !== null) {
        if (!toHotkey) {
          toast.error("Please select a destination validator for the subnet.");
          setPending(false); return;
        }
        const amountInRao = Math.floor(amount * UNIT);
        if (amount > freeBalance) {
           toast.error("Insufficient TAO balance.");
           setPending(false); return;
        }
        tx = api.tx.subtensorModule.addStake(toHotkey, toSubnetId, amountInRao);
        setTxStatus({ visible: true, type: "info", message: `Adding ${amount} TAO stake to ${toHotkey.slice(0, 6)}... on Subnet ${toSubnetId}` });

      } else if (fromSubnetId !== null && toToken === "TAO") {
        if (!fromHotkey) {
          toast.error("Please select the validator to remove stake from.");
          setPending(false); return;
        }
        if (fromSpecificAlphaBalance === null || amount > fromSpecificAlphaBalance) {
             toast.error("Insufficient Alpha balance on the selected validator.");
             setPending(false); return;
         }

        const taoToRemove = calculateConversion(amount, fromToken, toToken);
        if (taoToRemove <= 0) {
            toast.error("Calculated TAO amount to remove is zero or negative based on current price.");
            setPending(false); return;
        }
        const amountToRemoveInRao = Math.floor(taoToRemove * UNIT);

        tx = api.tx.subtensorModule.removeStake(fromHotkey, fromSubnetId, amountToRemoveInRao);
        setTxStatus({ visible: true, type: "info", message: `Removing stake equivalent to ${amount} Alpha from ${fromHotkey.slice(0, 6)}... on Subnet ${fromSubnetId}` });
      } else {
        toast.error("Invalid swap combination selected.");
        setPending(false); return;
      }

      await submitTx(tx);

    } catch (error: any) {
      txErrHandler(error);
    }
  };

  const handleTokenSwap = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;

    setFromToken(toToken);
    setToToken(tempToken);

    setFromAmount(toAmount);
    const newToAmount = calculateConversion(parseFloat(toAmount || '0'), toToken, tempToken);
    setToAmount(newToAmount.toFixed(9));

    const tempHotkey = fromHotkey;
    setFromHotkey(toHotkey);
    setToHotkey(tempHotkey);
    setFromSpecificAlphaBalance(null);
  };

  const fetchAlphaBalances = async () => {
    if (!api || !currentAccount) return;
    
    setIsLoadingBalancesInfo(true);
    try {
      const balancesInfoArray: IBalancesInfo[] = [];
      
      const hotkeysRaw = await api.query.subtensorModule.stakingHotkeys(
        currentAccount.address
      );
      const hotkeyAddresses = hotkeysRaw.map((key: any) => key.toString());
      
      const promises = hotkeyAddresses.map(async (hotkey: string) => {
        const res = await api.query.subtensorModule.alpha.entries(
          hotkey,
          currentAccount.address
        );
        
        const subnetIds = new Set<number>();
        for (const [key] of res) {
          const netUid = Number(key.toHuman()[2]);
          subnetIds.add(netUid);
        }
        
        const subnetDataMap = new Map<
          number,
          {
            tao: string;
            alpha: string;
          }
        >();
        
        const subnetPromises = Array.from(subnetIds).map((netUid: number) => 
          Promise.all([
            api.query.subtensorModule.subnetTAO(netUid),
            api.query.subtensorModule.subnetAlphaIn(netUid),
          ]).then(([tao, alpha]) => {
            subnetDataMap.set(netUid, {
              tao: tao.toString(),
              alpha: alpha.toString(),
            });
          })
        );
        await Promise.all(subnetPromises);
        
        const hotkeyDataMap = new Map<
          number,
          {
            totalAlpha: any;
            totalShares: number;
          }
        >();
        
        const hotkeyDataPromises = Array.from(subnetIds).map((netUid: number) =>
          Promise.all([
            api.query.subtensorModule.totalHotkeyAlpha(hotkey, netUid),
            api.query.subtensorModule.totalHotkeyShares(hotkey, netUid),
          ]).then(([alpha, shares]) => {
            hotkeyDataMap.set(netUid, {
              totalAlpha: alpha.toJSON(),
              totalShares: parseFixedU128(shares.toJSON().bits),
            });
          })
        );
        await Promise.all(hotkeyDataPromises);
        
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
          
          balancesInfoArray.push({
            netUid,
            hotkey,
            alpha,
            price,
            tao
          });
        }
      });
      
      await Promise.all(promises);
      
      setBalancesInfo(balancesInfoArray.sort((a, b) => a.netUid - b.netUid));
    } catch (error) {
      console.error("Error fetching alpha balances:", error);
    } finally {
      setIsLoadingBalancesInfo(false);
    }
  };
  
  useEffect(() => {
    if (currentAccount && api) {
      fetchAlphaBalances();
    }
  }, [currentAccount?.address, api]);

  const getTokenBalance = (token: string) => {
    if (token === "TAO") {
      return freeBalance;
    } else if (token.startsWith("Subnet")) {
        const subnetId = getSubnetIdFromToken(token);
        if (subnetId === null) return 0;

        const subnetEntries = balancesInfo
            .filter((entry: IBalancesInfo) => entry.netUid === subnetId);
        
        const totalAlpha = subnetEntries.reduce((sum: number, entry: IBalancesInfo) => sum + entry.alpha, 0);
        
        return totalAlpha;
    }
    return 0;
  };

  const getTokenBalanceDisplay = (token: string) => {
    if (!token) return "";
    
    if (isLoadingBalancesInfo && token.startsWith("Subnet")) {
      return "Loading...";
    }
    
    const balance = getTokenBalance(token);
    
    return `Balance: ${balance.toFixed(4)} ${token.startsWith("Subnet") ? 'α' : token}`;
  };

  const getFromBalanceDisplay = () => {
      if (fromToken === "TAO") {
          return `Balance: ${freeBalance.toFixed(4)} TAO`;
      }
      if (fromToken.startsWith("Subnet")) {
          if (!fromHotkey) return "Select validator";
          if (isFromBalanceLoading) return "Calculating balance...";
          if (fromSpecificAlphaBalance !== null) {
              return `Balance: ${fromSpecificAlphaBalance.toFixed(4)} α (on ${fromHotkey.slice(0, 6)}...)`;
          }
          return "Balance: 0.0000 α";
      }
      return "";
  };

   const handleSetMaxFromAmount = () => {
       if (fromToken === "TAO") {
           handleFromAmountChange(freeBalance.toString());
       } else if (fromToken.startsWith("Subnet") && fromHotkey && fromSpecificAlphaBalance !== null) {
           handleFromAmountChange(fromSpecificAlphaBalance.toFixed(9));
       }
   };

  const handleFromAmountChange = (value: string) => {
      if (/^\d*\.?\d*$/.test(value) || value === '') {
          setFromAmount(value);
          const amount = parseFloat(value);
          if (!isNaN(amount) && amount >= 0 && fromToken && toToken) {
            const convertedAmount = calculateConversion(amount, fromToken, toToken);
            setToAmount(convertedAmount.toFixed(9));
          } else {
            setToAmount("");
          }
      }
  };

  useEffect(() => {
    const amount = parseFloat(fromAmount);
    if (!isNaN(amount) && amount >= 0 && fromToken && toToken) {
      const convertedAmount = calculateConversion(amount, fromToken, toToken);
      setToAmount(convertedAmount.toFixed(9));
    } else {
       setToAmount("");
    }
  }, [fromToken, toToken, latestPrices, isLoading, fromAmount]);

  const handleFromTokenSelect = (tokenId: string) => {
    setFromToken(tokenId);
    setToToken("");
    setFromAmount("");
    setToAmount("");
    setFromHotkey(null);
    setToHotkey(null);
    setFromSpecificAlphaBalance(null);
  };

  const handleToTokenSelect = (tokenId: string) => {
    setToToken(tokenId);
    setToAmount("");
    setToHotkey(null);
    const amount = parseFloat(fromAmount);
    if (!isNaN(amount) && amount >= 0 && fromToken && tokenId) {
      const convertedAmount = calculateConversion(amount, fromToken, tokenId);
      setToAmount(convertedAmount.toFixed(9));
    }
  };

  const submitTx = async (tx: any) => {
    if (!currentAccount || !currentSigner) {
        toast.error("Account or signer not available.");
        setPending(false); return;
    }
   try {
     tx.signAndSend( currentAccount.address, { signer: currentSigner, withSignedTransaction: true }, txResHandler )
       .catch(txErrHandler);
   } catch (e) { txErrHandler(e); }
  };

  const txResHandler = ({ status, events = [], dispatchError }: any) => {
    setTxStatus(prev => ({ ...prev, message: `Current status: ${status.type}` }));
    if (dispatchError) {
        let message = "Transaction failed: Unknown dispatch error.";
        if (dispatchError.isModule && api) {
            try {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                message = `Transaction Error: ${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
            } catch { /* Ignore decode error, use fallback */ }
        } else { message = `Transaction failed: ${dispatchError.toString()}`; }
        setTxStatus({ visible: true, type: "error", message: `😞 ${message}` });
        setPending(false); toast.error(message);
    } else if (status.isFinalized) {
        setTxStatus(prev => ({ ...prev, message: `Finalized in block: ${status.asFinalized}` }));
        const success = events.some(({ event }: any) => api?.events.system.ExtrinsicSuccess.is(event));
        if (success) {
          toast("Success!", { position: "top-center", duration: 5000, icon: <CheckCircle className="text-green-500" />, description: "Swap transaction successful.", className: "bg-green-100 text-green-900" });
          setFromAmount(""); setToAmount(""); setFromToken(""); setToToken("");
          setFromHotkey(null); setToHotkey(null);
          setFromSpecificAlphaBalance(null);
          setPending(false);
          setTimeout(() => setTxStatus({ visible: false, type: 'info', message: '' }), 3000);
        } else {
           const failureEvent = events.find(({ event }: any) => api?.events.system.ExtrinsicFailed.is(event));
           if (failureEvent) {
               const { data: [error] } = failureEvent.event;
               let message = "Transaction failed: Extrinsic failed event.";
               if (error.isModule && api) { try { const decoded = api.registry.findMetaError(error.asModule); message = `Failed: ${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`; } catch { /* fallback */ } }
               else { message = `Failed: ${error.toString()}`; }
               txErrHandler(message);
           } else { txErrHandler("Transaction finalized but status unclear."); }
        }
    } else if (status.isInBlock) {
        setTxStatus(prev => ({ ...prev, message: `Included in block: ${status.asInBlock}` }));
    }
  };

  const txErrHandler = (err: any) => {
    let message = "Transaction failed";
    if (err instanceof Error) { message = err.message; }
    else if (typeof err === 'string') { message = err; }
    else { message = `Unknown error: ${JSON.stringify(err)}`; }
    console.error("Transaction Error:", err);
    setTxStatus({ visible: true, type: "error", message: `😞 Failed: ${message}` });
    toast.error("Transaction Failed", { description: message });
    setPending(false);
  };

  if (isLoading && !subnets.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const isMaxButtonDisabled = () => {
    if (!fromToken || pending) return true;
    if (fromToken === "TAO") return freeBalance <= 0;
    if (fromToken.startsWith("Subnet")) {
        return !fromHotkey || isFromBalanceLoading || fromSpecificAlphaBalance === null || fromSpecificAlphaBalance <= 0;
    }
    return true;
  };

  const isSwapButtonDisabled = () => {
      const baseDisabled = pending || !fromAmount || !fromToken || !toToken || parseFloat(fromAmount) <= 0;
      if (baseDisabled) return true;

      const fromRequiresHotkey = fromToken.startsWith("Subnet");
      const toRequiresHotkey = toToken.startsWith("Subnet");

      if (fromRequiresHotkey && !fromHotkey) return true;
      if (toRequiresHotkey && !toHotkey) return true;
      
      const fromSubnetId = getSubnetIdFromToken(fromToken);
      const toSubnetId = getSubnetIdFromToken(toToken);
      if (fromSubnetId !== null && toSubnetId !== null && 
          fromSubnetId === toSubnetId && fromHotkey === toHotkey) {
        return true;
      }

      if (fromRequiresHotkey && fromHotkey && fromSpecificAlphaBalance !== null) {
          if (parseFloat(fromAmount) > fromSpecificAlphaBalance) return true;
      }
      if (fromToken === "TAO") {
         if (parseFloat(fromAmount) > freeBalance) return true;
      }

      return false;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-card/80 backdrop-blur-sm border border-border shadow-lg rounded-xl p-8 space-y-8">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-lg shadow-md">
            <ArrowUpDown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Simple Swap</h2>
            <p className="text-sm text-muted-foreground">Swap between TAO and subnet Alpha tokens or move Alpha across different subnets</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-muted/30 p-6 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-foreground flex-shrink-0">
                From {fromToken && <span className="ml-1.5 text-lg font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3.5 py-1.5 rounded-md">
                  <span className="mr-1">{getTokenSymbol(fromToken)}</span>
                  <span className="text-sm text-indigo-500 dark:text-indigo-400">{getTokenName(fromToken)}</span>
                </span>}
              </h3>
              <div className="w-full sm:w-auto sm:min-w-[180px]">
                <TokenGridSelector
                  tokens={fromTokens}
                  selectedToken={fromToken}
                  onTokenSelect={handleFromTokenSelect}
                  placeholder="Select token"
                  disabled={pending}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder={fromToken ? "0.0" : "Select 'From' token"}
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  className="text-2xl h-14 flex-1 bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  disabled={!fromToken || pending}
                />
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSetMaxFromAmount}
                  disabled={isMaxButtonDisabled()}
                  className="h-14 px-6"
                >
                  Max
                </Button>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2 h-5">
                {fromToken && <span>{getFromBalanceDisplay()}</span>}
              </div>
            </div>
            
            {showMoveStakeHelperMessage && (
              <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 p-2 rounded-md mt-2">
                <p>Note: For moving stake between validators in the same subnet, please use the <a href="/stake/move" className="underline font-medium">Move Stake</a> page.</p>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white w-10 h-10 disabled:opacity-50"
              onClick={handleTokenSwap}
              disabled={pending || !fromToken || !toToken}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="bg-muted/30 p-6 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-foreground flex-shrink-0">
                To {toToken && <span className="ml-1.5 text-lg font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3.5 py-1.5 rounded-md">
                  <span className="mr-1">{getTokenSymbol(toToken)}</span>
                  <span className="text-sm text-indigo-500 dark:text-indigo-400">{getTokenName(toToken)}</span>
                </span>}
              </h3>
              <div className="w-full sm:w-auto sm:min-w-[180px]">
                <TokenGridSelector
                  tokens={toTokens}
                  selectedToken={toToken}
                  onTokenSelect={handleToTokenSelect}
                  placeholder="Select token"
                  disabled={pending || !fromToken || toTokens.length === 0}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder={toToken ? "0.0" : "Select 'To' token"}
                  value={toAmount}
                  readOnly
                  className="text-2xl h-14 flex-1 bg-background disabled:bg-muted/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  disabled
                />
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2 h-5">
                {toToken && <span>{getTokenBalanceDisplay(toToken)}</span>}
              </div>
            </div>
          </div>

          {fromToken.startsWith("Subnet") && (
            <div className="bg-muted/30 p-6 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-base font-medium text-foreground">
                  {isAlphaToAlphaMove 
                    ? `Select Origin Validator (${fromToken})` 
                    : "Select Validator to Swap From"}
                </label>
                <div className="flex items-center space-x-3">
                  <Label htmlFor="from-manual-input" className="text-sm font-medium">Manual Input</Label>
                  <Switch id="from-manual-input" checked={isFromManualInput} onCheckedChange={setIsFromManualInput} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {isAlphaToAlphaMove 
                  ? isCrossSubnetMove
                    ? "Choose the validator currently holding your Alpha you want to move to another subnet."
                    : "Choose the validator currently holding your Alpha that you want to move."
                  : "Choose the validator holding the Alpha you want to swap back to TAO. Your balance on the selected validator will be shown above."}
              </p>
              
              {isFromManualInput ? (
                <Input
                  value={fromHotkey || ''}
                  onChange={(e) => { 
                    setFromHotkey(e.target.value);
                    setFromAmount(""); 
                    setToAmount(""); 
                    setFromSpecificAlphaBalance(null); 
                  }}
                  placeholder="Enter origin validator hotkey manually"
                  className="h-12 text-base"
                  disabled={pending}
                />
              ) : (
                <Select
                  value={fromHotkey || ""}
                  onValueChange={(value) => { 
                    setFromHotkey(value); 
                    setFromAmount(""); 
                    setToAmount(""); 
                    setFromSpecificAlphaBalance(null); 
                  }}
                  disabled={pending || stakingDataLoading}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder={stakingDataLoading ? "Loading your stakes..." : "Select validator"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const fromSubnetId = getSubnetIdFromToken(fromToken);
                      
                      if (fromSubnetId === null) {
                        return <div className="p-4 text-sm text-muted-foreground text-center">Invalid subnet selected.</div>;
                      }
                      if (stakingDataLoading) {
                         return <div className="p-4 text-sm text-muted-foreground text-center">Loading your stakes...</div>;
                      }

                      const stakesOnSubnet = currentStakes.filter(stake => stake.net_uid === fromSubnetId);
                      
                      const stakedHotkeys = new Set(stakesOnSubnet.map(stake => stake.hotkey));
                      
                      if (stakedHotkeys.size === 0) {
                        return <div className="p-4 text-sm text-muted-foreground text-center">You have no stake on Subnet {fromSubnetId}.</div>;
                      }

                      const validatorsWithBalance = Array.from(stakedHotkeys).filter((hotkey) => {
                        const validatorBalance = balancesInfo.find(
                          balance => balance.hotkey === hotkey && balance.netUid === fromSubnetId
                        );
                        return validatorBalance && validatorBalance.alpha > 0;
                      });

                      if (validatorsWithBalance.length === 0) {
                        return <div className="p-4 text-sm text-muted-foreground text-center">You have no validators with stake on Subnet {fromSubnetId}.</div>;
                      }

                      return validatorsWithBalance.map((hotkey) => {
                          const validatorInfo = validators.find(v => v.hotkey === hotkey);
                          const displayName = validatorInfo?.name || 'Unnamed';
                          const displayHotkey = `${hotkey.slice(0, 6)}...${hotkey.slice(-4)}`;
                          
                          const validatorBalance = balancesInfo.find(
                            balance => balance.hotkey === hotkey && balance.netUid === fromSubnetId
                          );
                          const alphaBalance = validatorBalance ? validatorBalance.alpha.toFixed(4) : '0.0000';

                          return (
                              <SelectItem key={`from-hotkey-${hotkey}`} value={hotkey}>
                                  <div className="flex flex-col text-left">
                                      <span className="font-medium truncate max-w-[280px]">{displayName} ({displayHotkey})</span>
                                      <span className="text-xs text-muted-foreground">
                                          Your Stake: {alphaBalance} α
                                      </span>
                                  </div>
                              </SelectItem>
                          );
                      });
                    })()}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {toToken.startsWith("Subnet") && (
            <div className="bg-muted/30 p-6 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-base font-medium text-foreground">
                  {isAlphaToAlphaMove 
                    ? isCrossSubnetMove 
                      ? `Select Destination Validator (${toToken})` 
                      : "Select Destination Validator" 
                    : "Select Validator to Swap To"}
                </label>
                <div className="flex items-center space-x-3">
                  <Label htmlFor="to-manual-input" className="text-sm font-medium">Manual Input</Label>
                  <Switch id="to-manual-input" checked={isToManualInput} onCheckedChange={setIsToManualInput} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {isAlphaToAlphaMove
                  ? isCrossSubnetMove
                    ? `Choose the validator in ${toToken} where you want to move your Alpha stake to.`
                    : "Choose the validator where you want to move your Alpha stake to."
                  : "Choose the validator where you want to receive the Alpha."}
              </p>
              
              {isToManualInput ? (
                <Input
                  value={toHotkey || ''}
                  onChange={(e) => setToHotkey(e.target.value)}
                  placeholder="Enter destination validator hotkey manually"
                  className="h-12 text-base"
                  disabled={pending}
                />
              ) : (
                <Select
                  value={toHotkey || ""}
                  onValueChange={(value) => setToHotkey(value)}
                  disabled={pending}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select validator" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const toSubnetId = getSubnetIdFromToken(toToken);
                      
                      if (toSubnetId === null) {
                        return <div className="p-4 text-sm text-muted-foreground text-center">Invalid subnet selected.</div>;
                      }
                      
                      const validatorsForSubnet = validators.filter(v => 
                        v.netuids.includes(toSubnetId)
                      );
                      
                      const filteredValidators = isAlphaToAlphaMove && !isCrossSubnetMove && fromHotkey
                        ? validatorsForSubnet.filter(v => v.hotkey !== fromHotkey)
                        : validatorsForSubnet;
                      
                      if (filteredValidators.length === 0) {
                        console.log(`No validators specifically registered for subnet ${toSubnetId}, showing all validators`);
                        
                        const allValidatorsFiltered = isAlphaToAlphaMove && !isCrossSubnetMove && fromHotkey
                          ? validators.filter(v => v.hotkey !== fromHotkey)
                          : validators;
                        
                        if (allValidatorsFiltered.length === 0) {
                          return <div className="p-4 text-sm text-muted-foreground text-center">No validators found.</div>;
                        }
                        
                        return allValidatorsFiltered.map((validator: ValidatorInfo) => (
                          <SelectItem key={`to-hotkey-${validator.hotkey}`} value={validator.hotkey}>
                            {validator.name || 'Unnamed'} ({validator.hotkey.slice(0, 6)}...{validator.hotkey.slice(-4)})
                          </SelectItem>
                        ));
                      }
                      
                      return filteredValidators.map((validator: ValidatorInfo) => (
                        <SelectItem key={`to-hotkey-${validator.hotkey}`} value={validator.hotkey}>
                           {validator.name || 'Unnamed'} ({validator.hotkey.slice(0, 6)}...{validator.hotkey.slice(-4)})
                        </SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <Button
            onClick={handleSwap}
            disabled={isSwapButtonDisabled()}
            className="w-full h-14 text-base bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending 
              ? 'Processing...' 
              : (isAlphaToAlphaMove 
                  ? isCrossSubnetMove 
                    ? 'Move Alpha Across Subnets' 
                    : 'Move Alpha' 
                  : 'Swap Tokens')}
          </Button>
        </div>
      </div>

      <LoadingOverlay isLoading={pending || stakingDataLoading} message={txStatus.visible ? txStatus.message : (stakingDataLoading ? "Loading staking data..." : "")} />
    </div>
  );
} 