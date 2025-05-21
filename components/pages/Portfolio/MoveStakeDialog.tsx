import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MoveStake from "@/components/pages/Stake/MoveStake";
import { StakingDest } from "@/types";

interface MoveStakeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prePopulatedValues: {
    subnet: number;
    hotkey: string;
  } | null;
}

export function MoveStakeDialog({
  open,
  onOpenChange,
  prePopulatedValues,
}: MoveStakeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-[800px] h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Move Stake</DialogTitle>
        </DialogHeader>
        <MoveStake prePopulatedValues={prePopulatedValues} />
      </DialogContent>
    </Dialog>
  );
}
