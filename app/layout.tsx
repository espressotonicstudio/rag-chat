import { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { WebVitals } from "@/lib/axiom/client";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SWRProvider } from "@/components/swr-provider";

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://ai-sdk-preview-internal-knowledge-base.vercel.app"
  ),
  title: "Internal Knowledge Base",
  description:
    "Internal Knowledge Base using Retrieval Augmented Generation and Middleware",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className="flex flex-col h-dvh bg-white dark:bg-zinc-900">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster position="top-center" />
            <NuqsAdapter>
              <SWRProvider>{children}</SWRProvider>
            </NuqsAdapter>
          </ThemeProvider>
        </SessionProvider>
        <WebVitals />
      </body>
    </html>
  );
}
