import type { Metadata } from "next";
import { ContactContent } from "@/components/info/ContactContent";

export const metadata: Metadata = {
  // i18n-ignore
  title: "Contact",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return <ContactContent />;
}
