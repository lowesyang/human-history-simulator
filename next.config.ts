import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    optimizePackageImports: ["react-markdown", "maplibre-gl"],
  },
};

export default nextConfig;
