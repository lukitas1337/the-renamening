import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Renamening",
  description: "Match and rename videos based on metadata - blazing fast, no upload required",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
