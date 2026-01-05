"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { useEffect } from 'react';
import { setThemeVariables } from '@/lib/theme';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    const saved = localStorage.getItem('vakitmatik_ui_prefs');
    if (saved) {
      const parsed = JSON.parse(saved);
      setThemeVariables(parsed.theme);
    } else {
      setThemeVariables('A');
    }
  }, []);

  return (
    <html lang="tr">
      <body className={`${inter.variable} antialiased min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
