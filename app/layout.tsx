import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/ThemeProvider";
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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}