import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { AppFeedback } from "@/components/AppFeedback";
import { CartStoreHydration } from "@/components/CartStoreHydration";
import { CartSync } from "@/components/CartSync";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Font cho các tiêu đề `font-serif`. Trước đây `font-serif` rơi về Georgia của Windows, font này
// thiếu chữ tiếng Việt có hai dấu (ề, ở, ữ...) nên "Bảng điều khiển" hiện thành "điề`u".
// Lora có bộ ký tự tiếng Việt đầy đủ (subset "vietnamese").
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "BrewLite | Cà phê và thức uống",
  description: "Chọn thức uống yêu thích và đặt hàng tới BrewLite.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} h-full bg-white antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col bg-white text-neutral-900">
        <CartStoreHydration />
        <CartSync />
        <ServiceWorkerRegister />
        {children}
        {/* usePathname cần Suspense để các route động vẫn prerender được (cacheComponents). */}
        <Suspense fallback={null}>
          <AppFeedback />
        </Suspense>
      </body>
    </html>
  );
}
