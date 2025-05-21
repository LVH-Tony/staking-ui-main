"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/sidebar";

export default function MainContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebar();

  return (
    <main className={cn(
      "p-6 transition-all duration-300 bg-background",
      isCollapsed ? "pl-[100px]" : "pl-[272px]"
    )}>
      {children}
    </main>
  );
}
