// src/components/web3/vesting/VestingDashboard.tsx

"use client";
import React, { useState, useMemo } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useVestingActions } from '@/hooks/useVestingActions';
import { useTokenApproval } from '@/hooks/useTokenApproval';
import { useIsVestingFactoryOwner } from '@/hooks/useIsVestingFactoryOwner';
import { pREWAAddresses } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { parseUnits, Address, isAddress, formatUnits } from 'viem';
import toast from 'react-hot-toast';
import { isValidNumberInput } from "@/lib/utils";

export function VestingDashboard() {
  const { address, chainId } = useAccount();
  const { createVestingSchedule, isLoading: isActionLoading } = useVestingActions();
  const { isOwner, isLoading: isOwnerLoading } = useIsVestingFactoryOwner();

  const [beneficiary, setBeneficiary] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [cliff, setCliff] = useState('');
  const [duration, setDuration] = useState('');
  const [revocable, setRevocable] = useState(true);

  const isAmountValid = useMemo(() => isValidNumberInput(amount), [amount]);

  const vestingFactoryAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.VestingFactory : undefined;
  const pREWAAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.pREWAToken : undefined;
  
  const { data: pREWABalance } = useBalance({
    address: address,
    token: pREWAAddress,
    query: { enabled: !!address && !!pREWAAddress && isOwner }
  });

  const { allowance, approve, isLoading: isApproving } = useTokenApproval(pREWAAddress, vestingFactoryAddress);
  const needsApproval = isAmountValid && pREWABalance && (!allowance || allowance < parseUnits(amount, pREWABalance.decimals));
  const isLoading = isApproving || isActionLoading;

  const handleCreateSchedule = () => {
    if (!isAddress(beneficiary)) return toast.error("Invalid beneficiary address.");
    if (!isAmountValid) return toast.error("Amount must be a valid positive number.");
    
    const durationDays = parseInt(duration);
    if (isNaN(durationDays) || durationDays < 1) return toast.error("Vesting duration must be at least 1 day.");
    const cliffDays = parseInt(cliff || '0');
    if (isNaN(cliffDays) || cliffDays < 0) return toast.error("Cliff must be a non-negative number of days.");
    if (cliffDays > durationDays) return toast.error("Cliff cannot be longer than the total duration.");

    const create = () => {
        let startTime = 0;
        if (startDate) {
            const selectedDate = new Date(startDate + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) return toast.error("Start date cannot be in the past.");
            startTime = Math.floor(selectedDate.getTime() / 1000);
        }
        createVestingSchedule(beneficiary as Address, startTime, cliffDays * 86400, durationDays * 86400, revocable, amount);
    };

    if (needsApproval) {
      approve({ onSuccess: create });
    } else {
      create();
    }
  };
  
  if (isOwnerLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
            <Spinner />
            <span className="ml-2">Checking owner permissions...</span>
        </CardContent>
      </Card>
    );
  }

  // If the connected user/Safe is not the owner, this component renders nothing.
  if (!isOwner) {
    return null;
  }

  // Render the admin form ONLY for the factory owner.
  return (
    <Card>
      <CardHeader><CardTitle>Create New Vesting Schedule (Admin)</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Beneficiary Address</label>
          <Input value={beneficiary} onChange={e => setBeneficiary(e.target.value)} placeholder="0x..." />
        </div>
        <div>
          <div className="flex justify-between items-baseline mb-1">
              <label className="text-sm font-medium">Amount to Vest</label>
              {pREWABalance && <span className="text-xs text-gray-500">Balance: {formatUnits(pREWABalance.value, pREWABalance.decimals)}</span>}
          </div>
          <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.0 pREWA" type="text" />
        </div>
         <div>
          <label className="mb-1 block text-sm font-medium">Start Date (Optional)</label>
          <Input value={startDate} onChange={e => setStartDate(e.target.value)} type="date" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Duration (Days)</label>
          <Input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g., 365" type="text" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Cliff (Days)</label>
          <Input value={cliff} onChange={e => setCliff(e.target.value)} placeholder="e.g., 90" type="text" />
        </div>
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="revocable" checked={revocable} onChange={e => setRevocable(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-100 focus:ring-primary-100" />
          <label htmlFor="revocable" className="text-sm font-medium">Revocable</label>
        </div>
        <div className="md:col-span-2">
          <Button onClick={handleCreateSchedule} disabled={isLoading || !isAmountValid || !beneficiary || !duration} className="w-full">
            {isLoading && <Spinner className="mr-2" />}
            {needsApproval ? 'Approve pREWA for Vesting' : 'Create Schedule'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}