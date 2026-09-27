import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.mannabooks.co.ke",
      },
    ],
  },
};

export default nextConfig;
