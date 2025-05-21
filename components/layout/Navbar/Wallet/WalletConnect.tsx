"use client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import WalletConnectInfo from "@/components/common/ConnectWalletCard/WalletConnectInfo";
import { AccountSelector } from "@/components/pages/Wallet/WalletInfo";
import { useApi } from "@/contexts/api";
import ClickToCopy from "@/components/common/ClickToCopy";
import { truncateAddress } from "@/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface IProps {
  connectWallet: () => void;
  disconnectWallet: () => void;
  isConnected: boolean;
  isConnecting: boolean;
}

export default function WalletConnect({
  connectWallet,
  disconnectWallet,
  isConnected,
  isConnecting,
}: IProps) {
  const {
    setCurrentAccount,
    state: { accounts, currentAccount },
  } = useApi();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = mounted && theme === "dark"
    ? "/TrustedStake - LOGO B2 full-trans2.png"
    : "/TrustedStakeLOGO.png";

  const handleAccountSelect = (address: string) => {
    const selectedAccount = accounts?.find((acc) => acc?.address == address);
    setCurrentAccount(selectedAccount);
  };

  const walletAddress = currentAccount?.address;
  return (
    <>
      <div className="text-center pb-3 mb-4 border-b border-gray-200 dark:border-gray-700">
        <img
          src={logoSrc}
          alt="TrustedStake Logo"
          className="h-5 w-auto object-contain mx-auto"
        />
      </div>

      {/* Connect wallet button */}
      {isConnected ? (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-gray-400 dark:text-gray-300 mb-2">Select Wallet: </p>
            <AccountSelector
              accounts={accounts}
              currentAddress={walletAddress}
              onSelect={handleAccountSelect}
            />
            <div className="flex items-center gap-1 text-sm text-gray-800 dark:text-gray-200">
              <span className="font-semibold"> Address: </span>
              <span
                className="py-2 font-mono flex gap-1 items-center"
                title={walletAddress}
              >
                {truncateAddress(walletAddress, 6)}
                <ClickToCopy text={walletAddress} />
              </span>
            </div>
          </div>

          <Button
            className="w-full"
            size="sm"
            variant="destructive"
            onClick={disconnectWallet}
          >
            Disconnect Wallet
          </Button>
        </div>
      ) : (
        <Button
          className="w-full"
          size="sm"
          onClick={connectWallet}
          disabled={isConnecting}
        >
          {isConnecting && <Loader2 className="animate-spin" />}
          Connect Wallet
        </Button>
      )}
      {!isConnected && <WalletConnectInfo />}
    </>
  );
}
