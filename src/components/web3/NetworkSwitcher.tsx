"use client";

import { useAccount, useSwitchChain } from "wagmi";

export function NetworkSwitcher() {
  const { chain } = useAccount();
  const { chains, switchChain, isPending } = useSwitchChain();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Number(e.target.value);
    // Narrow to one of our configured chains (e.g., 56 | 97)
    const target = chains.find((c) => c.id === selected);
    if (target) {
      // target.id is typed as typeof chains[number]["id"] (56 | 97), so this satisfies the type.
      switchChain?.({ chainId: target.id });
    }
  };

  return (
    <div className="flex items-center gap-4">
      {chain && <p className="text-[80%]">Connected to</p>}
      <select
        onChange={handleChange}
        value={chain?.id}
        disabled={isPending}
        className="border rounded px-2 py-1 text-sm"
      >
        {chains.map((c) => (
          <option key={c.id} value={c.id} disabled={c.id === chain?.id}>
            {c.name} {c.id === chain?.id ? "(current)" : ""}
          </option>
        ))}
      </select>

      {isPending && <span className="text-sm text-gray-500">Switching...</span>}
    </div>
  );
}
