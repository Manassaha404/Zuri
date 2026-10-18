import "./globals.css";
import type { Metadata } from "next";
import { GlobalProviders } from "../providers/global";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/providers/auth-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    template: "%s · Zuri",
    default: "Zuri — AI Chat",
  },
  description: "Zuri — Next-generation AI Chat and Intelligent Workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased">
        <GlobalProviders>
          <AuthProvider>{children}</AuthProvider>
        </GlobalProviders>
      </body>
    </html>
  );
}
