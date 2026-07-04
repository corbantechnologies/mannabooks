import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Manna Books — Fiscal Ledger & Invoice Console",
    short_name: "Manna Books",
    description: "Multi-tenant fiscal ledgers, KRA eTIMS VAT compliance, and financial intelligence console.",
    start_url: "/workspaces",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    orientation: "any",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
