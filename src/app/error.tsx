// src/app/error.tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const msg = error?.message || "";
  const isWcTimeout = /(proposal expired|no matching key|session topic doesn't exist)/i.test(msg);

  return (
    <html>
      <body className="p-6">
        <h2 className="text-lg font-semibold">
          {isWcTimeout ? "WalletConnect request timed out" : "Something went wrong"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isWcTimeout
            ? "Your previous session may have expired. Please open your wallet to approve the connection, then try again."
            : "Please try again or reload the page."}
        </p>
        <button onClick={() => reset()} className="mt-4 rounded-md border px-3 py-1.5">
          Retry
        </button>
      </body>
    </html>
  );
}