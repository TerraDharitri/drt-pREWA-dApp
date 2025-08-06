// src/components/web3/ProtocolStats.tsx

"use client";

import React from 'react';
import { useProtocolStats } from '@/hooks/useProtocolStats';
import { Spinner } from '@/components/ui/Spinner';

export function ProtocolStats() {
    const { isLoading, prewaPrice, poolSizeUsd } = useProtocolStats();

    if (isLoading) {
        return <div className="flex items-center text-sm"><Spinner className="w-4 h-4 mr-2" /> Loading Stats...</div>;
    }

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