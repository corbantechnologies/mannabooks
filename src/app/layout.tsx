import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "react-hot-toast";

const googleSans = localFont({
  src: [
    {
      path: "../../public/fonts/GoogleSans-VariableFont_GRAD,opsz,wght.ttf",
      style: "normal",
    },
    {
      path: "../../public/fonts/GoogleSans-Italic-VariableFont_GRAD,opsz,wght.ttf",
      style: "italic",
    }
  ],
  variable: "--font-google-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Manna Books | KRA eTIMS Invoicing, Statutory Payroll & Business Analytics for Kenyan SMEs",
    template: "%s | Manna Books",
  },
  description:
    "Manna Books is the all-in-one financial platform for Kenyan businesses. Issue KRA eTIMS multi-rate invoices, automate monthly 20th VAT returns, run statutory payroll (PAYE, SHIF, AHL, NSSF), manage walk-in POS sales with automatic stock deduction, and track COGS profitability analytics — all in one workspace.",
  keywords: [
    "KRA eTIMS invoicing Kenya",
    "invoicing software Kenya",
    "Kenya statutory payroll software",
    "PAYE calculator Kenya",
    "SHIF NSSF AHL payroll Kenya",
    "SME accounting software Kenya",
    "VAT return tracker Kenya",
    "20th VAT Kenya",
    "walk-in POS Kenya",
    "inventory management Kenya",
    "COGS profit margin tracker",
    "accounts receivable aging Kenya",
    "passwordless client billing portal",
    "Manna Books",
    "mannabooks.co.ke",
    "KRA PIN compliance software",
    "business management software Kenya",
    "Corban Technologies",
  ],
  authors: [{ name: "Manna Books — Corban Technologies LTD" }],
  metadataBase: new URL("https://mannabooks.co.ke"),
  openGraph: {
    title: "Manna Books | KRA eTIMS, Statutory Payroll & POS for Kenyan SMEs",
    description:
      "Issue multi-rate KRA invoices, automate 20th VAT returns, run statutory payroll, manage walk-in POS sales with stock deduction, and track COGS margins — built for Kenyan and African SMEs.",
    url: "https://mannabooks.co.ke",
    siteName: "Manna Books",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Manna Books | KRA eTIMS Invoicing, Payroll & POS for Kenyan SMEs",
    description:
      "The complete financial operating system for Kenyan businesses: eTIMS invoicing, statutory payroll, walk-in POS, COGS analytics, and 20th VAT return automation.",
    site: "@mannabooks",
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
    <html lang="en" className={`${googleSans.variable}`}>
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
              background: '#18181b',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              fontFamily: 'var(--font-google-sans), sans-serif',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
              padding: '10px 14px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}