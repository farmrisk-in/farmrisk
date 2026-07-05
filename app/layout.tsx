import type { Metadata } from "next";
import "./globals.css";
import { content } from "../constants/content";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/providers/AuthProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import QueryProvider from "@/providers/QueryProvider";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
export const metadata: Metadata = {
  title: content.en.title,
  description: content.en.description,
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
        <link rel="manifest" href="/manifest.json" />
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
      </body>
    </html>
  );
}
