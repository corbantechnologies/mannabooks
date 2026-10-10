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
  async rewrites() {
    const apiTarget = (process.env.API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiTarget}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
