import type { Metadata } from "next";
import { FaqContent } from "@/components/info/FaqContent";

export const metadata: Metadata = {
  title: "FAQs",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return <FaqContent />;
}
