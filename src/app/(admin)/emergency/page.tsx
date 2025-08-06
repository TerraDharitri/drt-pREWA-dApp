// src/app/(admin)/emergency/page.tsx

"use client";
import React from 'react';
import { Button } from "@/components/ui/button"; // Corrected casing
import { useIsAdmin } from '@/hooks/useAdmin';   // Corrected hook name

// Placeholder component body
export default function EmergencyPage() {
  const { isAdmin, isLoading } = useIsAdmin(); // Corrected hook usage

  if (isLoading) return <div>Loading permissions...</div>;
  if (!isAdmin) return <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>;

  return (
    <div>
      <h1 className="text-3xl font-bold">Emergency Controls</h1>
      <p className="mt-2">Admin-only emergency functions.</p>
      <div className="mt-4">
        <Button variant="destructive">Trigger Level 1 Shutdown</Button>
      </div>
    </div>
  );
}