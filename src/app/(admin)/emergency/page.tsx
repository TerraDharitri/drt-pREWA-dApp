"use client";
import React, { useState } from 'react';
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAdmin } from '@/hooks/useAdmin';

export default function EmergencyPage() {
    const { executeAdminTask, isLoading } = useAdmin();
    const [level, setLevel] = useState('0');

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Emergency Controls</h1>
            <Card className="bg-gray-800 border-gray-700">
                <CardHeader><CardTitle>Set Emergency Level</CardTitle></CardHeader>
                <CardContent className="flex gap-4">
                    <Input value={level} onChange={e => setLevel(e.target.value)} placeholder="Level (0-2)" className="bg-gray-700 border-gray-600" />
                    <Button onClick={() => executeAdminTask('EmergencyController', 'setEmergencyLevel', [Number(level)])} variant="destructive" disabled={isLoading}>Set Level</Button>
                </CardContent>
            </Card>
             <Card className="bg-gray-800 border-gray-700">
                <CardHeader><CardTitle>Global System Pause</CardTitle></CardHeader>
                <CardContent className="flex gap-4">
                    <Button onClick={() => executeAdminTask('EmergencyController', 'pauseSystem', [])} variant="destructive" disabled={isLoading}>Pause System</Button>
                    <Button onClick={() => executeAdminTask('EmergencyController', 'unpauseSystem', [])} variant="secondary" disabled={isLoading}>Unpause System</Button>
                </CardContent>
            </Card>
             <Card className="bg-gray-800 border-gray-700">
                <CardHeader><CardTitle>Level 3 (Critical) Escalation</CardTitle></CardHeader>
                <CardContent className="flex gap-4">
                    <Button onClick={() => executeAdminTask('EmergencyController', 'approveLevel3Emergency', [])} variant="destructive" disabled={isLoading}>Approve L3</Button>
                    <Button onClick={() => executeAdminTask('EmergencyController', 'executeLevel3Emergency', [])} variant="destructive" disabled={isLoading}>Execute L3</Button>
                    <Button onClick={() => executeAdminTask('EmergencyController', 'cancelLevel3Emergency', [])} variant="secondary" disabled={isLoading}>Cancel L3</Button>
                </CardContent>
            </Card>
        </div>
    );
}