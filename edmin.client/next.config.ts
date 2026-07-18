import type { NextConfig } from "next";

const nextConfig: any = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  }
};

export default nextConfig as NextConfig;
