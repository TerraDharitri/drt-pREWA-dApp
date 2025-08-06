// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
// FIX: Corrected the filename in the import path from 'web-3' to 'web3'
import { ClientSideWeb3Provider } from "@/providers/client-side-web3-provider"; 
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar"; 
import { Footer } from "@/components/layout/Footer"; 
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Dharitri pREWA Protocol",
  description: "The official dApp for the pREWA Protocol for staking, swapping, and liquidity.",
};

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} bg-background text-foreground font-sans antialiased`}>
        <ThemeProvider>
          <ClientSideWeb3Provider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-grow pt-20">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster position="bottom-right" containerClassName="toast-container" />
          </ClientSideWeb3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}