"use client"; // CORRECTED: Added the required "use client" directive.

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AddLiquidityForm } from './AddLiquidityForm';
import { RemoveLiquidityForm } from './RemoveLiquidityForm';

export function LiquidityManagerDashboard() {
  const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add');

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader className="p-0">
        <div className="flex border-b">
          <Button
            variant="ghost"
            className={`flex-1 rounded-none p-4 ${activeTab === 'add' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('add')}
          >
            Add Liquidity
          </Button>
          <Button
            variant="ghost"
            className={`flex-1 rounded-none p-4 ${activeTab === 'remove' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('remove')}
          >
            Remove Liquidity
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {activeTab === 'add' && <AddLiquidityForm />}
        {activeTab === 'remove' && <RemoveLiquidityForm />}
      </CardContent>
    </Card>
  );
}