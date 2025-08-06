// src/app/(admin)/access-control/page.tsx

"use client";

import React from 'react';
// FIX 1: Corrected the casing of the Button import
import { Button } from "@/components/ui/button"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
// FIX 2: Corrected the imported hook name from 'useAdmin' to 'useIsAdmin'
import { useIsAdmin } from '@/hooks/useAdmin'; 
import { keccak256, stringToBytes } from 'viem';

// Note: A placeholder component body is used as it was not fully visible in the screenshot.
// The critical fixes are in the import statements above and the hook usage below.

export default function AccessControlPage() {
  // FIX 3: Updated the function call to use the correct hook name
  const { isAdmin, isLoading } = useIsAdmin();

  if (isLoading) {
    return <div className="p-4 text-center">Loading admin status...</div>;
  }

  if (!isAdmin) {
    return <div className="p-4 text-center text-red-500">You do not have permission to view this page.</div>;
  }

  return (
    <div className="p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Access Control Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Admin-only content goes here.</p>
          <div className="mt-4 space-y-4">
            <Input label="Role Hash" placeholder="0x..." />
            <Button>Grant Role</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}