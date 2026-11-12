import { en } from "./languages/en";
import type { LanguageCode } from "./languages/registry";

export type { LanguageCode } from "./languages/registry";
export type TranslationType = typeof en;

/**
 * English is bundled (default language, SEO metadata, fallback).
 * Every other language is code-split and fetched only when selected.
 * The `Promise<TranslationType>` type makes a language file with missing
 * keys a compile error.
 */
export const content = { en } as const;

export const loaders: Record<LanguageCode, () => Promise<TranslationType>> = {
  en: async () => en,
  as: () => import("./languages/as").then((m) => m.as),
  bn: () => import("./languages/bn").then((m) => m.bn),
  gu: () => import("./languages/gu").then((m) => m.gu),
  hi: () => import("./languages/hi").then((m) => m.hi),
  kn: () => import("./languages/kn").then((m) => m.kn),
  ml: () => import("./languages/ml").then((m) => m.ml),
  mr: () => import("./languages/mr").then((m) => m.mr),
  pa: () => import("./languages/pa").then((m) => m.pa),
  ta: () => import("./languages/ta").then((m) => m.ta),
  te: () => import("./languages/te").then((m) => m.te),
};
