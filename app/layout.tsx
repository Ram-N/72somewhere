import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "72 Somewhere - Find Your Perfect Weather Destination",
  description: "Discover travel destinations based on your ideal weather conditions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
