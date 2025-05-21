"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TokenInfo {
  id: string; // e.g., "TAO" or "Subnet 1"
  name: string; // Display name, e.g., "TAO" or "Subnet 1"
  net_uid?: number; // Optional: Subnet ID if it's a subnet token
}

interface TokenGridSelectorProps {
  tokens: TokenInfo[];
  selectedToken: string; // The ID of the selected token
  onTokenSelect: (tokenId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  label?: string; // Optional label for the button
}

export function TokenGridSelector({
  tokens,
  selectedToken,
  onTokenSelect,
  disabled = false,
  placeholder = "Select token",
  label,
}: TokenGridSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleExpanded = () => {
    if (!disabled) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleTokenClick = (tokenId: string) => {
    if (!disabled) {
      onTokenSelect(tokenId);
      setIsExpanded(false);
    }
  };

  const selectedTokenInfo = tokens.find(token => token.id === selectedToken);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={toggleExpanded}
        disabled={disabled}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-12 text-foreground",
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-muted/50"
        )}
      >
        <span className="truncate">
          {label ? `${label}: ` : ''}
          {selectedTokenInfo ? selectedTokenInfo.name : placeholder}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 ml-2" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-2" />
        )}
      </button>

      {isExpanded && !disabled && (
        <div className="absolute z-50 mt-1 w-[600px] -translate-x-[calc(50%-88px)] right-0 sm:translate-x-0 sm:right-0 bg-background border border-input rounded-md shadow-lg">
          <div className="p-2 max-h-60 overflow-y-auto">
            <div className="grid grid-cols-8 gap-1.5">
              {tokens.map((token) => (
                <button
                  key={token.id}
                  onClick={() => handleTokenClick(token.id)}
                  className={cn(
                    "flex items-center justify-center px-1.5 py-1.5 rounded border text-xs font-medium transition-colors h-10 text-foreground",
                    selectedToken === token.id
                      ? "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300"
                      : "border-input hover:bg-muted/50"
                  )}
                  title={token.name}
                >
                  {selectedToken === token.id && <Check className="w-3 h-3 mr-1 flex-shrink-0" />}
                  <span className="truncate">{token.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 