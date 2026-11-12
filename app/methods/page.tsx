import type { Metadata } from "next";
import { MarkdownDocPage } from "@/components/info/MarkdownDocPage";

export const metadata: Metadata = {
  // i18n-ignore
  title: "Methods",
  // i18n-ignore
  description: "How FarmRisk computes root-zone soil moisture: model, calibration, inputs and limitations.",
  alternates: { canonical: "/methods" },
};

// Content: content/methods.md (English only for now)
export default function MethodsPage() {
  // i18n-ignore
  return <MarkdownDocPage title="FarmRisk Methods" file="methods.md" />;
}
