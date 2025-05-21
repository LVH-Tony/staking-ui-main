"use client";

import React from "react";
import { useStaking } from "@/hooks/useStaking";
import { useApi } from "@/contexts/api";
import WalletConnectMessage from "@/components/common/WalletConnectMessage";
import { motion } from "framer-motion";
import Image from "next/image";
import { DM_Mono } from "next/font/google";

const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  display: "swap",
});

const textVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const letterVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 12,
      stiffness: 200,
    },
  },
};

export default function StratPage() {
  const {
    state: { currentAccount },
  } = useApi();

  if (!currentAccount) return <WalletConnectMessage />;

  return (
    <div
      className={`${dmMono.className} relative min-h-screen w-full overflow-hidden`}
    >
      {/* Background with gradient and subtle grid pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="absolute inset-0 bg-[url('/strat-bg.svg')] bg-cover bg-center opacity-80 blur-sm" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]" />

        {/* Greek symbols grid */}
        <div className="absolute inset-0 grid grid-cols-[repeat(auto-fill,4rem)] grid-rows-[repeat(auto-fill,4rem)] w-[calc(100%+4rem)] h-full -translate-x-2">
          {Array.from({ length: 500 }).map((_, i) => {
            const symbols = [
              "α",
              "β",
              "γ",
              "δ",
              "ε",
              "ζ",
              "η",
              "θ",
              "ι",
              "κ",
              "λ",
              "μ",
              "ν",
              "ξ",
              "ο",
              "π",
              "ρ",
              "σ",
              "τ",
              "υ",
              "φ",
              "χ",
              "ψ",
              "ω",
            ];
            const symbol = symbols[i % symbols.length];
            const delay = Math.random() * 4;
            return (
              <div
                key={i}
                className="flex items-center justify-center text-gray-400/20 w-16 h-16"
                style={{
                  animation: `glow 8s infinite ${delay}s ease-in-out`,
                }}
              >
                <span className="text-2xl">{symbol}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add the glow animation keyframes */}
      <style jsx global>{`
        @keyframes glow {
          0%,
          100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.1);
          }
        }
      `}</style>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 flex justify-center"
          >
            <div className="relative h-24 w-24 md:h-32 md:w-32">
              <Image
                src="/Favicon A_Favicon Square F1 B - trans.png"
                alt="Strat Logo"
                fill
                className="object-contain drop-shadow-lg"
                priority
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <motion.h1
              variants={textVariants}
              initial="hidden"
              animate="visible"
              className="mb-4 text-4xl font-light text-white sm:text-5xl tracking-tight"
            >
              {"strat".split("").map((letter, index) => (
                <motion.span
                  key={index}
                  variants={letterVariants}
                  className="relative inline-block"
                >
                  <span className="relative z-10">{letter}</span>
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-md"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.span>
              ))}
            </motion.h1>
            <div className="space-y-2">
              <p className="text-xl text-gray-300">
                Advanced TAO allocation protocol
              </p>
              <p className="text-lg text-gray-400 max-w-lg mx-auto">
                Maximizing returns while mitigating value loss all while
                enhancing network health.
              </p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-6"
              >
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                  <span className="text-blue-400 font-medium">Coming Soon</span>
                </div>
              </motion.div>
            </div>
          </motion.div>

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
