// next.config.mjs

/** @type {import('next').NextConfig} */
const CSP =
  "frame-ancestors 'self' https://app.safe.global https://*.safe.global";

const nextConfig = {
  // Allow loading token icons from the Trust Wallet repo
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        port: "",
        pathname: "/trustwallet/assets/master/blockchains/**",
      },
    ],
  },

  // Experimental flags
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },

  // Add CSP so Safe can embed this app in an iframe
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
