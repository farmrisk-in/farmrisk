import type { LanguageCode } from "@/constants/languages/registry";
import { as } from "./as";
import { bn } from "./bn";
import { en } from "./en";
import { gu } from "./gu";
import { hi } from "./hi";
import { kn } from "./kn";
import { ml } from "./ml";
import { mr } from "./mr";
import { pa } from "./pa";
import { ta } from "./ta";
import { te } from "./te";
import type { InfoContent } from "./types";

export type { InfoContent, Rich, RichPart, Block, Section, TopicKey } from "./types";

// Only ready languages have translations; drafts fall back to English.
const CONTENT: Partial<Record<LanguageCode, InfoContent>> = { as, bn, en, gu, hi, kn, ml, mr, pa, ta, te };

export function getInfoContent(language: string): InfoContent {
  return CONTENT[language as LanguageCode] ?? en;
}
