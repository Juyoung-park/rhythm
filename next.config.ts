import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    esmExternals: false,
  },
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
};

export default nextConfig;
