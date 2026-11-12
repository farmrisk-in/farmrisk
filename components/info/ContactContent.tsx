"use client";

import { ContactForm } from "@/components/info/ContactForm";
import { InfoPage } from "@/components/info/InfoPage";
import { RichText } from "@/components/info/RichText";
import { getInfoContent } from "@/constants/infoPages";
import { useLanguage } from "@/hooks/useLanguage";

export function ContactContent() {
  const { language } = useLanguage();
  const { title, intro } = getInfoContent(language).contact;

  return (
    <InfoPage title={title}>
      <p>
        <RichText parts={intro} />
      </p>
      <ContactForm />
    </InfoPage>
  );
}
