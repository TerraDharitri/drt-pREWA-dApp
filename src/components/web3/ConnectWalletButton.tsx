// src/components/web3/ConnectWalletButton.tsx

"use client";

import { useEffect, useRef } from 'react';
import { ConnectKitButton, useModal } from "connectkit";
import { useAccount } from 'wagmi';

/**
 * A wrapper for the ConnectKitButton that provides a robust fix for the modal state.
 * 
 * 1. It fixes the bug where the modal doesn't close after connecting.
 * 2. It allows the modal to be re-opened by the user to disconnect or switch accounts.
 */
export function ConnectWalletButton() {
  const { isConnected } = useAccount();
  const { setOpen } = useModal();

  // Use a ref to track the previous connection state.
  // This allows us to detect the specific moment of transition.
  const prevIsConnected = useRef(isConnected);

  useEffect(() => {
    // This effect runs whenever `isConnected` changes.
    // We only want to act when the state changes FROM disconnected TO connected.
    if (!prevIsConnected.current && isConnected) {
      // The user has just successfully connected their wallet.
      // Now is the correct time to programmatically close the modal.
      setOpen(false);
    }

    // After every render, update the ref to store the current connection state for the next render.
    prevIsConnected.current = isConnected;
  }, [isConnected, setOpen]);

  // Render the standard ConnectKit button. Our logic will now only interfere
  // at the exact moment of connection, leaving all other interactions (like disconnecting) untouched.
  return <ConnectKitButton />;
}