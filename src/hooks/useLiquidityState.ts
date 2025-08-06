// src/hooks/useLiquidityState.ts

"use client";
import { useState, useMemo, useEffect } from "react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { pREWAAddresses, pREWAAbis } from "@/constants";
import { TOKEN_LISTS, Token } from "@/constants/tokens";
import { Address, formatUnits, parseUnits } from "viem";

export const useLiquidityState = () => {
  const { address: accountAddress, chainId, isConnected } = useAccount();

  const TOKENS = useMemo(() => TOKEN_LISTS[chainId as keyof typeof TOKEN_LISTS] || [], [chainId]);
  
  const [tokenA, setTokenA] = useState<Token>(() => TOKENS.find(t => t.symbol === 'BNB') || TOKENS[0]);
  const [tokenB, setTokenB] = useState<Token>(() => TOKENS.find(t => t.symbol === 'pREWA') || TOKENS[1]);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");

  const [isModalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'A' | 'B' | null>(null);

  useEffect(() => {
    setTokenA(TOKENS.find(t => t.symbol === 'BNB') || TOKENS[0]);
    setTokenB(TOKENS.find(t => t.symbol === 'pREWA') || TOKENS[1]);
    setAmountA("");
    setAmountB("");
  }, [chainId, TOKENS]);

  const liquidityManagerAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.LiquidityManager : undefined;
  const pREWAAddress = chainId ? pREWAAddresses[chainId as keyof typeof pREWAAddresses]?.pREWAToken : undefined;

  const { data: balanceA } = useBalance({ 
    address: accountAddress, 
    token: tokenA?.symbol !== 'BNB' ? tokenA.address : undefined,
    query: { enabled: isConnected && !!tokenA }
  });
  const { data: balanceB } = useBalance({ 
    address: accountAddress, 
    token: tokenB?.symbol !== 'BNB' ? tokenB.address : undefined,
    query: { enabled: isConnected && !!tokenB }
  });
  
  const otherTokenForPair = useMemo(() => {
      if (!pREWAAddress || !tokenA || !tokenB) return undefined;
      if (tokenA.address.toLowerCase() === pREWAAddress.toLowerCase()) return tokenB;
      if (tokenB.address.toLowerCase() === pREWAAddress.toLowerCase()) return tokenA;
      return undefined;
  }, [tokenA, tokenB, pREWAAddress]);

  const { data: pairInfo, isLoading: isInitialPairInfoLoading } = useReadContract({
    address: liquidityManagerAddress,
    abi: pREWAAbis.ILiquidityManager,
    functionName: 'getPairInfo',
    args: [otherTokenForPair?.address!],
    query: { 
        enabled: !!liquidityManagerAddress && !!otherTokenForPair,
        refetchInterval: 5000, 
    }
  });

  const reserves = useMemo(() => {
    if (!pairInfo || !Array.isArray(pairInfo) || (pairInfo[0] as Address).toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return { reserveA: 0n, reserveB: 0n };
    }
    
    const [, , , reserve0, reserve1, pREWAIsToken0, ] = pairInfo as [Address, Address, boolean, bigint, bigint, boolean, number];
    
    const isTokenAPREWA = tokenA?.address.toLowerCase() === pREWAAddress?.toLowerCase();
    
    if (isTokenAPREWA) {
        return pREWAIsToken0 ? { reserveA: reserve0, reserveB: reserve1 } : { reserveA: reserve1, reserveB: reserve0 };
    } else { 
        return pREWAIsToken0 ? { reserveA: reserve1, reserveB: reserve0 } : { reserveA: reserve0, reserveB: reserve1 };
    }
  }, [pairInfo, tokenA?.address, pREWAAddress]);

  const handleSelectToken = (selectedToken: Token) => {
    if (modalType === 'A') {
      if (selectedToken.address === tokenB.address) {
        setTokenB(tokenA); // Flip
      }
      setTokenA(selectedToken);
    } else if (modalType === 'B') {
      if (selectedToken.address === tokenA.address) {
        setTokenA(tokenB); // Flip
      }
      setTokenB(selectedToken);
    }
    closeModal();
  };
  
  const handleAmountAChange = (value: string) => {
    setAmountA(value);
    if (reserves && reserves.reserveA > 0n && reserves.reserveB > 0n && value && !isNaN(Number(value)) && Number(value) > 0) {
      const amountInWei = parseUnits(value, tokenA.decimals);
      const amountBWei = (amountInWei * reserves.reserveB) / reserves.reserveA;
      setAmountB(formatUnits(amountBWei, tokenB.decimals));
    } else {
      if (!reserves || reserves.reserveA === 0n) {
        return;
      }
      setAmountB('');
    }
  };

  const handleAmountBChange = (value: string) => {
    setAmountB(value);
    if (reserves && reserves.reserveB > 0n && reserves.reserveA > 0n && value && !isNaN(Number(value)) && Number(value) > 0) {
      const amountInWei = parseUnits(value, tokenB.decimals);
      const amountAWei = (amountInWei * reserves.reserveA) / reserves.reserveB;
      setAmountA(formatUnits(amountAWei, tokenA.decimals));
    } else {
       if (!reserves || reserves.reserveB === 0n) {
        return;
      }
      setAmountA('');
    }
  };

  const openModal = (type: 'A' | 'B') => { setModalType(type); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  return {
    TOKENS, tokenA, tokenB, amountA, amountB, balanceA, balanceB, otherTokenForPair, reserves,
    handleSelectToken, handleAmountAChange, handleAmountBChange,
    isModalOpen, openModal, closeModal, modalType, 
    isInitialPairInfoLoading
  };
};