import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "欧记猪肉 · 欧桑养猪场",
  description: "点击招牌进入趣味养猪场，每点一下，都会诞生一头会喊欧桑的小猪。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
