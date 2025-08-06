// src/hooks/useTokenApproval.ts

"use client";
import React, { useEffect, useRef } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { erc20Abi, Address, maxUint256, BaseError } from 'viem';
import toast from 'react-hot-toast';

interface ApproveOptions {
  onSuccess?: () => void;
}

export const useTokenApproval = (tokenAddress?: Address, spenderAddress?: Address) => {
  const { address: accountAddress } = useAccount();
  const toastIdRef = useRef<string | undefined>();
  const onSuccessCallbackRef = useRef<(() => void) | undefined>();

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [accountAddress!, spenderAddress!],
    query: { enabled: !!accountAddress && !!tokenAddress && !!spenderAddress },
  });

  const { writeContractAsync, data: hash, isPending: isApprovalLoading, error: writeError, reset } = useWriteContract();
  
  const approve = async (options?: ApproveOptions) => {
    if (!tokenAddress || !spenderAddress) {
      toast.error("Approval failed: Contract addresses not available.");
      return;
    }

    onSuccessCallbackRef.current = options?.onSuccess; 
    
    toastIdRef.current = toast.loading('Waiting for approval signature...');
    try {
      await writeContractAsync({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress, maxUint256],
      });
    } catch (e: any) {
      const errorMsg = e instanceof BaseError ? e.shortMessage : (e.message || "Approval rejected.");
      toast.error(errorMsg, { id: toastIdRef.current });
      toastIdRef.current = undefined;
    }
  };

  const { isLoading: isConfirming, isSuccess, isError, error: receiptError } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    const toastId = toastIdRef.current;
    if (!hash || !toastId) return;

    if (isConfirming) {
        toast.loading('Processing approval...', { id: toastId });
    } else if (isSuccess) {
      toast.success('Approval successful!', { id: toastId });
      refetchAllowance();
      
      if (onSuccessCallbackRef.current) {
        onSuccessCallbackRef.current();
      }

      reset(); 
      toastIdRef.current = undefined; 
      onSuccessCallbackRef.current = undefined;
    } else if (isError) {
      const error = receiptError || writeError;
      const errorMsg = error instanceof BaseError ? error.shortMessage : (error?.message || "Approval transaction failed.");
      toast.error(errorMsg, { id: toastId });
      reset(); 
      toastIdRef.current = undefined;
      onSuccessCallbackRef.current = undefined;
    }
  }, [isConfirming, isSuccess, isError, hash, refetchAllowance, receiptError, writeError, reset]);

  return { allowance, approve, isLoading: isApprovalLoading || isConfirming, refetchAllowance };
};