"use client";

import type { ReactNode } from "react";
import { NavBar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";

// Shared layout for the static footer pages (privacy, terms, about, ...).
export function InfoPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <div className="pt-(--standalone)">
      <NavBar type="small" />
      <main className="mx-auto max-w-3xl px-4 pt-28 pb-16 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>
        {updated && (
          <p className="text-muted-foreground mt-2 text-sm">
            Last updated: {updated}
          </p>
        )}
        <div className="mt-8 space-y-6 leading-relaxed [&_a]:underline [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Visible marker for text the team still has to write. Remove before launch.
export function Todo({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-amber-100 px-1 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
      [TODO: {children}]
    </span>
  );
}
