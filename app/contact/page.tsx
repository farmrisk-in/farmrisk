import type { Metadata } from "next";
import { InfoPage } from "@/components/info/InfoPage";
import { ContactForm, SUPPORT_EMAIL } from "@/components/info/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <InfoPage title="Contact us">
      <p>
        Send us a question, a bug report or an idea using the form below, or
        email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
      <ContactForm />
    </InfoPage>
  );
}
