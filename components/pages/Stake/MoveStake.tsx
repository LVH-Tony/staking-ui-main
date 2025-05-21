"use client";
import { useState, useEffect, useMemo } from "react";
import { useApi } from "@/contexts/api";
import { useSubnetAndValidators } from "@/contexts/subnetsAndValidators";
import { useStakingData } from "@/hooks/useStakingData";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, Info, ArrowRightLeft, ArrowDown, Plus } from "lucide-react";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import { UNIT } from "@/constants/shared"; // Ensure UNIT is correctly defined (e.g., 1_000_000_000)
import { ValidatorInfo } from "@/types";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { parseFixedU128 } from "@/utils"; // Ensure this utility function is correctly implemented
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MoveStakeProps {
  prePopulatedValues?: {
    subnet: number;
    hotkey: string;
  } | null;
}

interface MoveStakeRow {
  netUid: number | null;
  originHotkey: string;
  destinationHotkey: string;
  amount: string;
  alphaBalance: number | null;
  taoPrice: number | null;
}

export default function MoveStake({ prePopulatedValues }: MoveStakeProps) {
  const {
    state: { api, currentAccount, currentSigner },
  } = useApi();
  const { validators, subnets, loading } = useSubnetAndValidators();
  const { stakingData, getStakingsByColdkey } = useStakingData({
    coldkey: currentAccount?.address,
    limit: 500,
  });

  const [pending, setPending] = useState(false);
  const [txStatus, setTxStatus] = useState({
    visible: false,
    type: "info",
    message: "",
  });

  // Form state
  const [rows, setRows] = useState<MoveStakeRow[]>([
    {
      netUid: null,
      originHotkey: "",
      destinationHotkey: "",
      amount: "",
      alphaBalance: null,
      taoPrice: null,
    }
  ]);
  const [isManualInput, setIsManualInput] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedSubnetForBatch, setSelectedSubnetForBatch] = useState<number | null>(null);

  // Move currentStakes declaration to the top with other state
  const currentStakes = getStakingsByColdkey(currentAccount?.address || "");

  // --- Add derived state for staked subnets ---
  const stakedSubnetUids = useMemo(() => {
    const uids = new Set<number>();
    currentStakes.forEach(stake => uids.add(stake.net_uid));
    return uids;
  }, [currentStakes]);

  const stakedSubnets = useMemo(() => {
    return subnets.filter(subnet => stakedSubnetUids.has(subnet.net_uid));
  }, [subnets, stakedSubnetUids]);
  // --- End derived state ---

  // Add this state near the top with other state declarations
  const [preCalculatedBalances, setPreCalculatedBalances] = useState<Record<string, number>>({});
  const [isCalculatingBalances, setIsCalculatingBalances] = useState(false);

  // Add this useEffect to calculate balances on load
  useEffect(() => {
    const calculateInitialBalances = async () => {
      if (!api || !currentAccount || isCalculatingBalances) return;

      setIsCalculatingBalances(true);
      try {
        const balances: Record<string, number> = {};
        const promises = currentStakes.map(async (stake) => {
          const balance = await calculateAlphaBalance(stake.hotkey, stake.net_uid);
          if (balance !== null) {
            balances[`${stake.hotkey}-${stake.net_uid}`] = balance;
          }
        });

        await Promise.all(promises);
        setPreCalculatedBalances(balances);
      } catch (error) {
        console.error("Error calculating initial balances:", error);
      } finally {
        setIsCalculatingBalances(false);
      }
    };

    calculateInitialBalances();
  }, [api, currentAccount, currentStakes.length]); // Only recalculate when these change

  // Add this function near the top of the component, after the state declarations
  const calculateAlphaBalance = async (hotkey: string, netUid: number) => {
    if (!api || !currentAccount) return null;
    
    try {
      const [alphaShare, totalHotkeyAlpha, totalHotkeyShares] = await Promise.all([
        api.query.subtensorModule.alpha(hotkey, currentAccount.address, netUid),
        api.query.subtensorModule.totalHotkeyAlpha(hotkey, netUid),
        api.query.subtensorModule.totalHotkeyShares(hotkey, netUid)
      ]);

      const alphaShareValue = parseFixedU128(alphaShare.toJSON().bits);
      const totalAlphaValue = parseFloat(totalHotkeyAlpha.toJSON());
      const totalSharesValue = parseFixedU128(totalHotkeyShares.toJSON().bits);

      return totalSharesValue > 0 ? (alphaShareValue * totalAlphaValue) / totalSharesValue / UNIT : 0;
    } catch (error) {
      console.error("Error calculating alpha balance:", error);
      return null;
    }
  };

  // Handle pre-populated values
  useEffect(() => {
    if (prePopulatedValues) {
      setRows([{
        netUid: prePopulatedValues.subnet,
        originHotkey: prePopulatedValues.hotkey,
        destinationHotkey: "",
        amount: "",
        alphaBalance: null,
        taoPrice: null,
      }]);
       // Note: The main balance useEffect will handle calculation automatically
    }
  }, [prePopulatedValues]);

  // Update the useEffect for calculating balances
  useEffect(() => {
    const calculateBalances = async () => {
      if (!api || !currentAccount) return;

      const updatedRows = await Promise.all(rows.map(async (row) => {
        if (!row.originHotkey || !row.netUid) {
          return { ...row, alphaBalance: null, taoPrice: null };
        }

        try {
          const [alphaBalance, subnetTAO, subnetAlphaIn] = await Promise.all([
            calculateAlphaBalance(row.originHotkey, row.netUid),
            api.query.subtensorModule.subnetTAO(row.netUid),
            api.query.subtensorModule.subnetAlphaIn(row.netUid)
          ]);
          
          const tao_in = subnetTAO.toString();
          const alpha_in = subnetAlphaIn.toString();
          const price = row.netUid === 0 ? 1 : Number(tao_in) / Number(alpha_in);

          return { ...row, alphaBalance, taoPrice: price };
        } catch (error) {
          console.error("Error calculating balances:", error);
          return { ...row, alphaBalance: null, taoPrice: null };
        }
      }));

      setRows(updatedRows);
    };

    calculateBalances();
  }, [api, currentAccount, rows.map(r => `${r.originHotkey}-${r.netUid}`).join(',')]);

  // Simplified updateRow function
  const updateRow = (index: number, field: keyof MoveStakeRow, value: any) => {
      const newRows = [...rows];
      const processedValue = field === 'netUid' && typeof value === 'string' ? parseInt(value, 10) : value;
      
      // If the netUid is being updated, reset the origin hotkey and related fields
      if (field === 'netUid') {
        newRows[index] = { 
          ...newRows[index], 
          [field]: processedValue,
          originHotkey: '', 
          destinationHotkey: '', 
          amount: '', 
          alphaBalance: null, 
          taoPrice: null 
        };
      } else {
        newRows[index] = { ...newRows[index], [field]: processedValue };
        
        // If origin hotkey is being changed, reset destination and amount
        if (field === 'originHotkey' && value !== newRows[index].originHotkey) {
          newRows[index].destinationHotkey = '';
          newRows[index].amount = '';
          newRows[index].alphaBalance = null;
          newRows[index].taoPrice = null;
        }
      }
      
      setRows(newRows);
  };

  const handleMoveStake = async () => {
    if (!api || !currentAccount || !currentSigner) return;

    if (isBatchMode) {
      // Batch Mode Logic
      if (!selectedSubnetForBatch || !rows[0].destinationHotkey) {
        toast.error("Please select a subnet and destination hotkey for batch mode");
        return;
      }
      // Find stakes relevant to the selected subnet
      const subnetStakes = currentStakes.filter(stake => stake.net_uid === selectedSubnetForBatch);
      if (subnetStakes.length === 0) {
        toast.error("No stakes found for the selected subnet to move in batch");
        return;
      }
      setPending(true);
      try {
        // --- Corrected Batch Logic ---
        const destinationHotkey = rows[0].destinationHotkey;

        // 1. Consolidate stakes by origin hotkey using the pre-calculated alpha balances
        const consolidatedStakes: Record<string, number> = {};
        for (const stake of subnetStakes) {
          // Skip if the stake is for the destination hotkey (no self-moves)
          if (stake.hotkey === destinationHotkey) continue;
          
          // Use the pre-calculated alpha balance instead of stake.tao
          const balanceKey = `${stake.hotkey}-${stake.net_uid}`;
          const alphaBalance = preCalculatedBalances[balanceKey] || 0;
          
          // Only add if balance is positive
          if (alphaBalance > 0) {
            // Convert alpha to RAO for the blockchain call
            const amountInRao = Math.floor(alphaBalance * UNIT);
            consolidatedStakes[stake.hotkey] = amountInRao;
          }
        }

        // 2. Create calls, filtering zero amounts
        const calls = Object.entries(consolidatedStakes)
          .filter(([_, amount]) => amount > 0) // Ensure amount is positive
          .map(([originHotkey, amountInRao]) => {
            return api.tx.subtensorModule.moveStake(
              originHotkey,             // Origin hotkey
              destinationHotkey,        // Destination hotkey
              selectedSubnetForBatch!,  // Origin netuid (same as destination)
              selectedSubnetForBatch!,  // Destination netuid
              amountInRao               // Alpha amount in RAO
            );
          });
        // --- End Corrected Batch Logic ---

        if (calls.length === 0) {
          toast.error("No valid stakes found to move (excluding self-moves or zero amounts).");
          setPending(false);
          return;
        }
        const tx = api.tx.utility.batch(calls);
        await submitTx(tx);
      } catch (error) {
        txErrHandler(error);
      }
    } else {
      // Standard Mode Logic
      const validRows = rows.filter(row =>
        row.originHotkey && row.destinationHotkey && row.netUid !== null && row.amount && parseFloat(row.amount) > 0
      );
      if (validRows.length === 0) {
         toast.error(`Please ensure at least one move has all fields filled with a valid amount.`);
         return;
      }
      if(validRows.length < rows.length) {
          toast.warning(`Ignoring ${rows.length - validRows.length} incomplete row(s).`);
      }
      const insufficientBalanceRows = validRows.filter(row =>
           row.alphaBalance === null || parseFloat(row.amount) > row.alphaBalance
       );
       if (insufficientBalanceRows.length > 0) {
           const rowIndices = insufficientBalanceRows.map(r => `#${rows.findIndex(origRow => origRow === r) + 1}`).join(', ');
           toast.error(`Amount exceeds available balance for row(s): ${rowIndices}`);
           return;
       }
      setPending(true);
      try {
        const calls = validRows.map(row => {
             // Convert user-entered Alpha amount to Rao for the transaction
             const amountInRao = Math.floor(parseFloat(row.amount) * UNIT);
             // Use hotkeys directly from state/data
             return api.tx.subtensorModule.moveStake(
                row.originHotkey, // Origin hotkey
                row.destinationHotkey, // Destination hotkey
                row.netUid!, // Origin netuid
                row.netUid!, // Destination netuid
                amountInRao // Amount
             );
        });
        const tx = calls.length > 1 ? api.tx.utility.batch(calls) : calls[0];
        await submitTx(tx);
      } catch (error) {
        txErrHandler(error);
      }
    }
  };

  const addRow = () => {
    setRows([...rows, {
      netUid: null,
      originHotkey: "",
      destinationHotkey: "",
      amount: "",
      alphaBalance: null,
      taoPrice: null,
    }]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
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
    setTxStatus({ visible: true, type: "info", message: `Current status: ${status.type}` });
    if (dispatchError) {
        let message = "Transaction failed: Unknown dispatch error.";
        if (dispatchError.isModule) {
            try {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                message = `Transaction Error: ${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
            } catch { /* Ignore decode error, use fallback */ }
        } else { message = `Transaction failed: ${dispatchError.toString()}`; }
        setTxStatus({ visible: true, type: "error", message: `😞 ${message}` });
        setPending(false); toast.error(message);
    } else if (status.isFinalized) {
      setTxStatus(prev => ({ ...prev, message: `Finalized in block: ${status.asFinalized}` }));
      const success = events.some(({ event }: any) => api.events.system.ExtrinsicSuccess.is(event));
      if (success) {
        toast("Success!", { position: "top-center", duration: 5000, icon: <CheckCircle className="text-green-500" />, description: "Stake moved successfully.", className: "bg-green-100 text-green-900" });
        setRows([{ netUid: null, originHotkey: "", destinationHotkey: "", amount: "", alphaBalance: null, taoPrice: null }]);
        setIsBatchMode(false); setSelectedSubnetForBatch(null); setIsManualInput(false); setPending(false);
        setTimeout(() => setTxStatus({ visible: false, type: 'info', message: '' }), 3000);
      } else {
          // Check for explicit failure event if not success
           const failureEvent = events.find(({ event }: any) => api.events.system.ExtrinsicFailed.is(event));
           if (failureEvent) {
               const { data: [error] } = failureEvent.event;
               let message = "Transaction failed: Extrinsic failed event.";
               if (error.isModule) { try { const decoded = api.registry.findMetaError(error.asModule); message = `Failed: ${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`; } catch { /* fallback */ } }
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

  // Get unique validators for the current subnet, excluding a specific hotkey
  const getUniqueValidators = (netUid: number | null, excludeHotkey?: string) => {
    if (netUid === null || loading) return [];
    // Filter validators by subnet ID and exclude the specified hotkey
    const validatorsForSubnet = validators;
    const seen = new Set<string>();
    return validatorsForSubnet
      .filter(v => v.hotkey && v.hotkey !== excludeHotkey)
      .filter(v => { if (seen.has(v.hotkey)) return false; seen.add(v.hotkey); return true; });
  };

  if (!currentAccount) return (
      <div className="max-w-2xl mx-auto p-6 text-center text-gray-500">Loading account data...</div>
  );

  // Main component render
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-card/80 backdrop-blur-sm border border-border shadow-lg rounded-xl p-8 space-y-8">
        {/* Header & Batch Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
                 <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-md"><ArrowRightLeft className="w-5 h-5 text-white" /></div>
                 <div>
                     <h2 className="text-xl font-semibold text-foreground">Move Stake</h2>
                     <p className="text-sm text-muted-foreground">Transfer your staked Alpha between validators within the same subnet</p>
                 </div>
             </div>
            <div className="flex items-center gap-4 ml-auto">
                <div className="flex items-center gap-2">
                    <Label htmlFor="batch-mode" className="text-sm font-medium whitespace-nowrap">Batch Mode</Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs text-sm">Batch mode moves all your stake from all validators in a chosen subnet to a single destination validator in one transaction.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <Switch id="batch-mode" checked={isBatchMode} onCheckedChange={setIsBatchMode} />
            </div>
        </div>

        {/* Batch Mode Form */}
        {isBatchMode ? (
          <div className="space-y-6">
             <div className="space-y-3">
                 <Label className="text-base font-medium">Select Subnet for Batch Move</Label>
                 <Select value={selectedSubnetForBatch?.toString() || ""} onValueChange={(value: string) => setSelectedSubnetForBatch(value ? parseInt(value) : null)}>
                     <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Select subnet with your stake" /></SelectTrigger>
                     <SelectContent>
                        {stakedSubnets.length === 0 && <div className="p-4 text-sm text-muted-foreground text-center">No subnets with stake found.</div>}
                        {stakedSubnets.map((subnet) => (
                          <SelectItem key={subnet.net_uid} value={subnet.net_uid.toString()}>
                            {subnet.name || `Subnet ${subnet.net_uid}`} {subnet.symbol && `(${subnet.symbol})`} (ID: {subnet.net_uid})
                          </SelectItem>
                        ))}
                     </SelectContent>
                 </Select>
                 {selectedSubnetForBatch !== null && (<p className="text-sm text-muted-foreground">This will move all your current stakes from Subnet {selectedSubnetForBatch}.</p>)}
             </div>
            <div className="space-y-3">
                <Label className="text-base font-medium">Destination Hotkey</Label>
                {isManualInput ? ( <Input value={rows[0].destinationHotkey} onChange={(e) => updateRow(0, 'destinationHotkey', e.target.value)} placeholder="Enter destination hotkey manually" className="h-12 text-base" />
                ) : (
                    <Select value={rows[0].destinationHotkey} onValueChange={(value) => updateRow(0, 'destinationHotkey', value)} disabled={selectedSubnetForBatch === null}>
                        <SelectTrigger className="h-12 text-base"><SelectValue placeholder={selectedSubnetForBatch === null ? "Select subnet first" : "Select destination hotkey"} /></SelectTrigger>
                        <SelectContent>
                            {getUniqueValidators(selectedSubnetForBatch).map((validator) => { const s = validator.hotkey.slice(0, 6) + '...' + validator.hotkey.slice(-4); return (<SelectItem key={`b-${validator.hotkey}`} value={validator.hotkey}>{validator.name || 'Unnamed'} ({s})</SelectItem>); })}
                            {selectedSubnetForBatch !== null && getUniqueValidators(selectedSubnetForBatch).length === 0 && (<div className="p-4 text-sm text-muted-foreground text-center">No available validators found.</div>)}
                        </SelectContent>
                    </Select>
                )}
                <div className="flex items-center space-x-3 pt-2">
                    <Label htmlFor="manual-input-batch" className="text-sm font-medium">Manual Destination Input</Label>
                    <Switch id="manual-input-batch" checked={isManualInput} onCheckedChange={setIsManualInput} />
                </div>
            </div>
            <Button onClick={handleMoveStake} 
              disabled={pending || !selectedSubnetForBatch || !rows[0].destinationHotkey} 
              className="w-full h-14 text-base bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? 'Processing...' : `Move All Stakes from Subnet ${selectedSubnetForBatch ?? '...'}`}
            </Button>
          </div>
        ) : (
        /* Standard Multi-Row Form */
          <>
            <div className="space-y-6">
              {rows.map((row, index) => (
                <div key={index} className="space-y-6 border-b border-border pb-6 last:border-b-0 last:pb-0">
                  {/* Debug info for each row */}
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    <div>Row #{index + 1} Status:</div>
                    <div>Origin Hotkey: {row.originHotkey || 'Not selected'}</div>
                    <div>Destination Hotkey: {row.destinationHotkey || 'Not selected'}</div>
                    <div>Subnet ID: {row.netUid ?? 'Not selected'}</div>
                    <div>Amount: {row.amount || 'Not entered'}</div>
                    <div>Available Balance: {row.alphaBalance?.toFixed(4) ?? 'Calculating...'}</div>
                    <div>Amount Valid: {row.amount && parseFloat(row.amount) > 0 ? 'Yes' : 'No'}</div>
                    <div>Within Balance: {row.alphaBalance !== null && row.amount ? 
                      (parseFloat(row.amount) <= row.alphaBalance ? 'Yes' : 'No') : 'N/A'}</div>
                  </div>
                  {/* Row Header & Remove Button */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Move #{index + 1}</h3>
                    {rows.length > 1 && ( <Button variant="ghost" size="sm" onClick={() => removeRow(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1">Remove</Button> )}
                  </div>

                  {/* "From" Section */}
                  <div className="bg-muted/30 p-6 rounded-xl space-y-4 border border-border">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-lg font-medium text-foreground flex-shrink-0">From</h3>
                      {row.netUid !== null && (() => {
                        const selectedSubnet = stakedSubnets.find(s => s.net_uid === row.netUid);
                        return selectedSubnet?.symbol ? (
                          <span className="text-base font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                            {selectedSubnet.symbol}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    
                    {/* Subnet Selector */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Subnet</Label>
                      <Select
                        value={row.netUid?.toString() || ""}
                        onValueChange={(value) => updateRow(index, 'netUid', value)}
                      >
                        <SelectTrigger className="h-12 text-base bg-background">
                          <SelectValue placeholder="Select subnet" />
                        </SelectTrigger>
                        <SelectContent>
                          {stakedSubnets.length === 0 && 
                            <div className="p-4 text-sm text-muted-foreground text-center">No subnets with stake found.</div>
                          }
                          {stakedSubnets.map((subnet) => (
                            <SelectItem key={subnet.net_uid} value={subnet.net_uid.toString()}>
                              {subnet.name || `Subnet ${subnet.net_uid}`} (ID: {subnet.net_uid})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Origin Hotkey Selector */}
                    <div className="space-y-3 pt-2">
                      <Label className="text-sm font-medium">Origin Validator</Label>
                      <Select
                        value={row.originHotkey || ""}
                        onValueChange={(value) => updateRow(index, 'originHotkey', value)}
                        disabled={row.netUid === null}
                      >
                        <SelectTrigger className="w-full h-12 text-base bg-background">
                          <SelectValue placeholder={row.netUid === null ? "Select subnet first" : "Select origin validator"} />
                        </SelectTrigger>
                        <SelectContent>
                           {(() => {
                             if (row.netUid === null) {
                               return <div className="p-4 text-sm text-muted-foreground text-center">Select a subnet first</div>;
                             }
                             
                             // Filter stakes by the selected subnet
                             const subnetStakes = currentStakes.filter(stake => stake.net_uid === row.netUid);
                             
                             // Deduplicate stakes by hotkey within the selected subnet
                             const uniqueStakes = Array.from(
                               new Map(subnetStakes.map(stake => [
                                 stake.hotkey,
                                 stake
                               ])).values()
                             );

                             if (uniqueStakes.length === 0) {
                               return <div className="p-4 text-sm text-muted-foreground text-center">No stakes found for selected subnet</div>;
                             }

                             // Filter out stakes with zero or negative balance
                             const stakesWithNonZeroBalance = uniqueStakes.filter(stake => {
                               const balanceKey = `${stake.hotkey}-${stake.net_uid}`;
                               const alphaBalance = preCalculatedBalances[balanceKey] ?? 0;
                               return alphaBalance > 0;
                             });

                             if (stakesWithNonZeroBalance.length === 0) {
                               return <div className="p-4 text-sm text-muted-foreground text-center">No stakes with positive balance found in this subnet</div>;
                             }

                             return stakesWithNonZeroBalance.map((stake) => {
                                const validator = validators.find(v => v.hotkey === stake.hotkey);
                                const shortenedHotkey = stake.hotkey.slice(0, 6) + '...' + stake.hotkey.slice(-4);
                                const balanceKey = `${stake.hotkey}-${stake.net_uid}`;
                                const alphaBalance = preCalculatedBalances[balanceKey] ?? 0;
                                const isLoading = isCalculatingBalances && !preCalculatedBalances[balanceKey];
                                
                                return (
                                  <SelectItem key={`origin-${stake.hotkey}`} value={stake.hotkey}>
                                    <div className="flex flex-col text-left">
                                      <span className="font-medium truncate max-w-[280px]">{validator?.name || 'Unnamed Validator'} ({shortenedHotkey})</span>
                                      <span className="text-xs text-muted-foreground">
                                        Your Stake: {isLoading ? 'Calculating...' : `${alphaBalance.toFixed(4)} α`}
                                      </span>
                                    </div>
                                  </SelectItem>
                                );
                             });
                           })()}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Amount Input */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Input type="text" inputMode="decimal" placeholder="0.00" value={row.amount}
                          onChange={(e) => { if (/^\d*\.?\d*$/.test(e.target.value) || e.target.value === '') { updateRow(index, 'amount', e.target.value); } }}
                          disabled={!row.originHotkey || row.netUid === null}
                          className="text-2xl h-14 flex-1 bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-muted/50"
                        />
                        <Button variant="outline" size="lg" onClick={() => { if (row.alphaBalance !== null) { updateRow(index, 'amount', row.alphaBalance.toFixed(9)); } }}
                          disabled={row.alphaBalance === null || row.alphaBalance <= 0} className="h-14 px-6">Max</Button>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center justify-between gap-2 flex-wrap">
                        <span>Available: {row.alphaBalance !== null ? `${row.alphaBalance.toFixed(4)} Alpha` : (row.originHotkey ? 'Calculating...' : 'Select origin first')}</span>
                        {row.amount && row.taoPrice !== null && parseFloat(row.amount) > 0 && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full font-medium">≈ {(parseFloat(row.amount) * row.taoPrice).toFixed(4)} τ</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Arrow Down Separator */}
                  <div className="flex justify-center my-[-1rem] z-10 relative"><div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-full shadow-md"><ArrowDown className="h-5 w-5 text-white" /></div></div>

                  {/* "To" Section */}
                  <div className="bg-muted/30 p-6 rounded-xl space-y-4 border border-border">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-foreground">To</h3>
                      <div className="flex items-center space-x-3">
                        <Label htmlFor={`manual-input-${index}`} className="text-sm font-medium">Manual Input</Label>
                        <Switch id={`manual-input-${index}`} checked={isManualInput} onCheckedChange={setIsManualInput} disabled={!row.originHotkey || row.netUid === null} />
                      </div>
                    </div>
                    {isManualInput ? (
                      <Input value={row.destinationHotkey} onChange={(e) => updateRow(index, 'destinationHotkey', e.target.value)} placeholder="Enter destination hotkey manually" disabled={!row.originHotkey || row.netUid === null} className="h-12 text-base bg-background disabled:bg-muted/50" />
                    ) : (
                      <Select value={row.destinationHotkey} onValueChange={(value) => updateRow(index, 'destinationHotkey', value)} disabled={!row.originHotkey || row.netUid === null}>
                        <SelectTrigger className="h-12 text-base bg-background disabled:bg-muted/50"><SelectValue placeholder={!row.originHotkey ? "Select origin validator first" : "Select destination validator"} /></SelectTrigger>
                        <SelectContent>
                          {getUniqueValidators(row.netUid, row.originHotkey).map((validator) => { const s = validator.hotkey.slice(0, 6) + '...' + validator.hotkey.slice(-4); return (<SelectItem key={`d-${validator.hotkey}`} value={validator.hotkey}>{validator.name || 'Unnamed'} ({s})</SelectItem>); })}
                          {row.netUid !== null && getUniqueValidators(row.netUid, row.originHotkey).length === 0 && (<div className="p-4 text-sm text-muted-foreground text-center">No other validators found.</div>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ))}

              <Button onClick={addRow} variant="outline" className="w-full h-12 text-base border-dashed border-muted-foreground hover:border-solid hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400" disabled={pending}>
                <Plus className="w-5 h-5 mr-2" /> Add Another Move
              </Button>
            </div>

            <Button onClick={handleMoveStake}
              disabled={pending || rows.some(row => {
                const isDisabled = !row.originHotkey || 
                  !row.destinationHotkey || 
                  row.netUid === null || 
                  !row.amount || 
                  parseFloat(row.amount) <= 0 || 
                  (row.alphaBalance !== null && parseFloat(row.amount) > row.alphaBalance);
                
                return isDisabled;
              })}
              className="w-full h-14 text-base bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? 'Processing...' : (rows.length > 1 ? 'Move Stakes (Batch)' : 'Move Stake')}
            </Button>
          </>
        )}

        <LoadingOverlay isLoading={pending} message={txStatus.visible ? txStatus.message : ""} />
      </div>
    </div>
  );
}