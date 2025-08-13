// src/components/layout/Footer.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

// ---------- Reusable links ----------
const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li>
    <Link
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="hover:underline"
    >
      {children}
    </Link>
  </li>
);

const DisabledFooterLink = ({ children }: { children: React.ReactNode }) => (
  <li className="relative group cursor-not-allowed">
    <span className="opacity-50">{children}</span>
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
      Coming Soon
    </span>
  </li>
);

// ---------- Brand social icons (match dharitri.org look) ----------
function TelegramBadge({ className = "h-6 w-6" }: { className?: string }) {
  // Circle #229ED9 with white paper-plane
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="24" r="24" fill="#229ED9" />
      <path
        fill="#fff"
        d="M35.7 14.6c.4-.2.9.2.8.6l-3.4 17c-.1.5-.7.7-1.1.5l-6.3-4.7-3.1 3.1c-.3.3-.8.2-.9-.2l-.4-5.1 10.1-9.2c.3-.3-.1-.7-.5-.5l-12.4 7.8-5.2-1.7c-.5-.2-.5-.9 0-1.1l22.4-6.5z"
      />
    </svg>
  );
}

function XBadge({ className = "h-6 w-6" }: { className?: string }) {
  // Black circle with white "X"
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="24" r="24" fill="#000" />
      <path
        fill="#fff"
        d="M31.9 34.5h-3.4L21 23.6l-7.1 10.9h-3.4l8.8-13.5-8.3-12.5h3.4l6.9 10.5 6.8-10.5h3.4l-8.6 13.1 8 13.9z"
      />
    </svg>
  );
}

function LinkedInBadge({ className = "h-6 w-6" }: { className?: string }) {
  // Rounded square #0A66C2 with white "in"
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect x="4" y="4" width="40" height="40" rx="8" fill="#0A66C2" />
      <path
        fill="#fff"
        d="M17.4 20.3v11.5h-4.5V20.3h4.5zm.3-4.6a2.6 2.6 0 1 1-5.2 0 2.6 2.6 0 0 1 5.2 0zM34.9 26v5.8h-4.5v-5.4c0-1.4-.5-2.4-1.8-2.4-1 0-1.6.7-1.9 1.3-.1.2-.1.6-.1.9v5.6H22c.1-9.1 0-10 0-10h4.5v1.6c.6-.9 1.6-2.1 3.9-2.1 2.8 0 4.5 1.9 4.5 5.1z"
      />
    </svg>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  const isExternal = href.startsWith("http");
  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      aria-label={label}
      className="inline-flex items-center justify-center rounded-full transition-transform hover:scale-110 focus:scale-110 focus:outline-none"
    >
      {children}
    </Link>
  );
}

// ---------- Footer ----------
export function Footer() {
  return (
    <footer className="w-full border-t bg-background mt-12">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 lg:col-span-1 mb-6 lg:mb-0">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images/graphics/logo/Dharitri Logo dark.svg"
                alt="Dharitri Logo"
                width={40}
                height={40}
              />
              <span className="text-2xl font-bold">Dharitri</span>
            </Link>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Platform</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <FooterLink href="/">Home</FooterLink>
              <FooterLink href="https://www.dharitri.org/#problem-vision">Problem & Vision</FooterLink>
              <FooterLink href="https://www.dharitri.org/#solution">Our Solution</FooterLink>
              <FooterLink href="https://www.dharitri.org/#ecosystem">Ecosystem</FooterLink>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Token & Community</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <FooterLink href="https://www.dharitri.org/prewa">pREWA Token</FooterLink>
              <FooterLink href="https://www.dharitri.org/join">Get Involved</FooterLink>
              <FooterLink href="https://www.dharitri.org/about">About Us</FooterLink>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Assets</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <FooterLink href="https://www.dharitri.org/resources">Resources</FooterLink>
              <FooterLink href="https://www.dharitri.org/resources">White Paper</FooterLink>
              <FooterLink href="https://www.dharitri.org/contact">Contact Us</FooterLink>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Legal & Compliance</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <DisabledFooterLink>Privacy Policy</DisabledFooterLink>
              <DisabledFooterLink>Terms of Service</DisabledFooterLink>
              <DisabledFooterLink>Disclaimers</DisabledFooterLink>
              <DisabledFooterLink>pREWA Staking Terms</DisabledFooterLink>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Dharitri. All rights reserved.
          </p>

          {/* Socials — brand-colored badges */}
          <div className="flex items-center gap-4">
            <SocialLink href="https://t.me/DharitriCommunity" label="Telegram">
              <TelegramBadge className="h-7 w-7" />
            </SocialLink>

            {/* TODO: replace with your real X handle URL */}
            <SocialLink href="https://x.com/Dharitri_org" label="X (Twitter)">
              <XBadge className="h-7 w-7" />
            </SocialLink>

            <SocialLink href="https://www.linkedin.com/company/dharitrix" label="LinkedIn">
              <LinkedInBadge className="h-7 w-7" />
            </SocialLink>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
