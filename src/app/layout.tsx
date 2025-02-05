'use client';
import { Inter } from "next/font/google";
import Navbar from "@/components/subComponents/Navbar";
import "./globals.css";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { initializeEncryptedStorage } from '../utils/encryption';
import { useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    initializeEncryptedStorage();
  }, []);
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        {children}
        <div id="portal-root" />
        <SpeedInsights />
      </body>
    </html>
  );
}
