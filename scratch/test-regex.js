let text = `For Kharif crops in Uttarakhand, timely sowing is critical.

| Crop | Sowing Window | Optimal Soil Temp |
| :--- | :--- | :--- |
| Paddy | June 15 - July 10 | 25-30°C |

> **Warning:** Avoid sowing during heavy monsoon spells.`;

function preprocessMarkdown(text) {
  let formatted = text.replace(/\\n/g, "\n");
  formatted = formatted.replace(/\|[ \t]*\|/g, "|\n|");
  formatted = formatted.replace(/^([^|\n][^\n]*)\n(\|)/gm, "$1\n\n$2");
  formatted = formatted.replace(/^(\|[^\n]*)\n([^|\n])/gm, "$1\n\n$2");
  return formatted;
}
console.log("RESULT:");
console.log(preprocessMarkdown(text));
