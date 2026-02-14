import type { Metadata, Viewport } from "next";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import ThemeProvider from "@/components/ThemeProvider";
import { Inter, JetBrains_Mono, Share_Tech_Mono } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

const shareTechMono = Share_Tech_Mono({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-share-tech-mono',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: '%s | ThreatForge',
    default: 'ThreatForge - AI-Powered Threat Detection Platform',
  },
  description: "Advanced AI-powered cybersecurity platform for detecting malware, steganography, and network anomalies in real-time.",
  keywords: ['cybersecurity', 'AI', 'threat detection', 'malware analysis', 'steganography', 'network security', 'SOC'],
  authors: [{ name: 'ThreatForge Team' }],
  creator: 'ThreatForge',
  publisher: 'ThreatForge',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://threatforge.ai',
    title: 'ThreatForge - AI-Powered Threat Detection',
    description: 'Advanced AI-powered cybersecurity platform for detecting malware, steganography, and network anomalies in real-time.',
    siteName: 'ThreatForge',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ThreatForge Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ThreatForge - AI-Powered Threat Detection',
    description: 'Advanced AI-powered cybersecurity platform for detecting malware, steganography, and network anomalies in real-time.',
    images: ['/og-image.jpg'],
    creator: '@threatforge',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${shareTechMono.variable} antialiased text-text-main bg-background-light dark:bg-[#0d1117] dark:text-[#e6edf3] transition-colors duration-300 font-sans`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
