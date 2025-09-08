// src/app/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";

import "@/styles/globals.css";

import { ThemeProvider } from "@/providers/ThemeProvider";
import { Web3Provider } from "@/providers/Web3Provider";
import Navbar from "@/components/layout/Navbar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "react-hot-toast";
import ClientOnly from "@/components/layout/ClientOnly";
import TxWatcher from "@/components/notifications/TxWatcher";
import { SafeProvider } from "@/providers/SafeProvider";

const inter = localFont({
  src: "./fonts/Inter-Variable.woff2", // ✅ relative to src/app/layout.tsx
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Dharitri pREWA Protocol",
  description: "The official dApp for the pREWA Protocol for staking, swapping, and liquidity.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.variable} bg-background text-foreground font-sans antialiased`}>
        <ThemeProvider>
          <ClientOnly>
            <Web3Provider>
              <SafeProvider>
                <TxWatcher />
                <div className="flex min-h-screen flex-col">
                  <Navbar />
                  <main id="main" className="flex-grow pt-22 pb-24 md:pt-18 lg:pb-0">
                    <div className="mx-auto w-full max-w-7xl px-4">{children}</div>
                  </main>
                  <Footer />
                  <BottomNavbar />
                </div>
                <Toaster position="bottom-right" containerClassName="toast-container" />
              </SafeProvider>
            </Web3Provider>
          </ClientOnly>
        </ThemeProvider>
      </body>
    </html>
  );
}
