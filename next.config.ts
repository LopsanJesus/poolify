import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  devIndicators: false,
  images: {
    remotePatterns: [{ hostname: 'flagcdn.com' }],
  },
};

export default nextConfig;
