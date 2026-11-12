import type { Metadata } from "next";
import { MarkdownDocPage } from "@/components/info/MarkdownDocPage";

export const metadata: Metadata = {
  // i18n-ignore
  title: "Account and Data Deletion",
  alternates: { canonical: "/delete-account" },
};

// Public account-deletion page required by Google Play.
// Content: content/delete-account.md
export default function DeleteAccountPage() {
  return (
    // i18n-ignore
    <MarkdownDocPage title="Account and Data Deletion" file="delete-account.md" />
  );
}
