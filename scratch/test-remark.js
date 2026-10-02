import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

let text = "| Crop Category | Optimal Window | Soil Moisture Requirement |\n| :--- | :--- | :--- |\n| Cereals (Rice/Maize) | June 15 - July 10 | Field Capacity |\n| Pulses (Urd/Moong) | June 20 - July 15 | Moderate |\n| Oilseeds (Soybean) | June 20 - July 05 | Well-drained |\n> **Warning:** Avoid sowing during heavy monsoon spells in Uttarakhand hills to prevent seed rot and soil erosion. Ensure the black cotton soil is not waterlogged at the time of sowing as it leads to poor germination and seedling mortality.";

function preprocessMarkdown(text) {
  let formatted = text.replace(/\\n/g, "\n");
  formatted = formatted.replace(/\|[ \t]*\|/g, "|\n|");
  formatted = formatted.replace(/^([^|\n][^\n]*)\n(\|)/gm, "$1\n\n$2");
  formatted = formatted.replace(/^(\|[^\n]*)\n([^|\n])/gm, "$1\n\n$2");
  return formatted;
}

const p = preprocessMarkdown(text);
const file = unified().use(remarkParse).use(remarkGfm).parse(p);
console.dir(file, { depth: null });
