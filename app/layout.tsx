import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoginPage from "@/app/(pages)/auth/login/page";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TMS  ",
  description: "Conditional layout based on auth",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = true; // ⬅️ Change to true to show dashboard

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {isAuthenticated ? (
          <DashboardLayout>{children}</DashboardLayout>
        ) : (
          <LoginPage />
        )}
      </body>
    </html>
  );
}
