// src/hooks/useSwapState.ts

"use client";
import { useState, useMemo, useEffect } from "react";
import { useAccount } from "wagmi";
import { TOKEN_LISTS, Token } from "@/constants/tokens";

export const useSwapState = () => {
  const { chainId, isConnected } = useAccount();

  const TOKENS = useMemo(() => TOKEN_LISTS[chainId as keyof typeof TOKEN_LISTS] || [], [chainId]);

  const [fromToken, setFromToken] = useState<Token>(() => TOKENS.find(t => t.symbol === 'BNB') || TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(() => TOKENS.find(t => t.symbol === 'pREWA') || TOKENS[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'from' | 'to' | null>(null);

  useEffect(() => {
      setFromToken(TOKENS.find(t => t.symbol === 'BNB') || TOKENS[0]);
      setToToken(TOKENS.find(t => t.symbol === 'pREWA') || TOKENS[1]);
      setFromAmount("");
  }, [chainId, TOKENS]);

  const openModal = (type: 'from' | 'to') => {
    setModalType(type);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);
  
  const setAmount = (amount: string) => setFromAmount(amount);

  const flipTokens = () => {
    setFromAmount("");
    const newFrom = toToken;
    const newTo = fromToken;
    setFromToken(newFrom);
    setToToken(newTo);
  };

  const handleSelectToken = (selectedToken: Token) => {
    setFromAmount('');
    
    if (modalType === 'from') {
      if (selectedToken.address === toToken.address) {
        setToToken(fromToken);
      }
      setFromToken(selectedToken);
    } else { // modalType === 'to'
      if (selectedToken.address === fromToken.address) {
        setFromToken(toToken);
      }
      setToToken(selectedToken);
    }
    closeModal();
  };
  
  return {
    TOKENS, fromToken, toToken, fromAmount,
    setAmount, flipTokens, handleSelectToken,
    isModalOpen, modalType, openModal, closeModal
  };
};