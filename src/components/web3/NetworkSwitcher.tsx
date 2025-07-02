"use client";
import { useAccount, useSwitchChain } from 'wagmi';
import { Button } from '../ui/Button';

export function NetworkSwitcher() {
  const { chain } = useAccount();
  const { chains, switchChain, isPending } = useSwitchChain();

  return (
    <div className="flex items-center gap-2">
      {chain && <p>Connected to: {chain.name}</p>}
      {chains.map((c) => (
        <Button
          key={c.id}
          disabled={!switchChain || c.id === chain?.id || isPending}
          onClick={() => switchChain({ chainId: c.id })}
          variant="outline"
          size="sm"
        >
          {c.name}
          {isPending && c.id === chains.find(ch => ch.id !== chain?.id)?.id && ' (switching)'}
        </Button>
      ))}
    </div>
  );
}