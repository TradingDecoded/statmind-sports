import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "../components/Navigation";
import { AuthProvider } from "../contexts/AuthContext";
import { SMSBucksProvider } from '../contexts/SMSBucksContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "StatMind Sports - AI-Powered NFL Predictions",
  description: "79.7% accurate NFL predictions powered by advanced analytics",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <SMSBucksProvider>
            <Navigation />
            <main>{children}</main>
          </SMSBucksProvider>
        </AuthProvider>
      </body>
    </html>
  );
}