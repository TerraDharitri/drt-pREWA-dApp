import type { Metadata } from "next";
import { Inter } from "next/font/google";
// CORRECTED: Import the new client-side provider
import { ClientSideWeb3Provider } from "@/providers/client-side-web3-provider";
import { Toaster } from "react-hot-toast";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "drt-pREWA Protocol",
  description: "The official dApp for the pREWA Protocol for staking and liquidity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* CORRECTED: Use the new provider here */}
        <ClientSideWeb3Provider>
          <div className="flex flex-col min-h-screen">
            {children}
          </div>
          <Toaster position="bottom-right" containerClassName="toast-container"/>
        </ClientSideWeb3Provider>
      </body>
    </html>
  );
}