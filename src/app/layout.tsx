'use client';
import { Inter } from "next/font/google";
import Navbar from "@/components/subComponents/Navbar";
import "./globals.css";
import { SpeedInsights } from '@vercel/speed-insights/next';
// import { initializeEncryptedStorage } from '../utils/encryption';
import { useEffect } from "react";
import { useRouter } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  useEffect(() => {
    // initializeEncryptedStorage();

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        console.log('Escape key pressed');
        if (window.location.pathname !== '/pages/admin/admindashboard' && window.location.pathname !== '/pages/mentordashboard' && window.location.pathname !== '/') {
          router.back();
        }
        if (window.location.pathname === '/about' || window.location.pathname === '/pages/meetings/mreport') {
          router.back();
        }
      }
    };

    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [router]);
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=0.90" />
      </head>
      <body className={inter.className}>
        <Navbar />
        {children}
        <div id="portal-root" />
        <SpeedInsights />
      </body>
    </html>
  );
}
