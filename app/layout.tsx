import type { Metadata } from "next";
import "./globals.css";
import { content } from "../constants/content";
import { siteUrl } from "@/lib/siteUrl";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/providers/AuthProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import QueryProvider from "@/providers/QueryProvider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${content.en.title} – ${content.en.seoTagline}`,
    template: `%s | ${content.en.title}`,
  },
  description: content.en.description,
  applicationName: content.en.title,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: content.en.title,
    title: `${content.en.title} – ${content.en.seoTagline}`,
    description: content.en.description,
    url: "/",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${content.en.title} – ${content.en.seoTagline}`,
    description: content.en.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className="overflow-x-hidden"
      lang="en"
      suppressContentEditableWarning={true}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </head>

      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <LanguageProvider>
            <AuthProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </AuthProvider>
          </LanguageProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
