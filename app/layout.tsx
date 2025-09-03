import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SJSU Parking Visualization - Real-time Garage Utilization",
  description: "Real-time parking garage utilization tracking and predictions for San José State University. Accessible dashboard with live data, forecasts, and analytics.",
  keywords: ["SJSU", "parking", "visualization", "real-time", "prediction", "accessibility", "dashboard"],
  authors: [{ name: "SJSU Parking Viz Team" }],
  creator: "SJSU Parking Viz",
  publisher: "San José State University",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "SJSU Parking Visualization - Real-time Garage Utilization",
    description: "Real-time parking garage utilization tracking and predictions for San José State University",
    type: "website",
    locale: "en_US",
    siteName: "SJSU Parking Dashboard",
  },
  twitter: {
    card: "summary_large_image",
    title: "SJSU Parking Visualization",
    description: "Real-time parking garage utilization tracking and predictions",
  },
  category: "Transportation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Real-time parking garage utilization tracking and predictions for San José State University" />
        <meta name="keywords" content="SJSU, parking, visualization, real-time, prediction, accessibility" />
        <title>SJSU Parking Visualization</title>
      </head>
      <body className={inter.className}>
        {/* Skip to main content link */}
        <a
          href="#main-content"
          className="skip-link"
        >
          Skip to main content
        </a>

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <header role="banner" className="sr-only">
              <h1>SJSU Parking Dashboard</h1>
              <p>Real-time parking garage utilization tracking and predictions</p>
            </header>

            <main id="main-content" role="main" className="flex-1">
              {children}
            </main>

            <footer role="contentinfo" className="sr-only">
              <p>San José State University Parking Visualization Dashboard</p>
            </footer>
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}