import type { Metadata } from "next";
import { MarkdownDocPage } from "@/components/info/MarkdownDocPage";

export const metadata: Metadata = {
  // i18n-ignore
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
};

// Content: content/privacy-policy.md
export default function PrivacyPage() {
  // i18n-ignore
  return <MarkdownDocPage title="Privacy Policy" file="privacy-policy.md" />;
}
