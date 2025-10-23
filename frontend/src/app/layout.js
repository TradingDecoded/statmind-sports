'use client';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "../components/Navigation";
import FeedbackModal from "../components/FeedbackModal";
import { AuthProvider } from "../contexts/AuthContext";
import { SMSBucksProvider } from '../contexts/SMSBucksContext';
import { useState } from 'react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <title>StatMind Sports - AI-Powered NFL Predictions</title>
        <meta name="description" content="79.7% accurate NFL predictions powered by advanced analytics" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <SMSBucksProvider>
            <Navigation onFeedbackClick={() => setIsFeedbackOpen(true)} />
            <main>{children}</main>
            <FeedbackModal 
              isOpen={isFeedbackOpen} 
              onClose={() => setIsFeedbackOpen(false)} 
            />
          </SMSBucksProvider>
        </AuthProvider>
      </body>
    </html>
  );
}