import type { NextConfig } from "next";

const nextConfig: any = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  turbopack: {
    root: 'D:/edmin-afterupdate'
  }
};

export default nextConfig as NextConfig;
