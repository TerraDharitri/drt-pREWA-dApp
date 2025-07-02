"use client";
import React, { useState } from 'react';
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAdmin } from '@/hooks/useAdmin';
import { keccak256, stringToBytes } from 'viem';

// Common roles from your AccessControl.sol
const ROLES = {
  PARAMETER_ROLE: keccak256(stringToBytes("PARAMETER_ROLE")),
  PAUSER_ROLE: keccak256(stringToBytes("PAUSER_ROLE")),
  UPGRADER_ROLE: keccak256(stringToBytes("UPGRADER_ROLE")),
  EMERGENCY_ROLE: keccak256(stringToBytes("EMERGENCY_ROLE")),
};

export default function AccessControlPage() {
    const { executeAdminTask, isLoading } = useAdmin();
    const [role, setRole] = useState(ROLES.PARAMETER_ROLE);
    const [account, setAccount] = useState('');

    const handleGrant = () => {
        executeAdminTask('AccessControl', 'grantRole', [role, account]);
    };
    
    const handleRevoke = () => {
        executeAdminTask('AccessControl', 'revokeRole', [role, account]);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Access Control Management</h1>
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader><CardTitle>Manage Role</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label>Role</label>
                        <select onChange={(e) => setRole(e.target.value as `0x${string}`)} className="w-full p-2 rounded bg-gray-700 border-gray-600">
                            <option value={ROLES.PARAMETER_ROLE}>PARAMETER_ROLE</option>
                            <option value={ROLES.PAUSER_ROLE}>PAUSER_ROLE</option>
                            <option value={ROLES.UPGRADER_ROLE}>UPGRADER_ROLE</option>
                            <option value={ROLES.EMERGENCY_ROLE}>EMERGENCY_ROLE</option>
                        </select>
                    </div>
                    <div>
                        <label>Account Address</label>
                        <Input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="0x..." className="bg-gray-700 border-gray-600" />
                    </div>
                    <div className="flex gap-4">
                        <Button onClick={handleGrant} disabled={isLoading || !account}>Grant Role</Button>
                        <Button onClick={handleRevoke} variant="destructive" disabled={isLoading || !account}>Revoke Role</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}