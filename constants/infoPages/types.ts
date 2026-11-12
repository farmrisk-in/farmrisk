/** Inline piece of a paragraph. Plain strings are rendered as text. */
export type RichPart =
  | string
  | { strong: string }
  | { link: string; href: string }
  /** Renders the support email as a mailto link. */
  | { email: true };

export type Rich = RichPart[];

export type Block =
  | { p: Rich }
  | { ul: Rich[] };

export type Section = { heading: string; blocks: Block[] };

export type TopicKey =
  | "general"
  | "bugReport"
  | "featureRequest"
  | "dataAccuracy"
  | "other";

export type InfoContent = {
  about: { title: string; intro: Rich; sections: Section[] };
  faq: { title: string; items: { q: string; a: Rich }[] };
  contact: {
    title: string;
    intro: Rich;
    form: {
      topicLabel: string;
      /** Display names only; the English topic is what gets stored. */
      topics: Record<TopicKey, string>;
      messageLabel: string;
      send: string;
      sent: string;
      /** `link` is a mailto link with the message prefilled. */
      failed: { before: string; link: string; after: string };
    };
  };
};
