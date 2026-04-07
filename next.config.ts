import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.microsoft.com",
      },
      {
        protocol: "https",
        hostname: "*.microsoftonline.com",
      },
      {
        protocol: "https",
        hostname: "*.live.com",
      },
      {
        protocol: "https",
        hostname: "*.office.com",
      },
      {
        protocol: "https",
        hostname: "*.sharepoint.com",
      },
    ],
  },
};

export default nextConfig;
