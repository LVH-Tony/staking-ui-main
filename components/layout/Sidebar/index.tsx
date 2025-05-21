"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Link as LinkIcon,
  User,
  LayoutDashboard,
  LineChart,
  History,
  Shield,
  BarChart,
  Rocket,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  FileText,
  ExternalLink,
  Coins,
} from "lucide-react";
import { useSidebar } from "@/contexts/sidebar";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// X/Twitter Icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    height="24"
    width="24"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const NAV_ITEMS = [
  {
    label: "Delegate",
    href: "/",
    icon: Shield,
  },
  {
    label: "Strat",
    href: "/strat",
    icon: Rocket,
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Statistics",
    href: "/statistics",
    icon: BarChart,
  },
  {
    label: "Stake",
    href: "/stake",
    icon: Coins,
  },
  {
    label: "Portfolio",
    href: "/portfolio",
    icon: User,
  },
  {
    label: "History",
    href: "/wallet/history",
    icon: History,
  },
  {
    label: "Performance",
    href: "/stake/performance",
    icon: LineChart,
  },
] as const;

const SUPPORT_LINKS = [
  {
    label: "Discord",
    href: "https://discord.gg/uzNJkvshv7",
    icon: MessageSquare,
    color: "text-indigo-500",
  },
  {
    label: "X / Twitter",
    href: "https://x.com/trustedstake",
    icon: XIcon,
    color: "text-muted-foreground dark:text-muted-foreground",
  },
  {
    label: "Documentation",
    href: "https://trustedstake.gitbook.io/trustedstake",
    icon: FileText,
    color: "text-blue-500",
  },
  {
    label: "Team",
    href: "https://trustedstake.ai/team",
    icon: User,
    color: "text-green-600",
  },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by mounting on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which logo to show based on theme
  const logoSrc = mounted && theme === "dark" 
    ? "/TrustedStake - LOGO B2 full-trans2.png" 
    : "/TrustedStakeLOGO.png";

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className="flex h-full flex-col">
        <div className={cn(
          "flex h-16 items-center border-b border-border",
          isCollapsed ? "justify-center px-5" : "justify-between px-5"
        )}>
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center py-4 pl-0 pr-4 rounded-lg hover:bg-accent/50 transition-all duration-200">
                <img
                  src={logoSrc}
                  alt="TrustedStake Logo"
                  className="h-12 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-200"
                />
              </div>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5 text-foreground" />
            ) : (
              <ChevronLeft className="h-5 w-5 text-foreground" />
            )}
          </button>
        </div>
        <nav className="flex-1 space-y-2 p-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg py-3 text-base font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent/50",
                  isCollapsed ? "justify-center px-3 w-full" : "space-x-4 px-4"
                )}
              >
                <item.icon className={cn(
                  "h-6 w-6 flex-shrink-0",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "transition-all duration-200 whitespace-nowrap",
                  isCollapsed ? "opacity-0 w-0" : "opacity-100 ml-4"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Support Links Section */}
        <div className={cn(
          "p-4 border-t border-border",
          isCollapsed ? "" : "mt-auto"
        )}>
          {!isCollapsed && (
            <div className="mb-2 px-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Need Help?</h3>
            </div>
          )}
          <div
            className={cn(
              "flex",
              isCollapsed
                ? "flex-col items-center space-y-4"
                : "flex-col space-y-2",
            )}
          >
            {SUPPORT_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/50",
                  isCollapsed ? "justify-center" : "space-x-3"
                )}
              >
                <link.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0",
                    link.color
                  )}
                />
                {!isCollapsed && (
                  <span className="text-muted-foreground transition-colors group-hover:text-foreground">
                    {link.label}
                  </span>
                )}
                {!isCollapsed && (
                  <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                )}
              </a>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
