import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SJSU Parking Visualization",
  description: "Real-time parking garage utilization tracking and predictions for San José State University",
  keywords: ["SJSU", "parking", "visualization", "real-time", "prediction"],
  authors: [{ name: "SJSU Parking Viz" }],
  viewport: "width=device-width, initial-scale=1",
  openGraph: {
    title: "SJSU Parking Visualization",
    description: "Real-time parking garage utilization tracking and predictions",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}