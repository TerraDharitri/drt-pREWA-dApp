"use client";

import dynamic from "next/dynamic";
import React from "react";

// Dynamically import the Web3Provider with Server-Side Rendering (SSR) disabled.
// This ensures that the component and all its children (including wagmi config)
// are only rendered on the client-side (in the browser).
const Web3Provider = dynamic(
  () => import("./Web3Provider").then((mod) => mod.Web3Provider),
  {
    ssr: false,
    loading: () => <p>Loading Web3 Provider...</p>, // Optional: a loading state
  }
);

export function ClientSideWeb3Provider({ children }: { children: React.ReactNode }) {
  return <Web3Provider>{children}</Web3Provider>;
}