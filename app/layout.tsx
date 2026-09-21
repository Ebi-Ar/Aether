import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Use Geist as it fits the vibe
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AETHER",
  description: "Cinematic landing page builder with motion built in by default.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground h-full overflow-hidden flex flex-col font-sans`}
      >
        <Providers>
          <Header />
          <main className="flex-1 relative w-full overflow-hidden">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
