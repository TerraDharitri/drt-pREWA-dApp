import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="text-center py-16">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900">
        Welcome to the pREWA Protocol
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Your gateway to staking, providing liquidity, and managing your pREWA assets securely on the BNB Smart Chain.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button asChild size="lg">
          <Link href="/stake">Stake pREWA</Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/liquidity">Provide Liquidity</Link>
        </Button>
         <Button asChild variant="outline" size="lg">
          <Link href="/dashboard">View Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}