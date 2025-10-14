// frontend/src/app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL('https://statmindsports.com'),
  title: {
    default: "StatMind Sports - NFL Predictions with 79.7% Accuracy",
    template: "%s | StatMind Sports"
  },
  description: "Advanced NFL game predictions powered by data science. Proven 79.7% accuracy on 2024 season predictions using our 5-component algorithm.",
  keywords: ["NFL predictions", "sports analytics", "football predictions", "data science", "machine learning", "NFL betting", "sports data", "game predictions", "NFL analytics", "StatMind"],
  authors: [{ name: "StatMind Sports" }],
  creator: "StatMind Sports",
  publisher: "StatMind Sports",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://statmindsports.com',
    siteName: 'StatMind Sports',
    title: 'StatMind Sports - NFL Predictions with 79.7% Accuracy',
    description: 'Advanced NFL game predictions powered by data science. Proven 79.7% accuracy on 2024 season predictions.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'StatMind Sports - NFL Predictions',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StatMind Sports - NFL Predictions with 79.7% Accuracy',
    description: 'Advanced NFL game predictions powered by data science. Proven 79.7% accuracy.',
    images: ['/twitter-image.jpg'],
    creator: '@statmindsports',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-white`}>
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}