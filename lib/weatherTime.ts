/**
 * Helpers for reading /api/weather timestamps.
 *
 * /api/weather returns each timestamp as the location's local wall-clock time
 * with an explicit UTC offset, e.g. "2026-11-09T14:00:00+05:30". That is a
 * correct instant (`new Date()` parses it properly), and its leading
 * characters are the *location's* local date and time.
 *
 * Read the local date/hour from the string itself, NOT via Date getters:
 * `getHours()` uses the viewer's device timezone, `getUTCHours()` /
 * `toISOString()` use UTC — neither is the forecast location's local time.
 *
 * These also accept the legacy format ("…T14:00:00.000Z", local time
 * mislabelled as UTC), whose leading characters are likewise local time.
 */

/** Local calendar date at the forecast location, "YYYY-MM-DD". */
export function weatherLocalDate(t: string): string {
  return String(t).slice(0, 10);
}

/** Local hour (0–23) at the forecast location. */
export function weatherLocalHour(t: string): number {
  return Number(String(t).slice(11, 13));
}

/** Local hour as a 12-hour label, e.g. "02 PM". */
export function formatWeatherHour(t: string, words?: { am: string; pm: string }): string {
  const h = weatherLocalHour(t);
  const ampm = h >= 12 ? (words?.pm ?? "PM") : (words?.am ?? "AM");
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")} ${ampm}`;
}
