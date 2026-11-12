/**
 * Per-language translation report: every text, English next to the
 * translation, with a status.
 *
 * Usage: bun scripts/i18n-report.ts [code ...]     (default: every non-English language)
 * Writes i18n-reports/<code>.csv (opens in Excel/Sheets) and prints a summary.
 *
 * Covers the language file (constants/languages/<code>.ts) and the
 * About/FAQ/Contact pages (constants/infoPages/<code>.ts, "infoPages." keys).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loaders } from "../constants/content";
import { LANGUAGES } from "../constants/languages/registry";
import { analyse, flatten, summarise, toCsv, type Allow, type Glossary, type Leaves } from "./i18n-lib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Agreed terms for a language (constants/languages/glossary/<code>.json), if any. */
export function loadGlossary(code: string): Glossary | undefined {
  const p = join(ROOT, "constants/languages/glossary", `${code}.json`);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : undefined;
}

// {{var}} names must match; {text} highlighted spans only need the same count.
export const tokens = (s: string) => {
  const vars = [...s.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)].map((m) => `{{${m[1]}}}`).sort();
  const spans = s.replace(/\{\{[^{}]*\}\}/g, "").match(/\{[^{}]+\}/g)?.length ?? 0;
  return [...vars, `spans:${spans}`].join(",");
};

export const allow: Allow = JSON.parse(
  readFileSync(join(ROOT, "constants/languages/same-as-english.json"), "utf8"),
);

/** Links and the email marker are not text. */
const infoLeaves = (content: unknown): Leaves => {
  const all = flatten(content, "infoPages");
  for (const k of [...all.keys()]) if (/\.(href|email)$/.test(k)) all.delete(k);
  return all;
};

export async function loadLeaves(code: string): Promise<Leaves> {
  const dict = await loaders[code as keyof typeof loaders]();
  const leaves = flatten(dict);
  const infoFile = join(ROOT, "constants/infoPages", `${code}.ts`);
  if (existsSync(infoFile)) {
    const mod = await import(infoFile);
    for (const [k, v] of infoLeaves(mod[code])) leaves.set(k, v);
  }
  return leaves;
}

// Run only when executed directly (the check script imports this file).
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const codes = process.argv.slice(2).length
    ? process.argv.slice(2)
    : LANGUAGES.map((l) => l.code).filter((c) => c !== "en");
  const en = await loadLeaves("en");
  mkdirSync(join(ROOT, "i18n-reports"), { recursive: true });
  console.log("lang  status  translated        untranslated missing problems terms  report");
  for (const code of codes) {
    if (!(code in loaders)) {
      console.error(`unknown language "${code}"`);
      process.exit(1);
    }
    const rows = analyse(code, en, await loadLeaves(code), allow, tokens, loadGlossary(code));
    const s = summarise(rows);
    const file = join("i18n-reports", `${code}.csv`);
    writeFileSync(join(ROOT, file), toCsv(rows));
    const ready = LANGUAGES.find((l) => l.code === code)?.ready ? "ready" : "draft";
    console.log(
      `${code.padEnd(5)} ${ready.padEnd(7)} ${`${s.translated}/${s.total} (${s.pct}%)`.padEnd(17)} ` +
        `${String(s.untranslated).padStart(12)} ${String(s.missing).padStart(7)} ${String(s.problems).padStart(8)} ${String(s.notes).padStart(5)}  ${file}`,
    );
  }
}
