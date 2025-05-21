import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import Link from "next/link";

interface WalletConnectMessageProps {
  className?: string;
}

export default function WalletConnectMessage({
  className = "mt-4",
}: WalletConnectMessageProps) {
  return (
    <div className={className}>
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle className="font-semibold">Wallet Not Connected</AlertTitle>
        <AlertDescription>
          Please click{" "}
          <Link href="/" className="text-primary underline cursor-pointer">
            here
          </Link>{" "}
          to connect your wallet and access this page.
        </AlertDescription>
      </Alert>
    </div>
  );
}
