import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { TrashIcon, Undo2Icon, ListPlus } from "lucide-react";
import { StakingDest, Subnet } from "@/types";
import PercentageSlider from "@/components/common/PercentageSlider";

interface StakingDestsProps {
  dests: StakingDest[];
  subnets: Subnet[];
  onDelete: (index: number) => void;
  onPercentageChange: (index: number, value: number) => void;
}

export const StakingDests = ({
  dests,
  onDelete,
  onPercentageChange,
  subnets,
}: StakingDestsProps) => {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <h3 className="font-semibold text-foreground p-4 border-b border-border">Distribution</h3>
      <Table>
        <TableBody>
          {dests?.map(({ net_uid, validatorName, percentage }, index) => {
            const subnet = subnets?.find((net) => net.net_uid === net_uid);
            const subnetName = subnet?.custom_display_name || subnet?.name || "Unknown";
            const subnetSymbol = subnet?.symbol || "α";
            
            return (
              <TableRow key={index} className="hover:bg-muted/50">
                <TableCell className="max-w-1/3">
                  <div className="flex flex-row gap-2">
                    <div className="flex flex-col items-start gap-2">
                      <p className="text-sm leading-18 tracking-tight text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full px-3 py-1.5 shadow-sm">
                        {`${subnetName} // ${validatorName}`}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="w-2/3 p-0">
                  <div className="flex items-center gap-3 w-full px-2">
                    <div className="min-w-[40px] flex justify-center">
                      <div className="px-2.5 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-100 dark:border-blue-900/50 rounded-md text-xs font-semibold text-blue-700 dark:text-blue-300 shadow-sm">
                        {subnetSymbol}
                      </div>
                    </div>
                    <PercentageSlider
                      value={percentage}
                      onValueChange={(value) =>
                        onPercentageChange(index, value)
                      }
                    />
                    <div className="min-w-[45px] text-right">
                      <span className="text-xs font-medium text-foreground">{percentage}%</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="flex items-center justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(index)}
                    className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                  >
                    <TrashIcon className="h-4 w-4 text-red-500 dark:text-red-400" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

interface ActionButtonsProps {
  onReset: () => void;
  onNext: () => void;
  show: boolean;
  disableNextButton?: boolean;
}

export const ActionButtons = ({
  onReset,
  onNext,
  disableNextButton = false,
  show,
}: ActionButtonsProps) => {
  if (!show) return null;
  return (
    <div className="flex justify-between">
      <Button variant="outline" onClick={onReset}>
        Reset
        <Undo2Icon className="h-4 w-4" />
      </Button>
      <Button onClick={onNext} disabled={disableNextButton}>
        Next
        <ListPlus className="h-4 w-4" />
      </Button>
    </div>
  );
};
