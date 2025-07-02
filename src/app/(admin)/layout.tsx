"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { pREWAAddresses, pREWAAbis } from '@/constants';
import { ConnectWalletMessage } from '@/components/web3/ConnectWalletMessage';
import { Spinner } from '@/components/ui/Spinner';

// This is a simplified role check for demonstration.
// In production, you might check against multiple roles (e.g., PARAMETER_ROLE, EMERGENCY_ROLE)
const ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

function AdminGuard({ children }: { children: React.ReactNode }) {
    const { address, isConnected, chainId } = useAccount();
    const contractAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.AccessControl : undefined;

    const { data: hasAdminRole, isLoading } = useReadContract({
        address: contractAddress,
        abi: pREWAAbis.AccessControl,
        functionName: 'hasRole',
        args: [ADMIN_ROLE, address!],
        query: {
            enabled: isConnected && !!address && !!contractAddress,
        }
    });

    if (!isConnected) {
        return <div className="p-8"><ConnectWalletMessage /></div>;
    }
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Spinner className="h-10 w-10" /> <p className="ml-4">Verifying administrator access...</p></div>;
    }

    if (!hasAdminRole) {
        return (
            <div className="flex justify-center items-center h-screen text-center">
                <div>
                    <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>
                    <p className="mt-2">You do not have the required permissions to view this page.</p>
                </div>
            </div>
        );
    }
    
    return <>{children}</>;
}


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <AdminGuard>
        <header className="bg-gray-800 p-4 border-b border-gray-700">
            <h1 className="text-xl font-bold">pREWA Protocol - Admin Panel</h1>
        </header>
        <main className="p-8">
            {children}
        </main>
      </AdminGuard>
    </div>
  );
}