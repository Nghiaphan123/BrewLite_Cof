import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ReactNode } from "react";
import { CartStoreHydration } from "@/components/CartStoreHydration";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
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
  title: "BrewLite | Cà phê và thức uống",
  description: "Chọn thức uống yêu thích và đặt hàng tới BrewLite.",
  applicationName: "BrewLite",
  appleWebApp: {
    capable: true,
    title: "BrewLite",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#6F4E37",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full bg-white antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col bg-white text-neutral-900">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
