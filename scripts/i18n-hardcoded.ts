/**
 * Finds user-visible English typed directly into components instead of the
 * language files. Run: bun scripts/i18n-hardcoded.ts   (exit 1 if any found)
 *
 * Flags:
 *   - JSX text:                <Text>Select a location</Text>
 *   - JSX string in braces:    <Text>{"Loading..."}</Text>
 *   - visible-text props:      message="..." title="..." placeholder="..." ...
 *   - Alert.alert("..."), toast("..."), toast.error("...") etc.
 *   - object lists like { value: "drip", label: "Drip Irrigation" }
 *   - date formatting through the browser (toLocaleDateString, Intl.DateTimeFormat)
 *
 * To keep a string on purpose (brand name, code sample, dev-only screen) put
 * `// i18n-ignore` (or {/* i18n-ignore *\/}) on the same line or the line above,
 * or add the exact text to ALLOWED below.
 *
 * This file is identical in farmrisk/ and farmrisk-app/.
 */
import ts from "typescript";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = ["app", "components", "providers", "hooks", "lib", "constants"];
// Translation sources themselves, and server-only code.
const SKIP_PATHS = [/lib\/formatDate\.ts$/, /constants\/languages\//, /constants\/infoPages\//, /i18n\//, /app\/api\//];
const SKIP_DIR = new Set(["node_modules", ".next", ".expo", "dist", "build", "__tests__"]);

const TEXT_PROPS = new Set([
  "message", "title", "subtitle", "description", "label", "placeholder", "alt",
  "aria-label", "accessibilityLabel", "accessibilityHint", "text", "emptyText",
  "buttonText", "confirmText", "cancelText", "helperText", "errorMessage",
  "heading", "caption", "tooltip", "hint",
]);

/** Exact strings that are fine in every language. */
const ALLOWED = new Set([
  "FarmRisk", "Farm Risk", "IMD", "ERA5", "Open-Meteo", "NASA", "ISRO", "APMC",
  "Google", "WhatsApp", "Play Store", "App Store", "OK", "km/h", "mm", "kph", "hPa",
]);

const LATIN_WORD = /[A-Za-z]{2,}/;

function* walk(dir: string): Generator<string> {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP_DIR.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.tsx?$/.test(name) && !/\.(test|spec|stories|d)\.tsx?$/.test(name) && !SKIP_PATHS.some((re) => re.test(p))) yield p;
  }
}

type Hit = { file: string; line: number; kind: string; text: string };
const hits: Hit[] = [];

