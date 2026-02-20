import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CursorSparkles from "./components/cursorSparkles";
import { ThemeProvider } from "./context/ThemeContext";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "User Admin Monitoring System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <CursorSparkles />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
