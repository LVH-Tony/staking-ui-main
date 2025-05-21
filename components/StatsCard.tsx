import React from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string;
  subValue?: string;
  loading?: boolean;
  icon?: LucideIcon;
}

export const StatsCard = ({
  title,
  value,
  subValue,
  loading = false,
  icon: Icon,
}: StatsCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {Icon && <Icon className="w-5 h-5 text-muted-foreground/70" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-2">
          <p className="text-2xl font-semibold">
            {loading ? (
              <span className="flex items-center space-x-1">
                <span className="animate-pulse">.</span>
                <span className="animate-pulse [animation-delay:0.2s]">.</span>
                <span className="animate-pulse [animation-delay:0.4s]">.</span>
              </span>
            ) : (
              value
            )}
          </p>
          {subValue && (
            <p className="text-sm text-muted-foreground">
              {loading ? (
                <span className="flex items-center space-x-1">
                  <span className="animate-pulse">.</span>
                  <span className="animate-pulse [animation-delay:0.2s]">.</span>
                  <span className="animate-pulse [animation-delay:0.4s]">.</span>
                </span>
              ) : (
                subValue
              )}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
