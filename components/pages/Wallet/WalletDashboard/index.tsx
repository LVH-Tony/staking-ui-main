"use client";

import {
  Wallet,
  LucideIcon,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Award,
  Shield,
  Users,
  FileText,
  ChevronRight,
  Info
} from "lucide-react";
import WalletInfo from "../WalletInfo";
import type { PlatformStats } from "@/types/platform";
import { useState, useEffect } from "react";
import { formatBalance } from "@/utils";
import { useTaoPrice } from "@/hooks/useTaoPrice";
import { useTheme } from "next-themes";

export default function WalletDashboard() {
  const { price: taoPrice } = useTaoPrice();
  const [showPdfModal, setShowPdfModal] = useState(false);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Use a state to track if we're on the client side
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true after component mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which logo files to use based on theme
  const logoSrc = mounted && theme === "dark"
    ? "/TrustedStake - LOGO B2 full-trans2.png"
    : "/TrustedStakeLOGO.png";
    
  // Also handle the favicon logo in the header
  const faviconSrc = mounted && theme === "dark"
    ? "/Favicon A_Favicon Square F1 B - trans.png" 
    : "/logo.jpg";

  // Use mock data for now
  const mockPlatformStats: PlatformStats = {
    totalValueLocked: 0,
    multiSigSigners: 3,
    securityAuditCount: 1,
    activeProxies: 0,
    successfulOperations: 0,
    averageApy: 0,
    totalRewardsDistributed: 0,
  };

  // If we're not on the client side yet, render a placeholder
  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div>
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
            </div>
          </div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div>
                  <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <img src={faviconSrc} alt="Logo" className="h-16 w-16" />
          <div className="text-center">
            <img
              src={logoSrc}
              alt="TrustedStake Logo"
              className="h-6 w-auto object-contain mx-auto"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Your secure gateway to Bittensor staking
            </p>
          </div>
        </div>
      </div>

      {/* Value Proposition Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h2 className="font-medium text-gray-800 dark:text-gray-200">Welcome to TrustedStake</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xl">
            Stake your TAO once → TrustedStake routes it to the highest‑yield, blue chip subnets, monitors dTAO incentives 24/7 and re‑balances automatically. 
            </p>
          </div>
          <button 
            onClick={() => setShowPdfModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            <FileText className="mr-2 h-4 w-4" />
            Why Hold in dTAO?
          </button>
        </div>
      </div>

      {/* Stats Cards - Original Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm dark:shadow-md dark:shadow-gray-900/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
              <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold dark:text-gray-200">Performance</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Consistent returns</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Root APY</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                24.65%+
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Alpha APY</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                138.29%+
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total TAO Managed</span>
              <div className="flex flex-col items-end">
                <div className="font-medium dark:text-gray-200">
                  {formatBalance(5316.197)} τ
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  ${((5316.197 * (taoPrice || 0))).toLocaleString(undefined, {maximumFractionDigits: 0})}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm dark:shadow-md dark:shadow-gray-900/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="font-semibold dark:text-gray-200">Active Users</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Growing community</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Proxies</span>
              <span className="font-medium dark:text-gray-200">
                -
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Operations</span>
              <span className="font-medium dark:text-gray-200">
                -
              </span>
            </div>
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span>Hands-free management</span>
              <Info className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm dark:shadow-md dark:shadow-gray-900/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="font-semibold dark:text-gray-200">Platform Security</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enterprise-grade protection
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Geo-Distributed Multi-Sig</span>
              <span className="font-medium dark:text-gray-200">
                {mockPlatformStats.multiSigSigners} Signers
              </span>
            </div>
            <div className="flex items-start justify-between text-sm">
              <div className="text-gray-600 dark:text-gray-400 pr-2">
                Your keys never leave your wallet; we interact through the proxy pallet only when you sign.
              </div>
            </div>
            <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
              <a 
                href="https://trustedstake.gitbook.io/trustedstake/basics/editor" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline flex items-center"
              >
                <span>Non-custodial security</span>
                <ChevronRight className="h-3 w-3 ml-1" />
              </a>
              <Info className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* PDF Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-4xl w-full h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h3 className="font-semibold text-lg dark:text-gray-200">Why Hold in dTAO?</h3>
              <button 
                onClick={() => setShowPdfModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-2 bg-white dark:bg-gray-800">
              <iframe 
                src="/holding-dtao.pdf" 
                className="w-full h-full border-0"
                title="Why Hold in dTAO?"
              />
            </div>
            <div className="p-4 border-t dark:border-gray-700 flex justify-between items-center">
              <a 
                href="/holding-dtao.pdf" 
                download 
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
              >
                <FileText className="w-4 h-4 mr-1" />
                Download PDF
              </a>
              <button 
                onClick={() => setShowPdfModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 dark:shadow-md dark:shadow-gray-900/10">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Strat Service</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Our flagship service, chose a profile that fits your needs, and we'll maximize your earnings while mitigating loss.
          </p>
          <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
            <span>Max APY, zero micromanaging.</span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 dark:shadow-md dark:shadow-gray-900/10">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Self Service</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Prefer full control? Use our tools to delegate, track, swap and harvest rewards yourself.
          </p>
          <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
            <span>Free, full transparency and control. No proxy required.</span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 dark:shadow-md dark:shadow-gray-900/10">
          <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">How It Works</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Connect wallet → optional "Activate Proxy" for hands‑free optimization and management.
Watch rewards grow; deactivate proxy, withdraw or swap any time.
          </p>
          <a 
            href="https://trustedstake.ai/research"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 flex items-center hover:underline"
          >
            <span>Learn more about dTAO</span>
            <ChevronRight className="h-3 w-3 ml-1" />
          </a>
        </div>
      </div>

      {/* Original Wallet Info Section - Preserved */}
      <div className="mt-3">
        <WalletInfo />
      </div>
    </div>
  );
}
