import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingExcludes: {
    "*": [
      "./dist/**",
      "./build/**",
      "./public/geojson/snapshots/**",
      "./electron/**",
      "./scripts/**",
      "./docs/**",
    ],
  },
  experimental: {
    optimizePackageImports: ["react-markdown", "maplibre-gl"],
  },
};

export default nextConfig;
