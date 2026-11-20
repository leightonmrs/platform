import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ПЦР Академия — учитесь, понимайте, применяйте",
  description: "Учебная платформа по основам ПЦР. Уроки, материалы, тесты и персональный прогресс.",
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
