import type { Metadata } from "next";
import { MarkdownDocPage } from "@/components/info/MarkdownDocPage";

export const metadata: Metadata = {
  title: "Account and Data Deletion",
  alternates: { canonical: "/delete-account" },
};

// Public account-deletion page required by Google Play.
// Content: content/delete-account.md
export default function DeleteAccountPage() {
  return (
    <MarkdownDocPage title="Account and Data Deletion" file="delete-account.md" />
  );
}
