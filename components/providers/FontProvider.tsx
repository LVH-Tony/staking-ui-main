"use client";

import { usePathname } from "next/navigation";
import { Inter, DM_Mono } from "next/font/google";

interface FontProviderProps {
  children: React.ReactNode;
  inter: ReturnType<typeof Inter> & { variable: string };
  dmMono: ReturnType<typeof DM_Mono> & { variable: string };
}

export default function FontProvider({
  children,
  inter,
  dmMono,
}: FontProviderProps) {
  const pathname = usePathname();
  const isStratOrPerformancePage =
    pathname?.includes("/strat") || pathname?.includes("/performance");

  return (
    <div
      className={
        !isStratOrPerformancePage ? `${inter.variable} ${dmMono.variable}` : ""
      }
    >
      {children}
    </div>
  );
}
