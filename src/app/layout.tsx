import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import { CacheDebugProvider } from "@/app/cache-debug";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Next.js CRUD Cache Demo",
  description: "CRUD với Server Actions, Server Cache và Client Router Cache",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${inter.variable} ${jetBrainsMono.variable}`}>
      <body>
        <Suspense fallback={null}>
          <CacheDebugProvider>{children}</CacheDebugProvider>
        </Suspense>
      </body>
    </html>
  );
}
