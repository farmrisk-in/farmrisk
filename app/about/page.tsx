import type { Metadata } from "next";
import { AboutContent } from "@/components/info/AboutContent";

export const metadata: Metadata = {
  // i18n-ignore
  title: "About",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <AboutContent />;
}
