/**
 * Shared per-language analysis used by i18n-check.ts and i18n-report.ts.
 * This file is identical in farmrisk/ and farmrisk-app/.
 */

export type Leaves = Map<string, string>;

export function flatten(v: unknown, path = "", out: Leaves = new Map()): Leaves {
  if (typeof v === "string") out.set(path, v);
  else if (Array.isArray(v)) v.forEach((x, i) => flatten(x, `${path}[${i}]`, out));
  else if (v && typeof v === "object")
    for (const [k, x] of Object.entries(v)) flatten(x, path ? `${path}.${k}` : k, out);
  else if (v !== undefined && v !== null) out.set(path, String(v));
  return out;
}

/** Unicode block each language must be written in. */
const SCRIPTS = {
  bengali: [0x0980, 0x09ff],
  devanagari: [0x0900, 0x097f],
  gurmukhi: [0x0a00, 0x0a7f],
  gujarati: [0x0a80, 0x0aff],
  tamil: [0x0b80, 0x0bff],
  telugu: [0x0c00, 0x0c7f],
  kannada: [0x0c80, 0x0cff],
  malayalam: [0x0d00, 0x0d7f],
  odia: [0x0b00, 0x0b7f],
} as const;
type Script = keyof typeof SCRIPTS;

export const LANGUAGE_SCRIPT: Record<string, Script | undefined> = {
  as: "bengali", bn: "bengali", hi: "devanagari", mr: "devanagari",
  pa: "gurmukhi",
  gu: "gujarati", ta: "tamil", te: "telugu", kn: "kannada", ml: "malayalam",
};

/** Letters that exist in the shared block but belong to only one of its languages. */
const FORBIDDEN_LETTERS: Record<string, { re: RegExp; why: string }> = {
  // Assamese writes ra as ৰ and wa as ৱ; Bengali র means the text is Bengali.
  as: { re: /র/, why: "Bengali letter র (Assamese uses ৰ)" },
  bn: { re: /[ৰৱ]/, why: "Assamese letter ৰ/ৱ in Bengali text" },
};

// Danda (। ॥) is full-stop punctuation shared by these scripts only.
const DANDA = /[।॥]/g;
const USES_DANDA = new Set<Script>(["devanagari", "bengali", "gurmukhi"]);
const CJK = /[　-鿿＀-￯]/;
const LATIN_WORD = /[A-Za-z]{2,}/;

function scriptOf(ch: number): Script | null {
  for (const [name, [lo, hi]] of Object.entries(SCRIPTS))
    if (ch >= lo && ch <= hi) return name as Script;
  return null;
}

/** Problems with the characters used in one translated string. */
export function scriptProblems(code: string, value: string): string[] {
  const expected = LANGUAGE_SCRIPT[code];
  const out: string[] = [];
  if (CJK.test(value)) out.push("CJK/fullwidth character");
  if (!expected) return out;
  const foreign = new Set<Script>();
  for (const c of USES_DANDA.has(expected) ? value.replace(DANDA, "") : value) {
    const s = scriptOf(c.codePointAt(0)!);
    if (s && s !== expected) foreign.add(s);
  }
  if (foreign.size) out.push(`contains ${[...foreign].join("/")} script (expected ${expected})`);
  const f = FORBIDDEN_LETTERS[code];
  if (f && f.re.test(value)) out.push(f.why);
  return out;
}

/**
 * Texts allowed to stay identical to English (same-as-english.json):
 *   values: exact English texts allowed in every language ("FarmRisk")
 *   keys:   key patterns (regex) that are not prose (icon names, ids, formats)
 *   <code>: keys allowed for one language only, e.g. a word that is the same
 */
export type Allow = { values?: string[]; keys?: string[]; [code: string]: string[] | undefined };

const URL_LIKE = /^(https?:\/\/\S+|www\.\S+|[\w.-]+@[\w.-]+)$/;

