"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/contexts/accounts";
import { useApi } from "@/contexts/api";
import CustomSelect from "@/components/common/CustomSelect";
import ConnectWalletCard from "@/components/common/ConnectWalletCard";
import { useState } from "react";
import { Wallet, Shield, CreditCard, User, Coins } from "lucide-react";
import { PROXY_TRUSTED_STAKE } from "@/constants/shared";
import { ISubmittableResult } from "@polkadot/types/types";
import { DispatchError } from "@polkadot/types/interfaces";
import { truncateAddress } from "@/utils";
import { TxStatus } from "@/types";
import ClickToCopy from "@/components/common/ClickToCopy";
import LoadingOverlay from "@/components/common/LoadingOverlay";

const truncateWalletName = (name: string, maxLength: number = 30) => {
  if (name.length <= maxLength) return name;
  const start = name.substring(0, maxLength);
  return `${start}...`;
};

export const AccountSelector = ({
  accounts,
  currentAddress,
  onSelect,
}: {
  accounts: any[];
  currentAddress: string;
  onSelect: (address: string) => void;
}) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
    </div>
    <CustomSelect
      placeholder="Select/Search Wallet"
      options={accounts?.map(({ address, meta }) => ({
        label: truncateWalletName(meta.name),
        value: address,
        title: meta.name,
      }))}
      value={currentAddress}
      setValue={onSelect}
      className="pl-10"
    />
  </div>
);

