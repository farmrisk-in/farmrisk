import type { Metadata } from "next";
import { MarkdownDocPage } from "@/components/info/MarkdownDocPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
};

// Content: content/privacy-policy.md
export default function PrivacyPage() {
  return <MarkdownDocPage title="Privacy Policy" file="privacy-policy.md" />;
}