export type Status = "translated" | "same-allowed" | "UNTRANSLATED" | "MISSING" | "EXTRA" | "no-text";

/** problems = errors (wrong script, placeholders); notes = glossary terms to review. */
export type Row = { key: string; en: string; value: string; status: Status; problems: string[]; notes: string[] };

/** constants/languages/glossary/<code>.json (web) or i18n/glossary/<code>.json (app). */
export type Glossary = { terms?: Record<string, string> };

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Glossary terms used in the English text whose agreed translation is absent. */
export function glossaryNotes(en: string, value: string, glossary?: Glossary): string[] {
  const out: string[] = [];
  for (const [alts, target] of Object.entries(glossary?.terms ?? {})) {
    const hit = alts.split("|").find((a) => new RegExp(`\\b${escapeRe(a)}\\b`, "i").test(en));
    // Inflected forms count: Dravidian case endings replace the final vowel
    // sign (ಮಣ್ಣು -> ಮಣ್ಣಿನ), so also accept the term without its last letter.
    const stem = [...target].length > 3 ? [...target].slice(0, -1).join("") : target;
    if (hit && !value.includes(target) && !value.includes(stem)) out.push(`term "${hit}" → expected "${target}"`);
  }
  return out;
}

/**
 * Compare one language against English, key by key.
 * A value identical to English counts as untranslated unless the English
 * text is in allow.all or the key is in allow[code].
 */
export function analyse(
  code: string, en: Leaves, tr: Leaves, allow: Allow, tokens: (s: string) => string, glossary?: Glossary,
): Row[] {
  const allowedValues = new Set(allow.values ?? []);
  const keyPatterns = (allow.keys ?? []).map((p) => new RegExp(`^(?:${p})$`));
  const allowedKeys = new Set(allow[code] ?? []);
  const keyAllowed = (k: string) => allowedKeys.has(k) || keyPatterns.some((re) => re.test(k));
  const rows: Row[] = [];
  for (const [key, e] of en) {
    const v = tr.get(key);
    if (v === undefined) {
      rows.push({ key, en: e, value: "", status: "MISSING", problems: [], notes: [] });
      continue;
    }
    const problems = scriptProblems(code, v);
    if (tokens(e) !== tokens(v)) problems.push(`placeholders differ: en=[${tokens(e)}] ${code}=[${tokens(v)}]`);
    let status: Status;
    if (!LATIN_WORD.test(e) || URL_LIKE.test(e.trim())) status = "no-text";
    else if (v !== e) status = "translated";
    else if (allowedValues.has(e) || keyAllowed(key)) status = "same-allowed";
    else status = "UNTRANSLATED";
    const notes = status === "translated" ? glossaryNotes(e, v, glossary) : [];
    rows.push({ key, en: e, value: v, status, problems, notes });
  }
  for (const [key, v] of tr) if (!en.has(key)) rows.push({ key, en: "", value: v, status: "EXTRA", problems: [], notes: [] });
  return rows;
}

export function summarise(rows: Row[]) {
  const count = (s: Status) => rows.filter((r) => r.status === s).length;
  const text = rows.filter((r) => r.status !== "no-text" && r.status !== "EXTRA").length;
  const translated = count("translated") + count("same-allowed");
  return {
    total: text,
    translated,
    untranslated: count("UNTRANSLATED"),
    missing: count("MISSING"),
    extra: count("EXTRA"),
    problems: rows.filter((r) => r.problems.length).length,
    notes: rows.filter((r) => r.notes.length).length,
    pct: text ? Math.floor((translated / text) * 1000) / 10 : 100,
  };
}

const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

export function toCsv(rows: Row[]): string {
  const head = "key,status,english,translation,problems,glossary_notes";
  const body = rows.map((r) =>
    [r.key, r.status, r.en, r.value, r.problems.join("; "), r.notes.join("; ")].map(csvCell).join(","),
  );
  return "﻿" + [head, ...body].join("\n") + "\n"; // BOM so Excel shows Indic text
}
