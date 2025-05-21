"use client";
import React, { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PercentageSlider = ({
  value,
  onValueChange = () => {},
  min = 0,
  max = 100,
  step = 0.1,
}: {
  value: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [isEditing, value]);

  const updatePercentage = (newValue: number) => {
    // Handle edge cases
    if (isNaN(newValue)) newValue = min;
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;

    // Round to 1 decimal place
    const roundedValue = Math.round(newValue * 10) / 10;
    onValueChange(roundedValue);
    setInputValue(roundedValue);
  };

  const handleSliderChange = (newValue: number[]) => {
    updatePercentage(newValue[0]);
  };

  const handleSpanClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    setInputValue(newValue);
  };

  const handleInputBlur = () => {
    setInputValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      updatePercentage(inputValue);
      setIsEditing(false);
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue(value);
    }
  };

  return (
    <div className="flex items-center space-x-4 justify-center w-full">
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={handleSliderChange}
      />
      <TooltipProvider>
        <Tooltip open={isEditing ? true : undefined} delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="text-right flex items-center justify-end gap-1 cursor-pointer">
              {isEditing ? (
                <input
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onKeyDown={handleKeyDown}
                  className="w-[3.75rem] h-8 px-1 border border-input rounded text-right bg-background text-foreground"
                  autoFocus
                />
              ) : (
                <span
                  className="flex items-center justify-end text-lg font-medium cursor-pointer text-foreground"
                  onClick={handleSpanClick}
                >
                  {value}
                </span>
              )}
              <span className="text-lg text-foreground" onClick={handleSpanClick}>
                %
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {isEditing ? "Press Enter to save, Esc to cancel" : "Click to edit"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default PercentageSlider;
