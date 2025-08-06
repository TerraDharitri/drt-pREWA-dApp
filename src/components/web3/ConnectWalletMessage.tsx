import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/Card";

export function ConnectWalletMessage() {
  return (
    <Card className="mx-auto mt-8 max-w-md">
      <CardHeader>
        <CardTitle>Connect Your Wallet</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          Please connect your wallet to view this page and interact with the
          pREWA Protocol.
        </p>
      </CardContent>
    </Card>
  );
}
