import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Manna Books | Simple Financial Tracking & Client Flow for SMEs",
    template: "%s | Manna Books"
  },
  description: "Track quotations, automate invoices, manage corporate tax PIN compliance, and monitor client cash flows with zero friction. Built for modern small and medium businesses.",
  keywords: ["SME invoicing software", "KRA tax PIN invoice tracker", "simple bookkeeping", "client flow tracking", "passwordless client billing portal", "Manna Books"],
  authors: [{ name: "Manna Books Engineering" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://mannabooks.com"),
  openGraph: {
    title: "Manna Books | High-Velocity SME Ledger",
    description: "Elegant, zero-friction financial document tracking and client pipelines built from scratch for agile businesses.",
    url: "./",
    siteName: "Manna Books",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className="font-sans min-h-screen flex flex-col bg-white text-black">
        {children}
      </body>
    </html>
  );
}