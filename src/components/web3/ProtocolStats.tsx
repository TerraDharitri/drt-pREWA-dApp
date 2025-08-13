// src/components/web3/ProtocolStats.tsx

"use client";

import React from 'react';
import { useProtocolStats } from '@/hooks/useProtocolStats';
// The Spinner is no longer used here, but we can leave the import.
import { Spinner } from '@/components/ui/Spinner';

export function ProtocolStats() {
    // The hook provides the last successful data while `isLoading` is true.
    // We can simply ignore `isLoading` here to achieve a silent refresh.
    const { prewaPrice, poolSizeUsd } = useProtocolStats();

    return (
        <div className="flex items-center space-x-4 text-sm font-medium text-greyscale-700 dark:text-dark-text-secondary lg:flex-col lg:items-start lg:space-x-0 lg:space-y-2">
            <div className="flex items-center space-x-2">
                <span>pREWA:</span>
                <span className="font-bold text-greyscale-900 dark:text-dark-text-primary">${prewaPrice}</span>
            </div>
            <div className="h-4 w-px bg-greyscale-200 dark:bg-dark-border lg:h-px lg:w-full"></div>
            <div className="flex items-center space-x-2">
                <span>pREWA/USDT Pool:</span>
                <span className="font-bold text-greyscale-900 dark:text-dark-text-primary">${poolSizeUsd}</span>
            </div>
        </div>
    );
}