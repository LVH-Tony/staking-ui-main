"use client";

import QueryProvider from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";
import FontProvider from "./FontProvider";
import { Inter, DM_Mono } from 'next/font/google';

// Font configurations
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const dmMono = DM_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
});

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <FontProvider inter={inter} dmMono={dmMono}>
          {children}
        </FontProvider>
      </QueryProvider>
    </ThemeProvider>
  );
} 