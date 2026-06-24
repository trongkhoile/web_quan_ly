import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UTRAL BOT PRO - Premium Trading",
  description: "UTRAL BOT PRO cung cấp các tín hiệu vào lệnh hiệu quả để hỗ trợ bạn đưa ra các quyết định đầu tư hiệu quả khi giao dịch",
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
