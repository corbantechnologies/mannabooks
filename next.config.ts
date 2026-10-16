import type { NextConfig } from "next";

// Ensure the Node runtime defaults to East Africa Time (EAT)
process.env.TZ = process.env.TZ || "Africa/Nairobi";

const isProd = process.env.NODE_ENV === "production";

// Baseline security headers. The CSP below restricts framing, plugins, <base> and form targets
// without touching scripts/styles (a full script CSP needs nonces; tracked in MODULE_AUDIT_PLAN.md).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
  },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
