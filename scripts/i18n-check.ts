// Usage: bun scripts/i18n-check.ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loaders } from "../constants/content";
import { LANGUAGES } from "../constants/languages/registry";
import { analyse, scriptProblems, summarise } from "./i18n-lib";
import { allow, loadLeaves, tokens as reportTokens } from "./i18n-report";

const errors: string[] = [];
const err = (m: string) => errors.push(m);

type Leaf = Map<string, string>;

function flatten(v: unknown, path: string, out: Leaf) {
  if (typeof v === "string") out.set(path, v);
  else if (Array.isArray(v)) v.forEach((x, i) => flatten(x, `${path}[${i}]`, out));
  else if (v && typeof v === "object")
    for (const [k, x] of Object.entries(v)) flatten(x, path ? `${path}.${k}` : k, out);
  else out.set(path, String(v));
}

// {{var}} = interpolation: names must match exactly.
// {text} = highlighted span (e.g. heroHeading in Hero.tsx): inner text is
// translated, so only the number of spans must match.
const tokens = (s: string) => {
  const vars = [...s.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)].map((m) => `{{${m[1]}}}`).sort();
  const spans = s.replace(/\{\{[^{}]*\}\}/g, "").match(/\{[^{}]+\}/g)?.length ?? 0;
  return [...vars, `spans:${spans}`];
};
const CJK = /[　-鿿＀-￯]/;

const all: Record<string, unknown> = {};
for (const [code, load] of Object.entries(loaders)) all[code] = await load();

for (const l of LANGUAGES) {
  if (!(l.code in all)) err(`[registry] language "${l.code}" has no loader in content.ts`);
}
for (const code of Object.keys(all)) {
  if (!LANGUAGES.some((l) => l.code === code)) err(`[registry] content.ts has "${code}" which is not in LANGUAGES`);
}

const enLeaves: Leaf = new Map();
flatten(all.en, "", enLeaves);

// Ready languages must be complete: every text translated (or listed in
// constants/languages/same-as-english.json), no wrong-script characters, and
// About/FAQ/Contact present. Drafts only need the same keys (they show English).
// `bun scripts/i18n-report.ts <code>` lists every text with its status.
const progress: string[] = [];
const enAll = await loadLeaves("en");

for (const [code, tr] of Object.entries(all)) {
  const leaves: Leaf = new Map();
  flatten(tr, "", leaves);
  if (code !== "en") {
    for (const k of enLeaves.keys()) if (!leaves.has(k)) err(`[${code}] missing key: ${k}`);
    for (const k of leaves.keys()) if (!enLeaves.has(k)) err(`[${code}] extra key: ${k}`);
    for (const [k, v] of leaves) {
      const e = enLeaves.get(k);
      if (e === undefined) continue;
      const a = tokens(e).join(","), b = tokens(v).join(",");
      if (a !== b) err(`[${code}] placeholder mismatch at ${k}: en=[${a}] ${code}=[${b}]`);
      for (const p of scriptProblems(code, v)) err(`[${code}] ${p} at ${k}: ${JSON.stringify(v.slice(0, 60))}`);
    }
    const isReady = LANGUAGES.some((l) => l.code === code && l.ready);
    const rows = analyse(code, enAll, await loadLeaves(code), allow, reportTokens);
    const s = summarise(rows);
    progress.push(
      `  ${code.padEnd(4)} ${`${s.pct}%`.padStart(6)} translated  [${isReady ? "ready" : "draft"}]` +
        (s.untranslated || s.missing ? `  ${s.untranslated} untranslated, ${s.missing} missing` : ""),
    );
    if (isReady) {
      for (const r of rows) {
        if (r.status === "UNTRANSLATED") err(`[${code}] ready but untranslated: ${r.key} = ${JSON.stringify(r.en.slice(0, 60))}`);
        if (r.status === "MISSING" && r.key.startsWith("infoPages.")) err(`[${code}] ready but About/FAQ/Contact text missing: ${r.key}`);
        if (r.key.startsWith("infoPages.")) for (const p of r.problems) err(`[${code}] ${p} at ${r.key}`);
      }
    }
  }
  if (code === "en") for (const [k, v] of leaves) if (CJK.test(v)) err(`[en] CJK/fullwidth char at ${k}`);
}
console.log("Translation progress:\n" + progress.join("\n") + "\n");

// Weather conditions: each must have a non-empty en.
const route = readFileSync(fileURLToPath(new URL("../app/api/weather/route.ts", import.meta.url)), "utf8");
const entries = [...route.matchAll(/(\d+):\s*\{\s*condition:\s*\{([\s\S]*?)\}/g)];
if (entries.length === 0) err("[weather] could not find any WMO conditions in route.ts");
for (const m of entries) {
  if (!/\ben:\s*["'`][^"'`]+["'`]/.test(m[2])) err(`[weather] WMO code ${m[1]} has no "en" condition`);
  if (CJK.test(m[2])) err(`[weather] WMO code ${m[1]} contains CJK/fullwidth char`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  console.error(`\ni18n-check: ${errors.length} error(s)`);
  process.exit(1);
}
console.log(`i18n-check: OK (${Object.keys(all).length} languages, ${entries.length} weather conditions)`);
