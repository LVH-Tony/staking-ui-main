"use client";

import { Toaster } from "sonner";
import { ApiContextProvider } from "@/contexts/api";
import { AccountContextProvider } from "@/contexts/accounts";
import SubnetAndValidatorProvider from "@/contexts/subnetsAndValidators";
import { GraphQLProvider } from "@/contexts/graphql";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import MainContent from "@/components/layout/MainContent";
import { SidebarProvider } from "@/contexts/sidebar";
import { Providers } from "@/components/providers/Providers";
import { useEffect } from "react";

import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Preload images after component mounts
  useEffect(() => {
    const imagesToPreload = [
      "/TrustedStakeLOGO.png",
      "/TrustedStake - LOGO B2 full-trans2.png",
      "/logo.jpg",
      "/Favicon A_Favicon Square F1 B - trans.png"
    ];
    
    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background">
        <Providers>
          <ApiContextProvider>
            <AccountContextProvider>
              <SubnetAndValidatorProvider>
                <SidebarProvider>
                  <div className="flex min-h-screen">
                    <Sidebar />
                    <div className="flex-1 min-w-0">
                      <Navbar />
                      <MainContent>
                        {children}
                      </MainContent>
                    </div>
                  </div>
                </SidebarProvider>
                <Toaster />
              </SubnetAndValidatorProvider>
            </AccountContextProvider>
          </ApiContextProvider>
        </Providers>
      </body>
    </html>
  );
}
