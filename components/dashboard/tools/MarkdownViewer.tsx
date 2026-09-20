"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

export interface MarkdownViewerProps {
  content?: string | null;
  className?: string;
  emptyMessage?: string;
  emptySubtext?: string;
}

/**
 * Normalizes RAG/LLM markdown outputs that may arrive with:
 * 1. Literal "\\n" escape sequences instead of real newlines (JSON transport artifact)
 * 2. Flattened single-line tables where all rows are concatenated on one line
 * 3. Callout blockquotes not preceded by a blank line
 *
 * SAFETY: Only lines where a separator row (| :--- |) appears AFTER other pipe content
 * on the same line are treated as flat. Standalone separator lines, header lines, and
 * data rows that are already on their own lines are left completely untouched.
 */
function preprocessMarkdown(text: string): string {
  if (!text) return "";

  // Step 1: Unescape literal \n sequences from JSON transport
  let formatted = text.replace(/\\n/g, "\n");

  // Step 2: Normalize callouts — ensure a blank line before "> Warning:" etc.
  formatted = formatted.replace(
    /([^\n])\s*>\s*(Warning|Tip|Note|Important|Caution):?/gi,
    "$1\n\n> **$2:**",
  );

  // Step 3: Fix flattened tables line-by-line.
  // A "flat" line is one where the separator row (| :--- | or | --- |) appears
  // AFTER some non-separator pipe content on the SAME line — meaning header + separator
  // + data rows were all jammed together. We detect this with a regex that requires
  // at least one non-dash, non-colon cell BEFORE the first separator segment.
  //
  // Example flat line:
  //   "| Operation | Timing | Detail | | :--- | :--- | :--- | | Deep Ploughing | ..."
  //
  // Example NOT flat (standalone separator line — leave untouched):
  //   "| :--- | :--- | :--- |"
  //
  // Detection: line starts with |, and the pattern [non-sep content] | | :--- appears.
  const FLAT_TABLE_RE = /^\|[^-:|][^|]*\|.*\|\s*:?-+:?\s*\|/;

  const lines = formatted.split("\n");
  const fixedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (FLAT_TABLE_RE.test(trimmed)) {
      // Protect separator segments like "| :--- " from being split as a row boundary
      // by tagging the pipe that ENDS a separator cell with a sentinel.
      const sentineled = trimmed.replace(
        /\|\s*:?-+:?\s*(?=\|)/g,
        (m) => m.trimEnd() + "\x00",
      );

      // Split on "| |" (row boundary = closing pipe of one row + opening pipe of next)
      const parts = sentineled
        .split(/\|\s*\|/)
        .map((p) => p.replace(/\x00/g, "").trim())
        .filter(Boolean);

      // Rebuild each row: ensure leading and trailing pipes
      const rows = parts.map((p) => {
        const withTrailing = p.endsWith("|") ? p : p + " |";
        return withTrailing.startsWith("|") ? withTrailing : "| " + withTrailing;
      });

      fixedLines.push(...rows);
      continue;
    }

    fixedLines.push(line);
  }

  formatted = fixedLines.join("\n");

  // Step 4: Ensure a blank line before a table block that immediately follows
  // non-pipe prose, so remark-gfm sees it as a block-level element.
  formatted = formatted.replace(/([^\n|][^\n]*)\n(\|)/g, "$1\n\n$2");

  // Step 5: Separate inline bullet items after table cells or sentence endings
  formatted = formatted.replace(/\|\s*-\s+([A-Za-z0-9*])/g, "|\n\n- $1");
  formatted = formatted.replace(/([.!?:])\s+-\s+([A-Za-z0-9*])/g, "$1\n\n- $2");

  // Step 6: Remove leftover solitary pipe lines
  formatted = formatted.replace(/^\s*\|\s*$/gm, "");

  return formatted.trim();
}

/**
 * Base Markdown parser for RAG/AI generated agronomic reports.
 * Formats headings, tables, callouts, lists, and code blocks cleanly
 * adhering to the FarmRisk emerald theme and dark/light modes.
 */
export function MarkdownViewer({
  content,
  className,
  emptyMessage = "No information available yet",
  emptySubtext = "Generated advisory guidelines will appear here.",
}: MarkdownViewerProps) {
  if (!content || !content.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-7 px-4 text-center select-none">
        <div className="flex size-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground/60 mb-2">
          <FileText className="size-4.5" />
        </div>
        <p className="text-xs font-semibold text-foreground/80">{emptyMessage}</p>
        {emptySubtext && (
          <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm">
            {emptySubtext}
          </p>
        )}
      </div>
    );
  }

  const cleanContent = preprocessMarkdown(content);

  return (
    <div
      className={cn(
        "markdown-body text-xs sm:text-sm text-foreground/90 leading-relaxed overflow-hidden",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => (
            <h1
              className="text-base sm:text-lg font-bold text-foreground mt-3 mb-2 pb-1 border-b border-border"
              {...props}
            />
          ),
          h2: ({ ...props }) => (
            <h2
              className="text-sm sm:text-base font-bold text-foreground mt-3 mb-1.5 flex items-center gap-1.5"
              {...props}
            />
          ),
          h3: ({ ...props }) => (
            <h3
              className="text-xs sm:text-sm font-semibold text-foreground mt-2 mb-1"
              {...props}
            />
          ),
          h4: ({ ...props }) => (
            <h4
              className="text-xs font-semibold text-foreground mt-2 mb-1"
              {...props}
            />
          ),
          p: ({ ...props }) => (
            <p className="mb-2 leading-relaxed last:mb-0" {...props} />
          ),
          strong: ({ ...props }) => (
            <strong className="font-semibold text-foreground" {...props} />
          ),
          em: ({ ...props }) => <em className="italic" {...props} />,
          ul: ({ ...props }) => (
            <ul
              className="list-disc pl-4 space-y-1 mb-2 text-foreground/90"
              {...props}
            />
          ),
          ol: ({ ...props }) => (
            <ol
              className="list-decimal pl-4 space-y-1 mb-2 text-foreground/90"
              {...props}
            />
          ),
          li: ({ ...props }) => (
            <li className="leading-relaxed pl-0.5" {...props} />
          ),
          blockquote: ({ ...props }) => (
            <blockquote
              className="border-l-3 border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 px-3 py-1.5 my-2 rounded-r-md text-xs italic text-foreground/90"
              {...props}
            />
          ),
          table: ({ ...props }) => (
            <div className="my-2.5 w-full overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs border-collapse" {...props} />
            </div>
          ),
          thead: ({ ...props }) => (
            <thead
              className="bg-muted/70 text-foreground font-semibold border-b border-border"
              {...props}
            />
          ),
          tbody: ({ ...props }) => (
            <tbody className="divide-y divide-border/60" {...props} />
          ),
          tr: ({ ...props }) => (
            <tr
              className="hover:bg-muted/30 transition-colors even:bg-muted/20"
              {...props}
            />
          ),
          th: ({ ...props }) => (
            <th
              className="px-3 py-2 text-foreground font-semibold tracking-wider text-[11px] uppercase border-r border-border last:border-r-0"
              {...props}
            />
          ),
          td: ({ ...props }) => (
            <td
              className="px-3 py-1.5 text-foreground/90 border-r border-border last:border-r-0"
              {...props}
            />
          ),
          code: ({ ...props }) => (
            <code
              className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-medium"
              {...props}
            />
          ),
          hr: ({ ...props }) => <hr className="my-3 border-border" {...props} />,
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownViewer;
