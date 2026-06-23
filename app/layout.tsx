import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Giao Dịch Tự Động",
  description: "Kết nối tài khoản MT5 và để bot giao dịch sinh lời tự động 24/7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
