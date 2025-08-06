/** @type {import('next').NextConfig} */
const nextConfig = {
  // This configuration is essential for loading token icons from the Trust Wallet repository.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/trustwallet/assets/master/blockchains/**',
      },
    ],
  },
  // Adding this experimental flag can sometimes resolve stubborn HMR/chunking issues in development.
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;