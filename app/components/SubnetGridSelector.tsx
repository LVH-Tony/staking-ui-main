"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubnetGridSelectorProps {
  subnets: any[];
  selectedSubnet: number | null;
  onSubnetSelect: (netUid: number | null) => void;
  disabled?: boolean;
}

export function SubnetGridSelector({
  subnets,
  selectedSubnet,
  onSubnetSelect,
  disabled = false,
}: SubnetGridSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter out root subnet (0) and sort by netuid
  const nonRootSubnets = subnets
    .filter((subnet) => subnet.net_uid !== 0)
    .sort((a, b) => a.net_uid - b.net_uid);

  const toggleExpanded = () => {
    if (!disabled) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSubnetClick = (netUid: number) => {
    if (!disabled) {
      onSubnetSelect(selectedSubnet === netUid ? null : netUid);
    }
  };

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      <button
        onClick={toggleExpanded}
        disabled={disabled}
        className={cn(
          "flex items-center justify-between w-full sm:w-44 px-3 py-2 bg-background border border-input rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-accent/50"
        )}
      >
        <span className="truncate">
          {selectedSubnet === null ? "All Subnets" : `Subnet ${selectedSubnet}`}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 ml-2" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-2" />
        )}
      </button>

      {isExpanded && !disabled && (
        <div className="absolute z-50 mt-1 w-[800px] -translate-x-[calc(50%-88px)] right-0 sm:translate-x-0 sm:-right-4 bg-background border border-border rounded-md shadow-lg">
          <div className="p-2">
            <button
              onClick={() => {
                onSubnetSelect(null);
                setIsExpanded(false);
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 rounded-md text-sm mb-1.5",
                selectedSubnet === null
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-accent/50"
              )}
            >
              <div className="flex items-center">
                {selectedSubnet === null && (
                  <Check className="w-4 h-4 mr-2 text-primary" />
                )}
                <span className="font-medium">All Subnets</span>
              </div>
            </button>

            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
              {nonRootSubnets.map((subnet) => (
                <button
                  key={subnet.net_uid}
                  onClick={() => {
                    handleSubnetClick(subnet.net_uid);
                    setIsExpanded(false);
                  }}
                  className={cn(
                    "flex items-center justify-center px-2 py-2 rounded border text-sm font-medium transition-colors",
                    selectedSubnet === subnet.net_uid
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "border-border hover:bg-accent/50"
                  )}
                >
                  {subnet.net_uid}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
