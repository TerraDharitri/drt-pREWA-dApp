"use client";
import React, { useState } from 'react';
import { Token } from '@/constants/tokens';
import { Input } from '@/components/ui/Input';
import Image from 'next/image';

interface TokenSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  tokenList: Token[];
  exclude?: Token[];
}

export function TokenSelectorModal({ isOpen, onClose, onSelect, tokenList, exclude = [] }: TokenSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const excludedAddresses = exclude.map(t => t.address.toLowerCase());
  const filteredTokens = tokenList.filter(token => 
    (token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
     token.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-background dark:bg-dark-surface rounded-lg shadow-lg w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b dark:border-dark-border">
          <h3 className="font-semibold">Select a token</h3>
          <Input 
            placeholder="Search name or paste address"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="mt-2"
          />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {filteredTokens.map(token => {
            const isExcluded = excludedAddresses.includes(token.address.toLowerCase());
            return (
              <div 
                key={token.address}
                onClick={() => !isExcluded && onSelect(token)}
                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-accent ${isExcluded ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Image src={token.logoURI} alt={token.symbol} width={32} height={32} className="rounded-full" />
                <div>
                  <div className="font-bold">{token.symbol}</div>
                  <div className="text-sm text-greyscale-400">{token.name}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}