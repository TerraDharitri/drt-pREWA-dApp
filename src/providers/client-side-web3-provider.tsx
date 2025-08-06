"use client";
import dynamic from 'next/dynamic';
import React from 'react';

// This is the key part of the solution.
// We are dynamically importing the Web3Provider with the `ssr: false` option.
// This tells Next.js to NOT render this component on the server.
const Web3Provider = dynamic(
  () => import('./Web3Provider').then((mod) => mod.Web3Provider),
  {
    ssr: false,
    // You can add a loading component here if you wish
    loading: () => <div style={{ minHeight: '100vh' }} />,
  }
);

// This component is safe to import in a Server Component (like RootLayout)
// because it only renders the dynamically imported, client-only provider.
export function ClientSideWeb3Provider({ children }: { children: React.ReactNode }) {
  return <Web3Provider>{children}</Web3Provider>;
}