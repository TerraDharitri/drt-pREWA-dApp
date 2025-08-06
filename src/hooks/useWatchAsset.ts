"use client";

import { useWalletClient } from 'wagmi';
import { Address } from 'viem';
import toast from 'react-hot-toast';

export const useWatchAsset = () => {
    const { data: walletClient } = useWalletClient();

    const addTokenToWallet = async (address: Address, symbol: string, decimals: number, image?: string) => {
        if (!walletClient) {
            toast.error("Wallet not connected or not ready.");
            return;
        }

        try {
            const success = await walletClient.watchAsset({
                type: 'ERC20',
                options: {
                    address,
                    symbol,
                    decimals,
                    image, // Optional: You can add an image URL for the LP token if you have one
                },
            });

            if (success) {
                toast.success(`${symbol} has been added to your wallet!`);
            } else {
                toast.error(`Failed to add ${symbol} to your wallet.`);
            }
        } catch (error) {
            console.error("Failed to add token to wallet:", error);
            // MetaMask often throws a user rejection error, so we can be less verbose.
            toast.error("Could not add token to wallet.");
        }
    };

    return { addTokenToWallet };
};