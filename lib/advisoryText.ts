/**
 * Normalise AI advisory / weather-summary text before rendering.
 *
 * The English advisory never contains lists and uses single asterisks for
 * highlights (*word*). Translation (notably Hindi, where a highlighted word
 * often starts the sentence) can add list markers ("* ", "- ", "• "), pad or
 * double the asterisks, or leave one unmatched — which then shows up as a
 * stray bullet/asterisk. The RAG service cleans new translations the same
 * way (farmrisk-rag/app/services/translation.py); this also covers responses
 * cached before that fix.
 */
const LIST_MARKER_RE = /^[ \t]*(?:[-•▪●◦]|\*(?!\*)|\d+[.)])[ \t]+/gm;

export function cleanAdvisoryText(text: string | null | undefined): string {
  if (!text) return "";
  const out = text.replace(/\*\*/g, "*").replace(LIST_MARKER_RE, "");
  return out
    .split("\n")
    .map((line) => {
      const parts = line.split("*");
      // Even part count = odd number of "*": an unmatched marker, drop them all.
      if (parts.length % 2 === 0) return parts.join("");
      // Odd-indexed parts are highlighted: "* शब्द *" -> "*शब्द*".
      return parts.map((p, i) => (i % 2 === 1 ? p.trim() : p)).join("*");
    })
    .join("\n");
}
