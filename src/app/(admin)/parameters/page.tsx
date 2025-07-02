"use client";
import React, { useState } from 'react';
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAdmin } from '@/hooks/useAdmin';

export default function ParametersPage() {
    const { executeAdminTask, isLoading } = useAdmin();
    const [apr, setApr] = useState('');
    const [lpToken, setLpToken] = useState('');
    const [lpApr, setLpApr] = useState('');

    const handleSetApr = () => {
        executeAdminTask('TokenStaking', 'setBaseAnnualPercentageRate', [BigInt(apr)]);
    };

    const handleAddPool = () => {
        executeAdminTask('LPStaking', 'addPool', [lpToken, BigInt(lpApr)]);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">System Parameters</h1>
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader><CardTitle>Token Staking: Base APR</CardTitle></CardHeader>
                <CardContent className="flex gap-4 items-end">
                    <div className="flex-grow">
                        <label>New Base APR (BPS)</label>
                        <Input value={apr} onChange={e => setApr(e.target.value)} className="bg-gray-700 border-gray-600" />
                    </div>
                    <Button onClick={handleSetApr} disabled={isLoading || !apr}>Update</Button>
                </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader><CardTitle>LP Staking: Add Pool</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <label>LP Token Address</label>
                        <Input value={lpToken} onChange={e => setLpToken(e.target.value)} placeholder="0x..." className="bg-gray-700 border-gray-600" />
                     </div>
                     <div>
                        <label>Base APR (BPS)</label>
                        <Input value={lpApr} onChange={e => setLpApr(e.target.value)} placeholder="e.g., 1000 for 10%" className="bg-gray-700 border-gray-600" />
                     </div>
                    <Button onClick={handleAddPool} disabled={isLoading || !lpToken || !lpApr}>Add Pool</Button>
                </CardContent>
            </Card>
        </div>
    );
}