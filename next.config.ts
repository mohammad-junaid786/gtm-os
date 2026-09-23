import type { NextConfig } from "next";
const nextConfig: NextConfig = { 
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["radix-ui", "recharts"],
  },
};
export default nextConfig;