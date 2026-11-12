"use client";

import { Fragment } from "react";
import { InfoPage } from "@/components/info/InfoPage";
import { RichText } from "@/components/info/RichText";
import { getInfoContent } from "@/constants/infoPages";
import { useLanguage } from "@/hooks/useLanguage";

export function AboutContent() {
  const { language } = useLanguage();
  const { title, intro, sections } = getInfoContent(language).about;

  return (
    <InfoPage title={title}>
      <p>
        <RichText parts={intro} />
      </p>
      {sections.map((section) => (
        <Fragment key={section.heading}>
          <h2>{section.heading}</h2>
          {section.blocks.map((block, i) =>
            "p" in block ? (
              <p key={i}>
                <RichText parts={block.p} />
              </p>
            ) : (
              <ul key={i}>
                {block.ul.map((item, j) => (
                  <li key={j}>
                    <RichText parts={item} />
                  </li>
                ))}
              </ul>
            ),
          )}
        </Fragment>
      ))}
    </InfoPage>
  );
}
