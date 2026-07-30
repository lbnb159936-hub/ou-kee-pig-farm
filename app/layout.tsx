import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") || incoming.get("host") || "localhost";
  const protocol = incoming.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/game-static/key-art.png`;
  return {
    title: "欧桑大逃亡 · 今晚不加菜",
    description: "精致像素横版动作肉鸽：看准预警，完美冲刺，救下彩猪，同色四只发动共鸣。",
    openGraph: {
      title: "欧桑大逃亡 · 今晚不加菜",
      description: "像素横版动作肉鸽：会喊欧桑、会完美冲刺的彩猪逃亡记。",
      images: [{ url: imageUrl, width: 1672, height: 941 }],
    },
    twitter: { card: "summary_large_image", images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
