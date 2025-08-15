// app/error.tsx
"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  const msg = error?.message || "";
  const isWcTimeout = /proposal expired/i.test(msg);

  return (
    <html>
      <body className="p-6">
        <h2 className="text-lg font-semibold">
          {isWcTimeout ? "WalletConnect request timed out" : "Something went wrong"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isWcTimeout
            ? "Keep your wallet app open and approve the request, then try again."
            : "Please try again."}
        </p>
        <button onClick={() => reset()} className="mt-4 rounded-md border px-3 py-1.5">
          Retry
        </button>
      </body>
    </html>
  );
}
