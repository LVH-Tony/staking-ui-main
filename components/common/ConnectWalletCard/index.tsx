"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet } from "lucide-react";
import WalletConnectInfo from "./WalletConnectInfo";
import { useApi } from "@/contexts/api";
import { useState, useEffect } from "react";

export default function ConnectWalletCard() {
  const {
    connectWallet,
    state: { apiState },
    resetApiState,
  } = useApi();

  const [mounted, setMounted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionTimeout, setConnectionTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const MAX_CONNECTION_ATTEMPTS = 3;
  const CONNECTION_TIMEOUT_MS = 30000; // 30 seconds instead of 10

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle connection state changes
  useEffect(() => {
    if (mounted) {
      const connecting = ["CONNECT_INIT", "CONNECTING"].includes(
        apiState || "",
      );
      setIsConnecting(connecting);

      // If we're connecting, set a timeout to reset the state if it gets stuck
      if (connecting) {
        // Clear any existing timeout
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
        }

        // Set a new timeout to reset the state after CONNECTION_TIMEOUT_MS
        const timeout = setTimeout(() => {
          if (["CONNECT_INIT", "CONNECTING"].includes(apiState || "")) {
            console.log(
              `Connection timeout after ${
                CONNECTION_TIMEOUT_MS / 1000
              } seconds - attempt ${
                connectionAttempts + 1
              }/${MAX_CONNECTION_ATTEMPTS}`,
            );

            // Increment connection attempts
            setConnectionAttempts((prev) => prev + 1);

            // Only reset if we've exceeded max attempts
            if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS - 1) {
              console.log("Max connection attempts reached, resetting state");
              resetApiState();
              setIsConnecting(false);
              setConnectionAttempts(0);
            } else {
              // Try to reconnect
              console.log("Attempting to reconnect...");
              connectWallet();
            }
          }
        }, CONNECTION_TIMEOUT_MS);

        setConnectionTimeout(timeout);
      } else if (apiState === "READY") {
        // Connection successful, reset attempts counter
        setConnectionAttempts(0);

        // Clear timeout if we're not connecting
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          setConnectionTimeout(null);
        }
      } else if (apiState === "ERROR") {
        // Handle error state
        console.error("Connection error occurred");
        setIsConnecting(false);

        // Clear timeout
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          setConnectionTimeout(null);
        }
      }
    }

    // Cleanup function
    return () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
    };
  }, [mounted, apiState, resetApiState, connectionAttempts, connectWallet]);

  // Render a consistent structure for both server and client
  return (
    <Card>
      <div className="max-w-[400px] mx-auto p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-primary/10 p-4 rounded-lg mb-4">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-2">Welcome!</h2>
            <p className="text-muted-foreground">
              Connect your wallet to get started with TrustedStake
            </p>
          </div>
        </div>

        <CardContent className="space-y-6 p-0">
          <Button
            className="w-full flex items-center justify-center gap-2 py-5 px-4 rounded-lg text-lg font-medium h-[60px]"
            onClick={mounted ? connectWallet : undefined}
            disabled={!mounted || isConnecting}
            size="lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Connecting...{" "}
                {connectionAttempts > 0
                  ? `(Attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})`
                  : ""}
              </>
            ) : (
              "Connect Your Wallet"
            )}
          </Button>

          <div className="pt-6 border-t border-border">
            <WalletConnectInfo />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
