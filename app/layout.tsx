import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Viewport settings for smooth mobile & Play Store (TWA) experience
export const viewport: Viewport = {
  themeColor: "#FF6B00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Application Metadata
export const metadata: Metadata = {
  title: {
    default: "FOOKA WASH - Doorstep Car Care",
    template: "%s | FOOKA WASH",
  },
  description: "Premium doorstep car wash, pressure foam wash & interior detailing service.",
  applicationName: "FOOKA WASH",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FOOKA WASH",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Mobile touch icon fallback */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}