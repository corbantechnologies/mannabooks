import type { NextConfig } from "next";

// Ensure Node runtime defaults to East Africa Time (EAT)
process.env.TMEZONE = "Africa/Nairobi";

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
