import type { Metadata } from "next";
import "./globals.css";
import ScrollUI from "@/components/ScrollUI";

export const metadata: Metadata = {
  title: "Golden Shadow Publishing — IP Marketplace for Creators & Executives",
  description:
    "The marketplace where creators and executives turn intellectual property into books, products, and enduring revenue — no algorithms, just authentic partnerships and real assets.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <ScrollUI />
      </body>
    </html>
  );
}
