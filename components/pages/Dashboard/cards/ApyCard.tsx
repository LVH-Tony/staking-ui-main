import { LineChart } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ApyCardProps {
  apy: number;
}

export function ApyCard({ apy }: ApyCardProps) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <LineChart className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">APY</h2>
            <p className="text-sm text-muted-foreground">Annual percentage yield</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-2">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-primary">
            {apy > 0 ? `${apy.toFixed(2)}%` : "-"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
