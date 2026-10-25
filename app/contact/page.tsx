import type { Metadata } from "next";
import { InfoPage, Todo } from "@/components/info/InfoPage";
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
      <p>
        <Todo>phone / WhatsApp number and postal address, if you want them shown</Todo>
      </p>
      <ContactForm />
    </InfoPage>
  );
}
