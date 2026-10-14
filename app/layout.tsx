import type { Metadata, Viewport } from "next";
import { store } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: `${store.name} 가게 관리`,
  appleWebApp: { capable: true, title: store.name, statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#f4f6fa", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
