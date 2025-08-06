// src/app/(admin)/upgrades/page.tsx

"use client";
import React from 'react';
import { useIsAdmin } from '@/hooks/useAdmin';   // Corrected hook name
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";   // Corrected casing
import { Input } from "@/components/ui/Input";

// Placeholder component body
export default function UpgradesPage() {
  const { isAdmin, isLoading } = useIsAdmin(); // Corrected hook usage

  if (isLoading) return <div>Loading permissions...</div>;
  if (!isAdmin) return <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>;

  return (
    <div>
       <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Contract Upgrades</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Admin-only contract upgrade functions.</p>
          <div className="mt-4 space-y-4">
            <Input label="New Implementation Address" placeholder="0x..." />
            <Button>Propose Upgrade</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}