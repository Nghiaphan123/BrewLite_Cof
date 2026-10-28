import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
<<<<<<< HEAD
=======
import { ReactNode } from "react";
import { CartStoreHydration } from "@/components/CartStoreHydration";
>>>>>>> bb876c0 (feat(web): auth flow, profile, order details)
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
  title: "BrewLite | CA� phA� vA� th��cc u��`ng",
  description: "Ch��?n th��cc u��`ng yA�u thA-ch vA� �`���t hA�ng t���i BrewLite.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
