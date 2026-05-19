import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Teacher Copilot | 教师端 AI 备课与出题助手",
  description: "面向中小学教师的 AI 备课、出题、质检与导出工作台。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen">
        <main className="relative">{children}</main>
      </body>
    </html>
  );
}
