import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SocketProvider } from "@/contexts/SocketContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Werewolf PWA",
  description: "A social deduction game",
  generator: "Next.js",
  manifest: "/manifest",
  keywords: ["werewolf", "social", "deduction", "game", "pwa"],
  authors: [
    { name: "Werewolf Team" }
  ],
  openGraph: {
    type: "website",
    siteName: "Werewolf PWA",
    title: {
      default: "Werewolf PWA",
      template: "%s - Werewolf PWA",
    },
    description: "A social deduction game",
  },
  twitter: {
    card: "summary",
    title: {
      default: "Werewolf PWA",
      template: "%s - Werewolf PWA",
    },
    description: "A social deduction game",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Werewolf PWA",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    shortcut: "/favicon.ico",
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#F9FAFB',
  width: 'device-width',
  initialScale: 1.0,
  viewportFit: 'cover',
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SocketProvider>
          {children}
        </SocketProvider>
      </body>
    </html>
  );
}
