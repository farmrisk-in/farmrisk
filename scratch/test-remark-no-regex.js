import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

let text = `For Kharif crops in Uttarakhand, timely sowing is critical.
| Crop | Sowing Window | Optimal Soil Temp |
| :--- | :--- | :--- |
| Paddy | June 15 - July 10 | 25-30°C |
> **Warning:** Avoid sowing during heavy monsoon spells.`;

function preprocessMarkdown(text) {
  let formatted = text.replace(/\\n/g, "\n");
  return formatted;
}

const p = preprocessMarkdown(text);
const file = unified().use(remarkParse).use(remarkGfm).parse(p);
console.dir(file, { depth: null });
