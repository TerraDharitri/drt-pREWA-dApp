// src/components/web3/vesting/CreateVestingSchedule.tsx

"use client";
import React, { useState, useMemo } from 'react'; // <-- Import useMemo
import { useAccount, useBalance } from 'wagmi';
import { useIsVestingFactoryOwner } from '@/hooks/useIsVestingFactoryOwner';
import SafeAppsSDK from '@safe-global/safe-apps-sdk';
import { pREWAAddresses, pREWAAbis } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { parseUnits, Address, isAddress, formatUnits, encodeFunctionData } from 'viem';
import toast from 'react-hot-toast';
import { isValidNumberInput } from "@/lib/utils";
import { useSafe } from '@/providers/SafeProvider';

export function CreateVestingSchedule() {
  const { chainId } = useAccount();
  const { isOwner, isLoading: isOwnerLoading } = useIsVestingFactoryOwner();
  const { isSafe: isSafeContext } = useSafe();
  
  // FIX: Instantiate the SDK once using useMemo.
  // This ensures the connection to the Safe UI is stable before we try to use it.
  const sdk = useMemo(() => new SafeAppsSDK(), []);

  const [beneficiary, setBeneficiary] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [cliff, setCliff] = useState('');
  const [duration, setDuration] = useState('');
  const [revocable, setRevocable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAmountValid = useMemo(() => isValidNumberInput(amount), [amount]);

  const addresses = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses] : undefined;
  const vestingFactoryAddress = addresses?.VestingFactory;
  const pREWAAddress = addresses?.pREWAToken;
  const safeAddress = addresses?.ProtocolAdminSafe;

  const { data: pREWABalance } = useBalance({
    address: safeAddress,
    token: pREWAAddress,
    query: { enabled: !!safeAddress && !!pREWAAddress && isOwner }
  });

  const handleProposeSchedule = async () => {
    if (!isAddress(beneficiary)) return toast.error("Invalid beneficiary address.");
    if (!isAmountValid) return toast.error("Amount must be a valid positive number.");
    if (!vestingFactoryAddress) return toast.error("Vesting Factory address not found.");

    const durationDays = parseInt(duration);
    if (isNaN(durationDays) || durationDays < 1) return toast.error("Vesting duration must be at least 1 day.");
    const cliffDays = parseInt(cliff || '0');
    if (isNaN(cliffDays) || cliffDays < 0) return toast.error("Cliff must be a non-negative number of days.");
    if (cliffDays > durationDays) return toast.error("Cliff cannot be longer than the total duration.");
    
    let startTime = Math.floor(Date.now() / 1000);
    if (startDate) {
        const selectedDate = new Date(startDate + 'T00:00:00');
        startTime = Math.floor(selectedDate.getTime() / 1000);
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Proposing transaction to Safe...");

    try {
      const transactionData = encodeFunctionData({
        abi: pREWAAbis.VestingFactory,
        functionName: 'createVesting',
        args: [
          beneficiary as Address, BigInt(startTime), BigInt(cliffDays * 86400),
          BigInt(durationDays * 86400), revocable, parseUnits(amount, 18)
        ],
      });

      // Use the stable SDK instance to send the transaction.
      await sdk.txs.send({
        txs: [{ to: vestingFactoryAddress, value: '0', data: transactionData }],
      });
      toast.success(`Transaction proposed! Please sign in your Safe app.`, { id: toastId, duration: 8000 });
    } catch (e) {
      console.error("Failed to propose transaction to Safe:", e);
      toast.error("Proposal failed. Please ensure your Safe is on the correct network.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isOwnerLoading) {
    return (
      <Card className="mb-8"><CardContent className="p-8 text-center"><Spinner /> Checking permissions...</CardContent></Card>
    );
  }

  if (!isOwner) {
    return null;
  }

  if (!isSafeContext) {
     return (
       <Card className="mb-8">
          <CardHeader>
            <CardTitle>Admin Action Required</CardTitle>
            <CardDescription>
                To create a new vesting schedule, you must use this dApp from within the official Safe App interface.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
                This ensures that all administrative actions are securely proposed to and executed by your multisig wallet. Please open the Safe App and navigate to this page from there to proceed.
            </p>
          </CardContent>
        </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader><CardTitle>Propose New Vesting Schedule (Admin)</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Beneficiary Address</label>
          <Input value={beneficiary} onChange={e => setBeneficiary(e.target.value)} placeholder="0x..." />
        </div>
        <div>
          <div className="flex justify-between items-baseline mb-1">
              <label className="text-sm font-medium">Amount to Vest</label>
              {pREWABalance && <span className="text-xs text-gray-500">Safe's Balance: {formatUnits(pREWABalance.value, pREWABalance.decimals)}</span>}
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
          <Button onClick={handleProposeSchedule} disabled={isSubmitting || !isAmountValid || !beneficiary || !duration} className="w-full">
            {isSubmitting && <Spinner className="mr-2" />}
            Propose Vesting Schedule to Safe
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}