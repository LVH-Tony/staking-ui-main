import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Home, User, Link as LinkIcon } from "lucide-react";
import { useTheme } from "next-themes";
import Wallet from "./Wallet";
import Link from "next/link";
import NavbarStats from "./NavbarStats";
import { useSidebar } from "@/contexts/sidebar";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/common/ThemeToggle";

const NAV_ITEMS = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },
  {
    label: "Stake",
    href: "/stake",
    icon: LinkIcon,
  },
  {
    label: "Portfolio",
    href: "/portfolio",
    icon: User,
  },
] as const;

export default function Navbar() {
  const { isCollapsed } = useSidebar();
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering theme-dependent components after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate left padding: 80px (sidebar width) + 16px (buffer) when collapsed
  // 256px (sidebar width) + 16px (buffer) when expanded
  const leftPadding = isCollapsed ? "96px" : "272px";

  return (
    <nav className="w-full bg-card border-b border-border px-4 py-3">
      <div 
        className={cn(
          "flex justify-between items-center w-full ml-auto transition-all duration-300 gap-4",
        )}
        style={{ paddingLeft: leftPadding }}
      >
        <NavbarStats />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Wallet />
        </div>
      </div>
    </nav>
  );
}