const WalletDetails = ({
  walletAddress,
  walletName,
  balance,
  proxyOn,
}: {
  walletAddress: string;
  walletName: string;
  balance: string | number;
  proxyOn?: boolean;
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Wallet Details
            </h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Address</p>
              <div className="flex items-center justify-between gap-2 bg-white/80 dark:bg-gray-800/80 p-2 rounded-lg">
                <code
                  className="text-sm font-mono text-gray-700 dark:text-gray-300"
                  title={walletAddress}
                >
                  {truncateAddress(walletAddress)}
                </code>
                <ClickToCopy text={walletAddress} />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Name</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{walletName}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-5 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-lg">
              <Coins className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Balance & Status
            </h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Available Balance</p>
              <p className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
                {balance} <span className="text-sm text-gray-500 dark:text-gray-400">τ</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Proxy Status</p>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    proxyOn ? "bg-emerald-500" : "bg-gray-400 dark:bg-gray-600"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    proxyOn ? "text-emerald-600 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {proxyOn ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MINIMUM_PROXY_ACTIVATION_BALANCE = 0.093; // TAO
const SUBTENSOR_PROXY_RUNTIME_LINK = "https://github.com/opentensor/subtensor/blob/6b86ebf30d3fb83f9d43ed4ce713c43204394e67/runtime/src/lib.rs#L640";

export default function WalletInfo() {
  const {
    state: { balance, proxied },
    fetchInfo,
  } = useAccount();

  const {
    setCurrentAccount,
    state: { api, accounts, currentAccount, currentSigner, apiState },
  } = useApi();

  const [pending, setPending] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus>({});

  const walletAddress = currentAccount?.address;
  const currentAccountDetails = accounts?.find(
    (acc) => acc?.address == walletAddress,
  );
  const walletName = currentAccountDetails?.meta?.name || "N/A";

  const handleAccountSelect = (address: string) => {
    const selectedAccount = accounts?.find((acc) => acc?.address == address);
    setCurrentAccount(selectedAccount);
  };

  const txResHandler = (res: ISubmittableResult) => {
    const { status, events, dispatchError } = res;
    setTxStatus({
      visible: true,
      type: "info",
      message: `Transaction status: ${status.type}`,
    });

    if (status.isInBlock) {
      setTxStatus({
        visible: true,
        type: "info",
        message: `Transaction in block (#${status.asInBlock.toString()}). Finalizing...`,
      });
    }

    if (status.isFinalized) {
      console.log(
        `Transaction finalized at blockHash ${status.asFinalized.toString()}`
      );
      if (dispatchError) {
        let errorMsg = "Proxy activation failed.";
        if (dispatchError.isModule) {
          const decoded = api.registry.findMetaError(dispatchError.asModule);
          const { docs, name, section } = decoded;
          errorMsg = `Proxy activation failed: ${section}.${name}. ${docs.join(" ")}`;
          if (section === "balances" && name === "InsufficientBalance") {
            errorMsg = `Proxy activation failed: Insufficient balance. A temporary reserve of ${MINIMUM_PROXY_ACTIVATION_BALANCE} TAO is required. This amount is returned when the proxy is deactivated. For details, see: ${SUBTENSOR_PROXY_RUNTIME_LINK}`;
          }
        } else {
          errorMsg = `Proxy activation failed: ${dispatchError.toString()}`;
        }
        setTxStatus({
          visible: true,
          type: "error",
          message: errorMsg,
        });
      } else {
        const extrinsicSuccess = events.find(
          ({ event: { method } }) => method === "ExtrinsicSuccess"
        );
        if (extrinsicSuccess) {
          setTxStatus({
            visible: true,
            type: "success",
            message: "Proxy activation successful! Wallet info will refresh shortly.",
          });
          fetchInfo(api, currentAccount.address); // Refresh account info
        } else {
           setTxStatus({
            visible: true,
            type: "error",
            message: "Transaction finalized but outcome unclear. Please check your proxy status and balance.",
          });
        }
      }
      setPending(false);
    }
  };

  const txErrHandler = (err: any) => {
    let errorMsg = "An unexpected error occurred during the transaction process.";
    if (err instanceof Error) {
      if (err.message.includes("Extension context invalidated")) {
        errorMsg = "Wallet extension error: Context invalidated. Please check your extension (e.g., ensure it is unlocked and refresh the page) or try reconnecting your wallet.";
      } else if (err.message.toLowerCase().includes("cancelled")) { // More robust check for cancellation
        errorMsg = "Transaction cancelled.";
      } else if (err.message.includes("pending authorization")) {
        errorMsg = "Transaction authorization is pending. Please check your wallet extension.";
      } else {
        errorMsg = `Error: ${err.message}`;
      }
    } else if (typeof err === 'string') {
      errorMsg = err;
    }
    
    setTxStatus({
      visible: true,
      type: "error",
      message: errorMsg,
    });
    setPending(false);
  };

  const onStartProxy = () => {
    if (!api || !currentAccount) {
      setTxStatus({ visible: true, type: "error", message: "Wallet not connected or API not available." });
      return;
    }
    if (apiState !== 'READY') {
      setTxStatus({ visible: true, type: "error", message: "API is not ready. Please wait or reconnect." });
      return;
    }

    // Pre-flight balance check (balance is a number from useAccount)
    if (balance < MINIMUM_PROXY_ACTIVATION_BALANCE) {
      setTxStatus({
        visible: true,
        type: "warning", 
        message: `Insufficient TAO balance to activate proxy. You need at least ${MINIMUM_PROXY_ACTIVATION_BALANCE} TAO free for the temporary reserve fee. This fee is returned when you deactivate the proxy. Learn more: ${SUBTENSOR_PROXY_RUNTIME_LINK}`
      });
      return;
    }

    (async () => {
      setPending(true);
      setTxStatus({visible: true, type: 'info', message: 'Preparing proxy activation transaction...'});
      
      const tx = api.tx.proxy.addProxy(PROXY_TRUSTED_STAKE, "Staking", 0);

      try {
        setTxStatus({visible: true, type: 'info', message: 'Please approve the transaction in your wallet extension.'});
        await tx.signAndSend(walletAddress, { signer: currentSigner }, (result: ISubmittableResult) => {
          txResHandler(result);
        });
      } catch (err) {
        // This catch handles errors from the setup of signAndSend itself or if the promise rejects early.
        txErrHandler(err);
      }
    })();
  };

  const onStopProxy = () => {
    if (!api || !currentAccount) {
      setTxStatus({ visible: true, type: "error", message: "Wallet not connected or API not available." });
      return;
    }
    if (apiState !== 'READY') {
      setTxStatus({ visible: true, type: "error", message: "API is not ready. Please wait or reconnect." });
      return;
    }

    // Note: No balance check needed for deactivation, as it *returns* the reserved fee.
    (async () => {
      setPending(true);
      setTxStatus({visible: true, type: 'info', message: 'Preparing proxy deactivation transaction...'});
      const tx = api.tx.proxy.removeProxy(PROXY_TRUSTED_STAKE, "Staking", 0);
      try {
        setTxStatus({visible: true, type: 'info', message: 'Please approve the transaction in your wallet extension.'});
        await tx.signAndSend(walletAddress, { signer: currentSigner }, (result: ISubmittableResult) => {
          // Re-use txResHandler, but customize messages if needed or create a separate one for stopping.
          // For now, let's adapt messages in txResHandler or make it more generic.
          // For simplicity, txResHandler will need to be aware of context or be more generic.
          // Let's assume for now it can handle it, or make specific success/error messages for "deactivation".
          // The current txResHandler messages are somewhat specific to "activation". 
          // A quick adaptation for success:
          if (result.isFinalized && !result.dispatchError) {
            setTxStatus({
              visible: true,
              type: "success",
              message: "Proxy deactivation successful! Wallet info will refresh shortly.",
            });
            fetchInfo(api, currentAccount.address);
            setPending(false); // Also ensure pending is false here
          } else {
            txResHandler(result); // Let the main handler process other states/errors
          }
        });
      } catch (err) {
        txErrHandler(err);
      }
    })();
  };

  if (apiState !== "READY" && !currentAccount) return <ConnectWalletCard />;

  return (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-md">
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Wallet Information
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your wallet settings and view balance
          </p>
        </div>
      </div>

      <CardContent className="p-0 space-y-8">
        <div className="space-y-6">
          <AccountSelector
            accounts={accounts}
            currentAddress={walletAddress}
            onSelect={handleAccountSelect}
          />
          {currentAccount && (
            <WalletDetails
              walletAddress={walletAddress}
              walletName={walletName}
              balance={balance}
              proxyOn={proxied}
            />
          )}
        </div>

        {currentAccount && (
          <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
            <Button
              onClick={proxied ? onStopProxy : onStartProxy}
              disabled={pending}
              className={`w-full flex items-center justify-center gap-3 py-6 px-4 rounded-xl font-medium text-base transition-all duration-200 ${
                proxied
                  ? "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              }`}
            >
              <Shield className="w-5 h-5" />
              {proxied ? "Deactivate Proxy" : "Activate Proxy"}
            </Button>
            <LoadingOverlay
              isLoading={pending}
              message={txStatus.visible && pending ? txStatus.message : ""}
            />
            {txStatus.visible && !pending && txStatus.message && (
              <div
                className={`mt-4 p-3 rounded-md text-sm ${
                  txStatus.type === "error"
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    : txStatus.type === "warning"
                    ? "bg-yellow-100 dark:bg-yellow-700/30 text-yellow-700 dark:text-yellow-300"
                    : txStatus.type === "success"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" 
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                }`}
              >
                {txStatus.message.includes(SUBTENSOR_PROXY_RUNTIME_LINK) ? (
                  <>
                    {txStatus.message.substring(0, txStatus.message.indexOf(SUBTENSOR_PROXY_RUNTIME_LINK))}
                    <a 
                      href={SUBTENSOR_PROXY_RUNTIME_LINK} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline font-medium hover:text-opacity-80"
                    >
                      Learn more
                    </a>
                    {txStatus.message.substring(txStatus.message.indexOf(SUBTENSOR_PROXY_RUNTIME_LINK) + SUBTENSOR_PROXY_RUNTIME_LINK.length)}
                  </>
                ) : (
                  txStatus.message
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
