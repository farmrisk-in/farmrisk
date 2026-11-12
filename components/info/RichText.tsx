import { Fragment } from "react";
import Link from "next/link";
import { SUPPORT_EMAIL } from "@/components/info/ContactForm";
import type { Rich } from "@/constants/infoPages";

// Renders structured inline content (text, <strong>, links, support email).
export function RichText({ parts }: { parts: Rich }) {
  return (
    <>
      {parts.map((part, i) => {
        if (typeof part === "string") return <Fragment key={i}>{part}</Fragment>;
        if ("strong" in part) return <strong key={i}>{part.strong}</strong>;
        if ("link" in part)
          return (
            <Link key={i} href={part.href}>
              {part.link}
            </Link>
          );
        return (
          <a key={i} href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        );
      })}
    </>
  );
}
