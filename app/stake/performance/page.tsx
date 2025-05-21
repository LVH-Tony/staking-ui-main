"use client";

import React from "react";
import { useStaking } from "@/hooks/useStaking";
import { useApi } from "@/contexts/api";
import WalletConnectMessage from "@/components/common/WalletConnectMessage";
import { motion } from "framer-motion";

// Create a TradingView widget component
const TradingViewWidget = () => {
  React.useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      const tv = (window as any).TradingView;
      if (tv) {
        new tv.widget({
          autosize: true,
          symbol: "MEXC:TAOUSDT",
          interval: "D",
          timezone: "Etc/UTC",
          theme: "light",
          style: "1",
          locale: "en",
          enable_publishing: false,
          allow_symbol_change: false,
          container_id: "tradingview_chart",
          studies: [
            "MASimple@tv-basicstudies",
            "VWAP@tv-basicstudies",
            "RSI@tv-basicstudies",
            "Volume@tv-basicstudies",
          ],
          toolbar_bg: "#f1f3f6",
          hide_side_toolbar: false,
          details: true,
          hotlist: false,
          calendar: false,
          show_popup_button: true,
          popup_width: "1000",
          popup_height: "650",
          save_image: true,
          backgroundColor: "white",
          gridColor: "#F0F3FA",
          hide_legend: false,
          enabled_features: [
            "use_localstorage_for_settings",
            "create_volume_indicator_by_default",
          ],
          disabled_features: [
            "header_symbol_search",
            "symbol_search_hot_key",
            "header_compare",
          ],
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div id="tradingview_chart" style={{ height: "100%", width: "100%" }} />
  );
};

export default function PerformancePage() {
  const {
    state: { currentAccount },
  } = useApi();

  if (!currentAccount) return <WalletConnectMessage />;

  // TODO: Add back the chart when we have the data

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background with gradient and subtle grid pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 bg-[url('/performance-bg.svg')] bg-cover bg-center opacity-80 blur-sm" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <h1 className="mb-6 text-5xl font-bold text-white sm:text-6xl">
            Performance Analytics
          </h1>
          <p className="mb-8 text-xl text-gray-300">
            We're working on something amazing. Stay tuned for detailed
            performance metrics and analytics.
          </p>

          {/* Animated tech elements */}
          <div className="relative h-64 w-64">
            <motion.div
              className="absolute left-1/2 top-1/2 h-32 w-32 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 h-24 w-24 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20"
              animate={{
                scale: [1.2, 1, 1.2],
                rotate: [360, 0, 360],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 h-16 w-16 rounded-full bg-gradient-to-r from-pink-500/20 to-blue-500/20"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [180, 360, 180],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          {/* Subtle tech elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-blue-500/30 animate-pulse" />
              <div className="absolute top-1/3 right-1/3 w-3 h-3 rounded-full bg-purple-500/30 animate-pulse delay-75" />
              <div className="absolute bottom-1/4 right-1/4 w-2 h-2 rounded-full bg-pink-500/30 animate-pulse delay-150" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
