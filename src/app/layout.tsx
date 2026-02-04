import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import { SWRProvider } from "@/providers/swr-provider"
import { AppDataProvider } from "@/providers/app-data-provider"
import { Toaster } from "sonner"
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flat Manager - Manage Shared Expenses",
  description: "The easiest way to manage shared expenses with your flatmates. Track meals, utilities, shopping, and more.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Flat Manager",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Flat Manager",
    title: "Flat Manager - Manage Shared Expenses",
    description: "The easiest way to manage shared expenses with your flatmates.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f9d7a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SWRProvider>
              <AppDataProvider>
                {children}
              </AppDataProvider>
            </SWRProvider>
            <PWAInstallPrompt />
            <Toaster 
              position="top-center" 
              richColors 
              closeButton
              toastOptions={{
                duration: 3000,
                className: 'text-sm'
              }}
            />
          </ThemeProvider>
      </body>
    </html>
  );
}
