import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
  title: "Edmin | University Portal",
  description: "Advanced Management System for Faculty, Students, and HR",
};

import { AppProviders } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        <AppProviders>
          {children}
        </AppProviders>
        <Toaster
          richColors
          position="top-center"
          closeButton
          toastOptions={{
            classNames: {
              toast: "!flex !items-center !justify-between !w-full !p-4 !gap-4",
              title: "!font-semibold !text-sm",
              description: "!text-xs !text-text-secondary",
              closeButton: "!static !order-last !ml-auto !bg-transparent hover:!bg-black/5 !border-none !text-text-secondary !transform-none !top-auto !left-auto !right-auto"
            }
          }}
        />
      </body>
    </html>
  );
}
