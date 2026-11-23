import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Институт Лабораторной Медицины КАМЛАБ",
  description: "Каталог курсов Института Лабораторной Медицины КАМЛАБ. Уроки, материалы, тесты и персональный прогресс.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
