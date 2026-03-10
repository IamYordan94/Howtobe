import type { Metadata } from "next";
import { DM_Serif_Display, DM_Mono } from "next/font/google";
import "./globals.css";

const dmSerif = DM_Serif_Display({ weight: "400", subsets: ["latin"], variable: "--font-dm-serif" });
const dmMono = DM_Mono({ weight: ["300", "400", "500"], subsets: ["latin"], variable: "--font-dm-mono" });

import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: {
    default: "How To Be Human",
    template: "%s — How To Be Human",
  },
  description: "The complete guide to being a human being. 50 essential subjects. Pay once, learn everything, forever.",
  openGraph: {
    siteName: "How To Be Human",
    title: "How To Be Human — The Complete Guide to Being a Complete Person",
    description: "The complete guide to being a human being. 50 essential subjects. Pay once, learn everything, forever.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "How To Be Human",
    description: "50 essential subjects. Pay once, learn everything, forever.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSerif.variable} ${dmMono.variable} font-mono antialiased`}>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
