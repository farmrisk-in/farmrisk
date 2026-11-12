/**
 * Single source of truth for supported languages.
 *
 * To add a language:
 *   1. Add an entry here with `ready: false`.
 *   2. Create constants/languages/<code>.ts (copy en.ts, rename the export).
 *   3. Add a loader line in constants/content.ts.
 *   4. Translate, run `bun run i18n:check`, then flip `ready: true`.
 *
 * `ready: false` languages are English placeholders: hidden from users in
 * production, visible in `next dev` or with NEXT_PUBLIC_SHOW_DRAFT_LANGUAGES=1.
 */
export const LANGUAGES = [
  { code: "en", englishName: "English", nativeName: "English", ready: true },
  { code: "as", englishName: "Assamese", nativeName: "অসমীয়া", ready: true },
  { code: "bn", englishName: "Bengali", nativeName: "বাংলা", ready: true },
  { code: "gu", englishName: "Gujarati", nativeName: "ગુજરાતી", ready: true },
  { code: "hi", englishName: "Hindi", nativeName: "हिन्दी", ready: true },
  { code: "kn", englishName: "Kannada", nativeName: "ಕನ್ನಡ", ready: true },
  { code: "ml", englishName: "Malayalam", nativeName: "മലയാളം", ready: true },
  { code: "mr", englishName: "Marathi", nativeName: "मराठी", ready: true },
  { code: "pa", englishName: "Punjabi", nativeName: "ਪੰਜਾਬੀ", ready: true },
  { code: "ta", englishName: "Tamil", nativeName: "தமிழ்", ready: true },
  { code: "te", englishName: "Telugu", nativeName: "తెలుగు", ready: true },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

const SHOW_DRAFTS =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_SHOW_DRAFT_LANGUAGES === "1";

/** Languages users can pick (drafts excluded in production). */
export const AVAILABLE_LANGUAGES = LANGUAGES.filter(
  (l) => l.ready || SHOW_DRAFTS,
);

export const isAvailableLanguage = (
  code: string | null | undefined,
): code is LanguageCode =>
  !!code && AVAILABLE_LANGUAGES.some((l) => l.code === code);
