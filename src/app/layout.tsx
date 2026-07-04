import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "react-hot-toast";

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
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Manna Books",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

import { QueryProvider } from "@/providers/QueryProvider";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className="font-sans min-h-screen flex flex-col bg-white text-black">
        <QueryProvider>
          {children}
          <PWAInstallPrompt />
        </QueryProvider>
        <Analytics />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#000000',
              color: '#ffffff',
              border: '1px solid #000000',
              borderRadius: '0px',
              fontFamily: 'var(--font-roboto-mono), monospace',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            },
            success: {
              iconTheme: {
                primary: '#ffffff',
                secondary: '#000000',
              },
            },
            error: {
              iconTheme: {
                primary: '#ffffff',
                secondary: '#000000',
              },
            },
          }}
        />
      </body>
    </html>
  );
}