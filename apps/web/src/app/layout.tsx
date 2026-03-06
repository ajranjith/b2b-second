import type { Metadata } from "next";
import { Fraunces, Sora } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "@/ui";
import { PageLoader } from "@/components/global/PageLoader";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hotbray | Dealer Portal",
  description: "Next-generation parts distribution platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sora.variable} ${fraunces.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <PageLoader />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
