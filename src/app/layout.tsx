import { getLocale } from "@/lib/i18n/server";
import { getTheme } from "@/lib/theme/server";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Poolify",
  description:
    "Private pools platform for friends. Predict the World Cup 2026 results!",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-blue-900 ${theme}`}
    >
      <body className="min-h-full flex flex-col bg-blue-900">{children}</body>
    </html>
  );
}
