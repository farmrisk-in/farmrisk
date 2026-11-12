import type { LocalizedText } from "@/types/weather";

/** Returns text in `lang`, falling back to English. */
export function localized(
  text: LocalizedText | undefined | null,
  lang: string,
): string {
  if (!text) return "";
  return (text as Record<string, string | undefined>)[lang] ?? text.en;
}