function visible(s: string) {
  const t = s.replace(/\s+/g, " ").trim();
  const words = t.replace(/&(#\d+|[a-z]+);/gi, " "); // HTML entities like &nbsp;
  if (!t || !LATIN_WORD.test(words) || ALLOWED.has(t)) return null;
  // URLs, paths, emails, class lists, identifiers
  if (/^(https?:|mailto:|tel:|\/|#|\.\/)/.test(t)) return null;
  if (/^[\w.-]+@[\w.-]+$/.test(t)) return null;
  // Tailwind/CSS class lists: "text-red-600 dark:text-red-500"
  if (t.split(" ").every((w) => /^[\w[\].\/:#%-]+$/.test(w) && /[-:]/.test(w))) return null;
  if (/^[a-z0-9_-]+(:[a-z0-9_-]+)*$/i.test(t) && !/^[A-Z][a-z]+$/.test(t)) return null;
  return t;
}

for (const dir of DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const src = readFileSync(file, "utf8");
    const lines = src.split("\n");
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const ignored = (pos: number) => {
      const ln = sf.getLineAndCharacterOfPosition(pos).line;
      return /i18n-ignore/.test(lines[ln] ?? "") || /i18n-ignore/.test(lines[ln - 1] ?? "");
    };
    const add = (node: ts.Node, kind: string, raw: string) => {
      const text = visible(raw);
      if (!text || ignored(node.getStart(sf))) return;
      hits.push({
        file: relative(ROOT, file),
        line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
        kind,
        text,
      });
    };
    // A translation lookup: t.x.y, t?.x, tools.key where `tools = t.tools`, or t("key").
    const rootName = (e: ts.Expression): string | null => {
      while (ts.isPropertyAccessExpression(e) || ts.isElementAccessExpression(e) || ts.isNonNullExpression(e))
        e = e.expression;
      return ts.isIdentifier(e) ? e.text : null;
    };
    const fromT = (name: string) =>
      /^t([A-Z]\w*)?$/.test(name) ||
      new RegExp(`\\b(const|let)\\s+${name}\\s*=\\s*t\\??\\.`).test(src) ||
      new RegExp(`\\{[^}]*\\b${name}\\b[^}]*\\}\\s*=\\s*t\\b`).test(src);
    const isLookup = (e: ts.Expression): boolean => {
      if (ts.isCallExpression(e)) return /^(t|t[A-Z]\w*|i18n\.t)$/.test(e.expression.getText(sf));
      if (!ts.isPropertyAccessExpression(e) && !ts.isElementAccessExpression(e)) return false;
      const root = rootName(e);
      return !!root && fromT(root);
    };
    // String literals an expression can evaluate to: "a", c ? "a" : "b", x || "a", x ?? "a"
    const literals = (e: ts.Expression | undefined): (ts.StringLiteral | ts.NoSubstitutionTemplateLiteral)[] => {
      if (!e) return [];
      if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return [e];
      if (ts.isParenthesizedExpression(e)) return literals(e.expression);
      if (ts.isConditionalExpression(e)) return [...literals(e.whenTrue), ...literals(e.whenFalse)];
      if (
        ts.isBinaryExpression(e) &&
        (e.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
          e.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)
      )
        // `t.section.key || "English"` is a backup for a translated key that
        // the type checker guarantees exists, so only the left side counts.
        return isLookup(e.left) ? literals(e.left) : [...literals(e.left), ...literals(e.right)];
      return [];
    };
    const visit = (node: ts.Node) => {
      if (ts.isJsxText(node)) add(node, "jsx-text", node.text);
      else if (ts.isJsxExpression(node) && !ts.isJsxAttribute(node.parent))
        for (const l of literals(node.expression)) add(l, "jsx-string", l.text);
      else if (ts.isJsxAttribute(node) && TEXT_PROPS.has(node.name.getText(sf)) && node.initializer) {
        const init = node.initializer;
        const name = `prop:${node.name.getText(sf)}`;
        if (ts.isStringLiteral(init)) add(node, name, init.text);
        else if (ts.isJsxExpression(init)) for (const l of literals(init.expression)) add(l, name, l.text);
      } else if (
        ts.isPropertyAssignment(node) &&
        TEXT_PROPS.has(node.name.getText(sf).replace(/["']/g, "")) &&
        (ts.isStringLiteral(node.initializer) || ts.isNoSubstitutionTemplateLiteral(node.initializer))
      ) {
        // { value: "drip", label: "Drip Irrigation" } lists rendered as options
        add(node.initializer, `object:${node.name.getText(sf)}`, node.initializer.text);
      } else if (ts.isCallExpression(node)) {
        const callee = node.expression.getText(sf);
        // Browsers/phones don't reliably have month & weekday names for every
        // language (Chrome prints Assamese dates in English), so dates must go
        // through lib/formatDate with names from the language files.
        if (/\.(toLocaleDateString|toLocaleTimeString)$|^(new )?Intl\.DateTimeFormat$/.test(callee) || /\.toLocaleString$/.test(callee) && node.arguments.length > 1) {
          if (!ignored(node.getStart(sf)))
            hits.push({
              file: relative(ROOT, file),
              line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
              kind: "date-format",
              text: node.getText(sf).slice(0, 70),
            });
        }
        if (/^(Alert\.alert|toast(\.\w+)?)$/.test(callee))
          for (const a of node.arguments.slice(0, 2))
            if (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a)) add(a, callee, a.text);
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
}

hits.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
for (const h of hits) console.log(`${h.file}:${h.line}  [${h.kind}]  ${JSON.stringify(h.text)}`);
const files = new Set(hits.map((h) => h.file)).size;
if (hits.length) {
  console.error(`\ni18n-hardcoded: ${hits.length} hardcoded string(s) in ${files} file(s)`);
  process.exit(1);
}
console.log("i18n-hardcoded: OK (no hardcoded user-visible strings)");
