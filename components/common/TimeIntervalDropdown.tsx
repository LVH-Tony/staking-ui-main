"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATS_TIMEFRAMES, StatsTimeframe } from "@/types/staking";

interface TimeIntervalDropdownProps {
  selectedInterval: StatsTimeframe;
  onIntervalSelect: (interval: StatsTimeframe) => void;
  disabled?: boolean;
}

export function TimeIntervalDropdown({
  selectedInterval,
  onIntervalSelect,
  disabled = false,
}: TimeIntervalDropdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const toggleExpanded = () => {
    if (!disabled) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleIntervalClick = (interval: StatsTimeframe) => {
    if (!disabled) {
      onIntervalSelect(interval);
      setIsExpanded(false);
    }
  };

  const timeframesArray = Object.values(STATS_TIMEFRAMES);

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      <button
        onClick={toggleExpanded}
        disabled={disabled}
        className={cn(
          "flex items-center justify-between w-full sm:w-32 px-3 py-2 bg-background border border-input rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-accent/50"
        )}
      >
        <span className="truncate">
          {selectedInterval.charAt(0).toUpperCase() +
            selectedInterval.slice(1)}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 ml-2" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-2" />
        )}
      </button>

      {isExpanded && !disabled && (
        <div className="absolute z-50 mt-1 w-full sm:w-32 right-0 bg-background border border-border rounded-md shadow-lg">
          <div className="p-1">
            {timeframesArray.map((interval) => (
              <button
                key={interval}
                onClick={() => handleIntervalClick(interval)}
                className={cn(
                  "w-full text-left px-3 py-1.5 rounded-md text-sm flex items-center",
                  selectedInterval === interval
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-accent/50"
                )}
              >
                {selectedInterval === interval && (
                  <Check className="w-4 h-4 mr-2 text-primary" />
                )}
                {interval.charAt(0).toUpperCase() + interval.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 