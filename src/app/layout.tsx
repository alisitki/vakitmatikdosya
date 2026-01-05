import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vakitmatik - Namaz Vakti Dosyası Oluşturucu",
  description: "Vakitmatik cihazlarınız için namaz vakti dosyalarını kolayca oluşturun ve indirin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} antialiased min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
