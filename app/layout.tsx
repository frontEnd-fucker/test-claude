import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./providers";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Header } from "@/components/layout/Header";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vibe Coders PM - Project Management",
  description: "Modern project management application for developers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SupabaseProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <Header />
              <main className="container mx-auto p-4">{children}</main>
              <Toaster position="bottom-right" expand={false} richColors />
            </ThemeProvider>
          </QueryProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
