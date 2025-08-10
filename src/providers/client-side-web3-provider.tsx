"use client";

import dynamic from "next/dynamic";
import React from "react";

// Render the Web3 provider only on the client to avoid SSR/DOM access issues.
const Web3Provider = dynamic(
  () => import("./Web3Provider").then((mod) => mod.Web3Provider),
  {
    ssr: false,
    loading: () => <div style={{ minHeight: "100vh" }} />,
  }
);

export function ClientSideWeb3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Web3Provider>{children}</Web3Provider>;
}
