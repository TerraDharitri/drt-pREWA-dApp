/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/trustwallet/assets/master/blockchains/**",
      },
    ],
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Allow embedding in Safe (this is the correct way)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "frame-ancestors https://app.safe.global https://*.safe.global",
              // allow all HTTPS/WSS backends your app might call (RPCs, APIs, relays)
              "connect-src 'self' https: wss:",
              // keep inline styles for Tailwind/preflight
              "style-src 'self' 'unsafe-inline'",
              // scripts (keep your existing allowances if you need them)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.walletconnect.com https://*.reown.com https://*.cdn.connectkit.dev https://*.vercel.app",
              // images from anywhere + data/blob
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              // iframes for WC modal and (optionally) others
              "frame-src https: data:",
              "form-action 'self'"
            ].join("; ")
          },
          // DO NOT send X-Frame-Options; CSP frame-ancestors replaces it
          // { key: "X-Frame-Options", value: "ALLOWALL" }, // <-- remove this line
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Referrer-Policy", value: "no-referrer" }
        ]
      }
    ];
  }
};

export default nextConfig;
