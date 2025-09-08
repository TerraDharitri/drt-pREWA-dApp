// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/trustwallet/assets/master/blockchains/**",
      },
      {
        protocol: "https",
        hostname: "assets.coingecko.com",
        pathname: "/coins/images/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "frame-ancestors https://app.safe.global https://*.safe.global",
              "connect-src 'self' https: wss:",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.walletconnect.com https://*.reown.com https://*.cdn.connectkit.dev https://*.vercel.app",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "frame-src https: data:",
              "form-action 'self'"
            ].join("; ")
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Referrer-Policy", value: "no-referrer" }
        ]
      }
    ];
  },

  // --- ADD THIS WEBPACK CONFIGURATION ---
  webpack(config, { isServer }) {
    // Tell Webpack to ignore bundling the native binary for @resvg/resvg-js on the server.
    if (isServer) {
      config.externals.push('@resvg/resvg-js');
    }

    return config;
  },
};

export default nextConfig;