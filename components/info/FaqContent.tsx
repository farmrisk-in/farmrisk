"use client";

import { InfoPage } from "@/components/info/InfoPage";
import { RichText } from "@/components/info/RichText";
import { getInfoContent } from "@/constants/infoPages";
import { useLanguage } from "@/hooks/useLanguage";

export function FaqContent() {
  const { language } = useLanguage();
  const { title, items } = getInfoContent(language).faq;

  return (
    <InfoPage title={title}>
      {items.map(({ q, a }) => (
        <section key={q}>
          <h2>{q}</h2>
          <p className="mt-2">
            <RichText parts={a} />
          </p>
        </section>
      ))}
    </InfoPage>
  );
}
