"use client";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UNIT } from "@/constants/shared";
import { useApi } from "@/contexts/api";
import { useSubnetAndValidators } from "@/contexts/subnetsAndValidators";
import { StakingDest, TxStatus } from "@/types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

interface IProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  stakingDests: StakingDest[];
  delegatedAmount: number;
}

export default function StakingSummary({
  open,
  setOpen,
  stakingDests,
  delegatedAmount,
}: IProps) {
  const router = useRouter();
  const {
    state: { api, currentAccount, currentSigner },
  } = useApi();

  const [pending, setPending] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus>({
    visible: false,
    type: "info",
    message: "",
  });
  const { getSubnetById } = useSubnetAndValidators();

  const onConfirm = async () => {
    if (!api) return;
    setPending(true);
    setOpen(false);
    try {
      const calls = stakingDests.map(({ hotkey, net_uid, percentage }) =>
        api.tx.subtensorModule.addStake(
          hotkey,
          net_uid,
          Math.floor(((delegatedAmount * percentage) / 100) * UNIT),
        ),
      );
      const tx = api.tx.utility.batch(calls);
      await submitTx(tx);
    } catch (error) {}
  };

  const submitTx = async (tx: any) => {
    try {
      tx.signAndSend(
        currentAccount.address,
        { signer: currentSigner, withSignedTransaction: true },
        txResHandler,
      ).catch(txErrHandler);
    } catch (e) {
      txErrHandler(e);
    }
  };

  const txResHandler = ({ status, events }: any) => {
    setTxStatus({
      visible: true,
      type: "info",
      message: `Current transaction status: ${status.type}`,
    });
    if (status.isFinalized) {
      setPending(false);
      const isError =
        events.findIndex(
          (event: any) =>
            event.event.section.toString() === "system" &&
            event.event.method.toString() === "ExtrinsicFailed",
        ) !== -1;
      if (isError) {
        txErrHandler("Extrinsic failure");
        return;
      } else {
        toast("Success!", {
          position: "top-center",
          duration: 5000,
          icon: <CheckCircle className="text-green-500" />,
          className: "bg-green-100 text-green-900",
          action: {
            label: "Close",
            onClick: () => toast.dismiss(),
          },
        });
        router.push("/portfolio");
      }
    }
  };

  const txErrHandler = (err: any) => {
    setTxStatus({
      visible: true,
      type: "error",
      message: `😞 Transaction Failed: ${err.toString()}`,
    });
    setPending(false);
  };

  const onCancel = () => {
    setOpen(false);
  };

  const summaryData = stakingDests.map((dest) => {
    const subnet = getSubnetById(dest.net_uid);
    const subnetName = subnet?.name ?? "N/A";
    return {
      validatorName: dest.validatorName,
      subnetName,
      amountToStake: (delegatedAmount * (dest.percentage / 100)).toFixed(2),
    };
  });

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-[70vw] max-h-[80vh]"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Staking Details</DialogTitle>
            <DialogDescription>
              Please review the staking details before confirming.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[calc(80vh-200px)]">
            <Table className="max-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Subnet</TableHead>
                  <TableHead>Validator</TableHead>
                  <TableHead className="text-center">Amount to Stake</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryData.map((data, index) => (
                  <TableRow key={index + data.subnetName}>
                    <TableCell>{data.subnetName}</TableCell>
                    <TableCell>{data.validatorName}</TableCell>
                    <TableCell className="text-center">
                      {data.amountToStake} τ
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 hover:text-red-500 border-red-500"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={onConfirm}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LoadingOverlay
        isLoading={pending}
        message={txStatus.visible ? txStatus.message : ""}
      />
    </>
  );
}
