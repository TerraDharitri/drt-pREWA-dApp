// src/components/dashboard/TrustCard.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ExternalLink, Shield, FileText, Wallet } from "lucide-react";
import Link from "next/link";

export function TrustCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Safety & Transparency</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <TrustLink
            href="/security#contracts"
            label="View Contracts"
            icon={Wallet}
          />
          <TrustLink href="/security#audits" label="Read Audits" icon={FileText} />
          <TrustLink href="/security#governance" label="Multisig & Roles" icon={Shield} />
           <TrustLink 
            href="https://dappbay.bnbchain.org/risk-scanner" 
            label="Risk Scanner" 
            icon={ExternalLink} 
            isExternal
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Audits reduce risk, but don’t eliminate it. Always do your own research.
        </p>
      </CardContent>
    </Card>
  );
}

function TrustLink({
  href,
  label,
  icon: Icon,
  isExternal = false
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isExternal?: boolean;
}) {
  return (
    <Button
      variant="outline"
      className="justify-start"
      asChild
    >
      <Link href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined}>
        <Icon className="mr-2 h-4 w-4" /> {label}
        {isExternal && <ExternalLink className="ml-auto h-3.5 w-3.5" />}
      </Link>
    </Button>
  );
}