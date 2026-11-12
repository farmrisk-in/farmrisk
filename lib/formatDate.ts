/**
 * Language-independent date/time formatting.
 *
 * Browsers and phones don't reliably ship month/weekday names for every
 * Indian language (Chrome prints Assamese dates in English, Punjabi as
 * "M11 10, Tue"), so the words come from the language files (`dates`) and
 * this helper only puts them in order. Digits stay 0-9 everywhere.
 *
 * This file is identical in farmrisk/ and farmrisk-app/.
 */

export type DateWords = {
  /** January..December */
  monthsShort: string[];
  monthsLong: string[];
  /** Sunday..Saturday */
  weekdaysShort: string[];
  weekdaysLong: string[];
  am: string;
  pm: string;
  /**
   * Word order, with {day} {month} {year} {weekday} {time} {hour} {minute} {ampm}.
   * e.g. dayMonth "{day} {month}", weekdayDayMonth "{weekday}, {day} {month}",
   * time "{hour}:{minute} {ampm}".
   */
  patterns: {
    dayMonth: string;
    dayMonthYear: string;
    weekdayDayMonth: string;
    time: string;
  };
};

export type DateStyle =
  | "dayMonth" // 10 Nov
  | "dayMonthYear" // 10 Nov 2026
  | "weekdayDayMonth" // Tue, 10 Nov
  | "weekday" // Tue
  | "month"; // Nov

type Parts = { y: number; m: number; d: number; wd: number; h: number; min: number };

/**
 * A "YYYY-MM-DD..." string is read as written (weather times are local
 * wall-clock with an offset, so no timezone shifting). A Date uses the
 * device's local time unless `utc` is set.
 */
function parts(input: Date | string | number, utc = false): Parts | null {
  if (typeof input === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(input);
    if (m) {
      const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
      const wd = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
      return { y, m: mo - 1, d, wd, h: Number(m[4] ?? 0), min: Number(m[5] ?? 0) };
    }
  }
  const dt = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(dt.getTime())) return null;
  return utc
    ? { y: dt.getUTCFullYear(), m: dt.getUTCMonth(), d: dt.getUTCDate(), wd: dt.getUTCDay(), h: dt.getUTCHours(), min: dt.getUTCMinutes() }
    : { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate(), wd: dt.getDay(), h: dt.getHours(), min: dt.getMinutes() };
}

const fill = (pattern: string, values: Record<string, string>) =>
  pattern.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? "");

export function formatDate(
  input: Date | string | number,
  w: DateWords,
  style: DateStyle = "dayMonth",
  opts: { long?: boolean; utc?: boolean } = {},
): string {
  const p = parts(input, opts.utc);
  if (!p) return "";
  const month = (opts.long ? w.monthsLong : w.monthsShort)[p.m];
  const weekday = (opts.long ? w.weekdaysLong : w.weekdaysShort)[p.wd];
  if (style === "weekday") return weekday;
  if (style === "month") return month;
  const pattern =
    style === "dayMonthYear" ? w.patterns.dayMonthYear
    : style === "weekdayDayMonth" ? w.patterns.weekdayDayMonth
    : w.patterns.dayMonth;
  return fill(pattern, { day: String(p.d), month, year: String(p.y), weekday });
}

/** 12-hour clock: "2:05 PM" (pattern and AM/PM words from the language file). */
export function formatTime(
  input: Date | string | number,
  w: DateWords,
  opts: { utc?: boolean; minutes?: boolean } = {},
): string {
  const p = parts(input, opts.utc);
  if (!p) return "";
  const hour12 = p.h % 12 === 0 ? 12 : p.h % 12;
  const minute = String(p.min).padStart(2, "0");
  const ampm = p.h < 12 ? w.am : w.pm;
  const pattern = opts.minutes === false ? w.patterns.time.replace(/:?\{minute\}/, "") : w.patterns.time;
  return fill(pattern, { hour: String(hour12), minute, ampm }).replace(/\s+/g, " ").trim();
}
