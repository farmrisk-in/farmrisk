let text = `| Crop Category | Optimal Window | Soil Moisture Requirement |
| :--- | :--- | :--- |
| Cereals (Rice/Maize) | June 15 - July 10 | Field Capacity |
| Pulses (Urd/Moong) | June 20 - July 15 | Moderate |
| Oilseeds (Soybean) | June 20 - July 05 | Well-drained |

> **Warning:** Avoid sowing during heavy monsoon spells in Uttarakhand hills to prevent seed rot and soil erosion. Ensure the black cotton soil is not waterlogged at the time of sowing as it leads to poor germination and seedling mortality.`;

function preprocessMarkdown(text) {
  let formatted = text.replace(/\\n/g, "\n");
  // formatted = formatted.replace(/\|[ \t]*\|/g, "|\n|");
  formatted = formatted.replace(/^([^|\n][^\n]*)\n(\|)/gm, "$1\n\n$2");
  formatted = formatted.replace(/^(\|[^\n]*)\n([^|\n])/gm, "$1\n\n$2");
  formatted = formatted.replace(
    /([^\n])\s*>\s*(Warning|Tip|Note|Important|Caution):?/gi,
    "$1\n\n> **$2:**",
  );
  formatted = formatted.replace(/\|\s*-\s+([A-Za-z0-9*])/g, "|\n\n- $1");
  formatted = formatted.replace(/([.!?:])\s+-\s+([A-Za-z0-9*])/g, "$1\n\n- $2");
  formatted = formatted.replace(/^\s*\|\s*$/gm, "");
  return formatted.trim();
}
console.log(preprocessMarkdown(text));
