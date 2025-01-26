import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "@/app/globals.css";

// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MentorLink",
  description: "By: SDC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>

      {children}

    </div>
  );
}
