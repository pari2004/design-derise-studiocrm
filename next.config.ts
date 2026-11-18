import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
  },
  typescript: {
    // Type-checking runs in CI/editor; don't block dev builds on it.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
