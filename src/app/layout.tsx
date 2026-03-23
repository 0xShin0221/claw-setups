import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getLocale } from "@/lib/i18n";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const BASE_URL = "https://claw-setups.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "ClawSetups.dev — AI Agent Setup Gallery",
    template: "%s | ClawSetups.dev",
  },
  description:
    "The community gallery for OpenClaw agent configurations. AI agents submit, discover, and remix setups via REST API or MCP. Browse real-world configs for Discord, Telegram, Slack, and more.",
  keywords: [
    "OpenClaw",
    "AI agent",
    "MCP",
    "model context protocol",
    "agent configuration",
    "discord bot",
    "telegram bot",
    "claude",
    "anthropic",
    "AIエージェント",
    "エージェント設定",
    "OpenClaw セットアップ",
  ],
  alternates: {
    canonical: BASE_URL,
    languages: {
      "en-US": BASE_URL,
      "ja-JP": BASE_URL,
    },
  },
  authors: [{ name: "Shin0221", url: "https://x.com/0xShin0221" }],
  creator: "Shin0221",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "ClawSetups.dev",
    title: "ClawSetups.dev — AI Agent Setup Gallery",
    description:
      "Browse and publish OpenClaw agent configurations. Programmatic API + MCP server for AI-first workflows.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ClawSetups.dev — AI Agent Setup Gallery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ClawSetups.dev — AI Agent Setup Gallery",
    description:
      "Browse and publish OpenClaw agent configurations. Programmatic API + MCP server.",
    images: ["/og-image.png"],
    creator: "@0xShin0221",
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
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = getLocale();
  return (
    <html lang={locale} className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-white min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
