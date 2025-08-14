// src/hooks/useSwapState.ts
"use client";

import { useState, useMemo, useEffect } from "react";
import { useAccount } from "wagmi";
import { TOKEN_LISTS, Token } from "@/constants/tokens";

export type Field = 'from' | 'to';

export const useSwapState = () => {
  const { chainId } = useAccount();

  const TOKENS = useMemo(() => TOKEN_LISTS[chainId as keyof typeof TOKEN_LISTS] || [], [chainId]);

  const [fromToken, setFromToken] = useState<Token | undefined>(undefined);
  const [toToken, setToToken] = useState<Token | undefined>(undefined);
  
  const [independentField, setIndependentField] = useState<Field>('from');
  const [amounts, setAmounts] = useState<{ from: string; to: string }>({ from: '', to: '' });

  const [isModalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'from' | 'to' | null>(null);

  useEffect(() => {
    if (TOKENS.length > 0) {
      setFromToken(TOKENS.find(t => t.symbol === 'USDT') || TOKENS[0]);
      setToToken(TOKENS.find(t => t.symbol === 'pREWA') || TOKENS[1]);
      setAmounts({ from: '', to: '' });
    }
  }, [chainId, TOKENS]);

  const onAmountChange = (field: Field, value: string) => {
    setIndependentField(field);
    setAmounts(prev => ({ ...prev, [field]: value }));
  };

  const flipTokens = () => {
    setIndependentField(prev => prev === 'from' ? 'to' : 'from');
    setAmounts(prev => ({ from: prev.to, to: prev.from }));
    const newFrom = toToken;
    const newTo = fromToken;
    setFromToken(newFrom);
    setToToken(newTo);
  };

  const handleSelectToken = (selectedToken: Token) => {
    setAmounts({ from: '', to: '' });
    if (modalType === 'from') {
      if (toToken && selectedToken.address === toToken.address) {
        flipTokens();
      } else {
        setFromToken(selectedToken);
      }
    } else if (modalType === 'to') {
      if (fromToken && selectedToken.address === fromToken.address) {
        flipTokens();
      } else {
        setToToken(selectedToken);
      }
    }
    closeModal();
  };

  const openModal = (type: 'from' | 'to') => {
    setModalType(type);
    setModalOpen(true);
  };
  
  const closeModal = () => setModalOpen(false);
  
  return {
    TOKENS, fromToken, toToken,
    amounts, independentField, onAmountChange,
    flipTokens, handleSelectToken,
    isModalOpen, modalType, openModal, closeModal
  };
};