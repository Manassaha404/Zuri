import "./globals.css";
import { GlobalProviders } from "../providers/global";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/providers/auth-provider";
const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body
      >
        <GlobalProviders>
          <AuthProvider>{children}</AuthProvider>
        </GlobalProviders>
      </body>
    </html>
  );
}
