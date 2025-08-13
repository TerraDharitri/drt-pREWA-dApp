// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "@/styles/globals.css";

import { ThemeProvider } from "@/providers/ThemeProvider";
import { ClientSideWeb3Provider } from "@/providers/client-side-web3-provider";
import Navbar from "@/components/layout/Navbar";
import { BottomNavbar } from "@/components/layout/BottomNavbar"; // Import the new component
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Dharitri pREWA Protocol",
  description:
    "The official dApp for the pREWA Protocol for staking, swapping, and liquidity.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Needed for Safe App detection */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${inter.variable} bg-background text-foreground font-sans antialiased`}
      >
        <ThemeProvider>
          <ClientSideWeb3Provider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              {/* Add bottom padding to account for the new BottomNavbar on mobile */}
              <main className="flex-grow pt-22 pb-24 md:pt-18 lg:pb-0">
                <div className="mx-auto w-full max-w-7xl px-4">{children}</div>
              </main>
              <Footer />
              <BottomNavbar /> {/* Render the new component here */}
            </div>
            <Toaster position="bottom-right" containerClassName="toast-container" />
          </ClientSideWeb3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}