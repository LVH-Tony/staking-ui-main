"use client";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { StakingDest, Subnet, ValidatorInfo } from "@/types";
import { Plus, Info, ChevronDown, ChevronUp, Search, Key, ExternalLink, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { useSubnetAndValidators } from "@/contexts/subnetsAndValidators";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  stakingDests: StakingDest[];
  setStakingDests: (dests: StakingDest[]) => void;
  subnets: Subnet[];
  validators: ValidatorInfo[];
}

export default function SubnetTable({
  stakingDests,
  setStakingDests,
  subnets,
  validators,
}: Props) {
  const [validatorSelections, setValidatorSelections] = useState<{
    [key: number]: string;
  }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [customHotkey, setCustomHotkey] = useState("");
  const [showCustomInput, setShowCustomInput] = useState<number | null>(null);

  const handleValidatorChange = (net_uid: number, hotkey: string) => {
    setValidatorSelections((prev) => ({ ...prev, [net_uid]: hotkey }));
    setShowCustomInput(null);
  };

  const handleCustomHotkeySubmit = (net_uid: number) => {
    if (customHotkey.trim()) {
      setValidatorSelections((prev) => ({ ...prev, [net_uid]: customHotkey.trim() }));
      setCustomHotkey("");
      setShowCustomInput(null);
    }
  };

  const handleAddSubnet = (subnet: Subnet) => {
    const selectedHotkey = validatorSelections[subnet.net_uid];
    if (selectedHotkey) {
      const validator = validators.find((v) => v.hotkey === selectedHotkey);
      setStakingDests([
        ...stakingDests,
        {
          net_uid: subnet.net_uid,
          hotkey: selectedHotkey,
          validatorName: validator?.name || selectedHotkey.slice(0, 10) + "...",
          percentage: 0,
        },
      ]);
    }
  };

  const isSubnetSelected = (net_uid: number) => {
    return stakingDests.some((dest) => dest.net_uid === net_uid);
  };

  // Filter subnets based on search query
  const filteredSubnets = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    const filtered = subnets.filter((subnet) => {
      const matchesSearch =
        subnet.name.toLowerCase().includes(searchLower) ||
        subnet.custom_display_name?.toLowerCase().includes(searchLower) ||
        subnet.description?.toLowerCase().includes(searchLower) ||
        subnet.net_uid.toString().includes(searchLower) ||
        subnet.symbol?.toLowerCase().includes(searchLower) ||
        subnet.github?.toLowerCase().includes(searchLower) ||
        subnet.discord?.toLowerCase().includes(searchLower) ||
        subnet.discord_username?.toLowerCase().includes(searchLower);
      return matchesSearch;
    });
    
    // Sort by netuid in ascending order
    return filtered.sort((a, b) => a.net_uid - b.net_uid);
  }, [subnets, searchQuery]);

  // Function to format the URL display in the tooltip
  const formatUrlForDisplay = (url: string): string => {
    if (!url) return "";
    
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + (urlObj.pathname !== "/" ? urlObj.pathname : "");
    } catch (e) {
      return url;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-foreground">Available Subnets</h3>
        </div>
        <div className="flex items-center bg-background/80 hover:bg-muted/50 transition-colors py-2.5 px-4 rounded-xl border border-border">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            placeholder="Search subnets... (sorted by netuid)"
            className="w-full pl-3 bg-transparent focus:outline-none text-foreground placeholder-muted-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10">
              <TableRow>
                <TableHead className="w-[100px]">
                  <div className="flex items-center">
                    Netuid
                    <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead>Subnet Name</TableHead>
                <TableHead className="w-[300px]">Validator</TableHead>
                <TableHead className="text-right w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubnets.map((subnet) => {
                const subnetValidators = validators.filter(
                  (v) => v.hotkey && subnet.net_uid !== undefined
                );
                const isSelected = isSubnetSelected(subnet.net_uid);

                return (
                  <TableRow
                    key={subnet.net_uid}
                    className={`hover:bg-muted/50 transition-colors ${
                      isSelected ? "bg-blue-50/20 dark:bg-blue-950/20" : ""
                    }`}
                  >
                    <TableCell className="font-mono text-foreground">
                      <Link href={`/statistics?subnet_uid=${subnet.net_uid}`} className="text-primary hover:text-primary/80 hover:underline flex items-center group">
                        <span className="font-semibold">{subnet.net_uid}</span>
                        {subnet.symbol && (
                          <span className="ml-1.5 text-xs text-muted-foreground group-hover:text-primary/90">
                            ({subnet.symbol})
                          </span>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {subnet.custom_display_name || subnet.name}
                          </span>
                          {subnet.image_url && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a 
                                    href={subnet.image_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p>Visit {formatUrlForDisplay(subnet.image_url)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        {subnet.description && (
                          <span className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {subnet.description}
                          </span>
                        )}
                        <div className="flex gap-3 mt-1">
                          {subnet.github && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a 
                                    href={subnet.github} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-muted-foreground hover:text-foreground underline"
                                  >
                                    Github
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p>Visit {formatUrlForDisplay(subnet.github)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {/* Discord link or username */}
                          {subnet.discord && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a 
                                    href={subnet.discord} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-muted-foreground hover:text-foreground underline"
                                  >
                                    Discord
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p>Visit {formatUrlForDisplay(subnet.discord)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {subnet.discord_username && !subnet.discord && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs text-muted-foreground cursor-help">
                                    Discord
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p>Username: {subnet.discord_username}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
                          onChange={(e) =>
                            handleValidatorChange(subnet.net_uid, e.target.value)
                          }
                          value={validatorSelections[subnet.net_uid] || ""}
                          disabled={isSelected}
                        >
                          <option value="">Select a validator</option>
                          {subnetValidators.map((validator) => (
                            <option key={validator.hotkey} value={validator.hotkey}>
                              {validator.name || validator.hotkey.slice(0, 10) + "..."}
                            </option>
                          ))}
                          {validatorSelections[subnet.net_uid] && 
                           !subnetValidators.some(v => v.hotkey === validatorSelections[subnet.net_uid]) && (
                            <option value={validatorSelections[subnet.net_uid]}>
                              Custom: {validatorSelections[subnet.net_uid].slice(0, 10)}...
                            </option>
                          )}
                        </select>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Popover open={showCustomInput === subnet.net_uid} onOpenChange={(open) => {
                                  if (!open) setShowCustomInput(null);
                                }}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="hover:bg-muted/50 text-foreground"
                                      onClick={() => setShowCustomInput(subnet.net_uid)}
                                      disabled={isSelected}
                                    >
                                      <Key className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80">
                                    <div className="space-y-4">
                                      <h4 className="font-medium">Enter Custom Hotkey</h4>
                                      <Input
                                        placeholder="Enter hotkey address"
                                        value={customHotkey}
                                        onChange={(e) => setCustomHotkey(e.target.value)}
                                        className="w-full"
                                      />
                                      <div className="flex justify-end">
                                        <Button
                                          size="sm"
                                          onClick={() => handleCustomHotkeySubmit(subnet.net_uid)}
                                          disabled={!customHotkey.trim()}
                                        >
                                          Add Hotkey
                                        </Button>
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p>Manually enter hotkey</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`${
                          isSelected
                            ? "text-muted-foreground hover:text-muted-foreground cursor-not-allowed"
                            : "text-foreground hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400"
                        }`}
                        onClick={() => !isSelected && handleAddSubnet(subnet)}
                        disabled={isSelected || !validatorSelections[subnet.net_uid]}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export function BalanceInfo({
  title,
  amount,
  symbol,
  highlight,
}: {
  title: string;
  amount: string;
  symbol: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 text-right">
      <p className="text-[13px] font-semibold text-muted-foreground">{title}</p>
      <div className="flex items-baseline justify-end gap-2">
        <p
          className={`text-[20px] font-normal ${
            highlight
              ? "text-[#00DBBC] bg-[#00DBBC29] px-4 py-2 rounded-sm"
              : "text-foreground"
          }`}
        >
          {amount} {symbol}
        </p>
      </div>
    </div>
  );
}