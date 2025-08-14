// src/components/web3/liquidity/LiquidityManagerDashboard.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AddLiquidityForm } from './AddLiquidityForm';
import { RemoveLiquidityForm } from './RemoveLiquidityForm';

type LiquidityTab = 'ADD' | 'REMOVE';

export function LiquidityManagerDashboard() {
    const [activeTab, setActiveTab] = useState<LiquidityTab>('ADD');

    return (
        <div className="max-w-md mx-auto space-y-4">
            <div className="flex items-center justify-center p-1 rounded-lg bg-muted space-x-1">
                <Button 
                    onClick={() => setActiveTab('ADD')}
                    variant={activeTab === 'ADD' ? 'primary' : 'ghost'}
                    className="flex-1"
                >
                    Add Liquidity
                </Button>
                <Button
                    onClick={() => setActiveTab('REMOVE')}
                    variant={activeTab === 'REMOVE' ? 'primary' : 'ghost'}
                    className="flex-1"
                >
                    Remove Liquidity
                </Button>
            </div>

            <div>
                {activeTab === 'ADD' && <AddLiquidityForm />}
                {activeTab === 'REMOVE' && <RemoveLiquidityForm />}
            </div>
        </div>
    );
}