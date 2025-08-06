// src/app/(main)/liquidity/page.tsx

"use client";
import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectWalletMessage } from '@/components/web3/ConnectWalletMessage';
import { LiquidityManagerDashboard } from '@/components/web3/liquidity/LiquidityManagerDashboard';
import { RemoveLiquidityForm } from '@/components/web3/liquidity/RemoveLiquidityForm';
import { Button } from '@/components/ui/button'; // FIX: Corrected import path
import { Card } from '@/components/ui/Card';

export default function LiquidityPage() {
    const { isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add');

    const renderContent = () => {
        if (!isConnected) {
            return <ConnectWalletMessage />;
        }
        
        return (
            <div className="container mx-auto max-w-md px-4 sm:px-6 lg:px-8">
                <Card className="bg-transparent border-0 shadow-none">
                    <div className="flex justify-center gap-2 mb-6 border-b pb-4">
                        <Button onClick={() => setActiveTab('add')} variant={activeTab === 'add' ? 'primary' : 'outline'} className="flex-1">Add Liquidity</Button>
                        <Button onClick={() => setActiveTab('remove')} variant={activeTab === 'remove' ? 'primary' : 'outline'} className="flex-1">Remove Liquidity</Button>
                    </div>
                    {activeTab === 'add' ? <LiquidityManagerDashboard /> : <RemoveLiquidityForm />}
                </Card>
            </div>
        );
    };

    return (
        <div className="space-y-8 mt-20">
            <div className="text-center">
                <h1 className="text-3xl font-bold">Manage Liquidity</h1>
                <p className="text-gray-600">Add or remove liquidity to earn fees from token swaps.</p>
            </div>
            {renderContent()}
        </div>
    );
}