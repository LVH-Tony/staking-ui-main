"use client";
import { Check, Wallet as WalletIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import WalletConnect from "./WalletConnect";
import { useApi } from "@/contexts/api";
import { useEffect, useState } from "react";

export default function Wallet() {
  const {
    connectWallet,
    disconnectWallet,
    setCurrentAccount,
    state: { apiState, accounts, currentAccount },
  } = useApi();

  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    setShowCheck(apiState === "READY");
  }, [apiState]);

  const handleAccountSelect = (address: string) => {
    const selectedAccount = accounts?.find((acc) => acc?.address == address);
    setCurrentAccount(selectedAccount);
  };

  const isConnecting = ["CONNECT_INIT", "CONNECTING"].includes(apiState!);
  const isConnected = apiState === "READY";

  return (
    <>
      <Popover>
        <PopoverTrigger className="flex items-center gap-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 rounded-md px-4 text-sm">
          <WalletIcon className="h-5 w-5" />
          Wallet
          {showCheck && <Check className="h-4 w-4" />}
        </PopoverTrigger>
        <PopoverContent className="bg-white dark:bg-gray-800 text-black dark:text-white w-fit">
          <WalletConnect
            connectWallet={connectWallet}
            disconnectWallet={disconnectWallet}
            isConnected={isConnected}
            isConnecting={isConnecting}
          />
        </PopoverContent>
      </Popover>
    </>
  );
}
