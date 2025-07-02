"use client";
import React, { useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useSimulateContract, useWaitForTransactionReceipt } from 'wagmi';
import { erc20Abi, Address } from 'viem';
import toast from 'react-hot-toast';

export const useTokenApproval = (tokenAddress?: Address, spenderAddress?: Address) => {
  const { address: accountAddress } = useAccount();

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [accountAddress!, spenderAddress!],
    query: { enabled: !!accountAddress && !!tokenAddress && !!spenderAddress },
  });

  const { data: simulateApproveData } = useSimulateContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'approve',
    args: [spenderAddress!, BigInt(2**256 - 1)],
    query: { enabled: !!tokenAddress && !!spenderAddress },
  });

  const { writeContractAsync, data: hash, isPending: isApprovalLoading } = useWriteContract();
  
  const approve = async () => {
    if (!simulateApproveData?.request) {
      toast.error("Approval failed: Cannot prepare transaction.");
      return;
    }
    const toastId = toast.loading('Waiting for approval signature...');
    try {
      await writeContractAsync(simulateApproveData.request);
      toast.loading('Processing approval...', { id: toastId });
    } catch (e: any) {
      toast.error(`Approval failed: ${e.shortMessage || e.message}`, { id: toastId });
    }
  };

  const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({ hash });

  // CORRECTED: Use useEffect to handle side-effects
  useEffect(() => {
    if (isSuccess) {
        toast.success('Approval successful!', { id: 'approve-toast' });
        refetchAllowance();
    }
    if (isError) {
        toast.error('Approval transaction failed.', { id: 'approve-toast' });
    }
  }, [isSuccess, isError, refetchAllowance]);

  return {
    allowance,
    approve,
    isLoading: isApprovalLoading || isConfirming,
    refetchAllowance,
  };
};