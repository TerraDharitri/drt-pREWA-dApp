"use client";
import React, { useState } from 'react';
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAdmin } from '@/hooks/useAdmin';

export default function UpgradesPage() {
    const { executeAdminTask, isLoading } = useAdmin();
    const [proxyAddress, setProxyAddress] = useState('');
    const [implAddress, setImplAddress] = useState('');

    const handlePropose = () => {
        executeAdminTask('ProxyAdmin', 'proposeUpgrade', [proxyAddress, implAddress]);
    }
    
    const handleExecute = () => {
        executeAdminTask('ProxyAdmin', 'executeUpgrade', [proxyAddress]);
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Contract Upgrades (ProxyAdmin)</h1>
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader><CardTitle>Propose Upgrade</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label>Proxy Address to Upgrade</label>
                        <Input value={proxyAddress} onChange={e => setProxyAddress(e.target.value)} placeholder="0x..." className="bg-gray-700 border-gray-600" />
                    </div>
                     <div>
                        <label>New Implementation Address</label>
                        <Input value={implAddress} onChange={e => setImplAddress(e.target.value)} placeholder="0x..." className="bg-gray-700 border-gray-600" />
                    </div>
                    <Button onClick={handlePropose} disabled={isLoading || !proxyAddress || !implAddress}>Propose</Button>
                </CardContent>
            </Card>
             <Card className="bg-gray-800 border-gray-700">
                <CardHeader><CardTitle>Execute Upgrade</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label>Proxy Address</label>
                        <Input value={proxyAddress} onChange={e => setProxyAddress(e.target.value)} placeholder="0x..." className="bg-gray-700 border-gray-600" />
                    </div>
                    <Button onClick={handleExecute} variant="destructive" disabled={isLoading || !proxyAddress}>Execute</Button>
                </CardContent>
            </Card>
        </div>
    );
}