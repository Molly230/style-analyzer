import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "美颜风格分析 - AI穿搭推荐",
  description: "基于人脸分析的智能穿搭风格推荐系统",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "美颜分析",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    themeColor: '#ec4899',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} antialiased bg-gradient-to-br from-pink-50 to-purple-50 min-h-screen`}>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {children}
        </main>
      </body>
    </html>
  );
}
