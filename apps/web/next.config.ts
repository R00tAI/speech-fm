import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,
  reactStrictMode: true,
  transpilePackages: ["@speech-fm/core"],
  experimental: {
    optimizeCss: false,
    cssChunking: true,
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  serverExternalPackages: ["puppeteer", "puppeteer-core"],
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "v3b.fal.media", pathname: "/**" },
      { protocol: "https", hostname: "fal.media", pathname: "/**" },
      { protocol: "https", hostname: "*.fal.media", pathname: "/**" },
      { protocol: "https", hostname: "storage.googleapis.com", pathname: "/**" },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
