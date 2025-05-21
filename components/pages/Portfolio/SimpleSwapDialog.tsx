import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SimpleSwap from "@/components/pages/Stake/SimpleSwap";

interface SimpleSwapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SimpleSwapDialog({
  open,
  onOpenChange,
}: SimpleSwapDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-[800px] h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Simple Swap</DialogTitle>
        </DialogHeader>
        <SimpleSwap />
      </DialogContent>
    </Dialog>
  );
}
