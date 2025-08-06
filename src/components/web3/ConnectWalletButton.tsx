"use client";

import { useEffect } from 'react';
import { ConnectKitButton, useModal } from "connectkit";
import { useConnect } from 'wagmi';

/**

    A wrapper for the ConnectKitButton that includes a workaround for a common bug

    where the modal does not close after a successful connection.

    It monitors the connection status and manually closes the modal once the

    connection is established.
    */
    export function ConnectWalletButton() {
    // Hook to get the current connection status from wagmi
    const { isConnected } = useConnect();

// Hook to control the ConnectKit modal (open/close)
const { setOpen } = useModal();

useEffect(() => {
// This effect runs whenever the connection status changes.
// If the wallet is connected, we ensure the modal is closed.
if (isConnected) {
setOpen(false);
}
}, [isConnected, setOpen]);

// Render the standard ConnectKit button. Our logic will handle closing it.
return <ConnectKitButton />;
}