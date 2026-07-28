/**
 * riskScores.ts
 * =============================================================================
 * Deterministic agricultural risk scoring — TypeScript port of Risk_scores.py.
 *
 * Outputs SIX independent risk scores, each on a 0-100 scale:
 *     heavy_rain, heat_stress, pest, lightning, wind, frost
 *
 * Each score is returned as:
 *     { score: number, band: string, major_factor: string, reasons: string[] }
 *
 * Design principles
 * -----------------
 * - Fully rule-based and auditable (no LLM call, no API key needed).
 * - Every score is a piecewise-linear mapping from a physical driver to 0-100,
 *   so results are smooth, reproducible, and easy to tune.
 * - Each score reports its MAJOR contributing factor alongside the number.
 * =============================================================================
 */

// ------------------------------------------------------------------ types

export interface HazardScore {
  score: number;
  band: string;
  major_factor: string;
  reasons: string[];
}

export interface OverallScore {
  score: number;
  band: string;
  summary: string;
  major_contributors: Array<{
    hazard: string;
    score: number;
    band: string;
    major_factor: string;
  }>;
}

export interface RiskScores {
  overall: OverallScore;
  heavy_rain: HazardScore;
  heat_stress: HazardScore;
  pest: HazardScore;
  lightning: HazardScore;
  wind: HazardScore;
  frost: HazardScore;
}

export interface ComputeRiskInput {
  rain_next5?: number[] | null;
  rain_dates?: (string | Date | null)[] | null;
  max_daily_rain?: number | null;
  total_rainfall?: number | null;
  rainy_days?: number | null;
  max_temp?: number | null;
  avg_max_temp?: number | null;
  min_temp?: number | null;
  avg_min_temp?: number | null;
  humidity?: number | null;
  gusts_hourly?: (number | null)[] | null;
  times_hourly?: (string | Date | null)[] | null;
  wind_gusts?: number | null;
  wind_speed?: number | null;
  soil_moisture_available?: boolean;
  soil_percentile?: number | null;
  lightning_score?: number | null;
  lightning_category?: string | null;
  station_type?: string;
  crop_heat_threshold?: number | null;
}

// ------------------------------------------------------------------ helpers

/** Linear interpolation of x in [x0,x1] onto [y0,y1], clamped to [y0,y1]. */
function lerp(
  x: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
): number {
  if (x1 === x0) return x >= x1 ? y1 : y0;
  const t = Math.max(0.0, Math.min(1.0, (x - x0) / (x1 - x0)));
  return y0 + t * (y1 - y0);
}

function clamp100(v: number): number {
  return Math.max(0.0, Math.min(100.0, v));
}

/**
 * Python-style banker's rounding (round half to even).
 * Python's built-in round() rounds 0.5 toward the nearest EVEN integer:
 *   round(32.5) → 32,  round(33.5) → 34
 * JavaScript Math.round always rounds 0.5 up, producing a ±1 divergence
 * on exact half-values. This matches Python's behaviour precisely.
 */
function pythonRound(x: number): number {
  const floor = Math.floor(x);
  const frac = x - floor;
  if (Math.abs(frac - 0.5) < 1e-10) {
    // Exactly on a .5 boundary — round to nearest even
    return floor % 2 === 0 ? floor : floor + 1;
  }
  return Math.round(x);
}

function band(score: number): string {
  if (score >= 80) return "Extreme";
  if (score >= 60) return "High";
  if (score >= 40) return "Moderate";
  if (score >= 20) return "Low";
  return "Minimal";
}

/**
 * Wet-bulb temperature (°C) from dry-bulb temp and relative humidity.
 * Stull (2011), J. Appl. Meteorol. Climatol. 50(11).
 * Empirical fit valid for RH 5-99% and T -20..50°C. Mean abs error < 0.3°C.
 */
export function wetBulbStull(
  temp_c: number | null,
  rh: number | null,
): number | null {
  if (
    temp_c === null ||
    temp_c === undefined ||
    rh === null ||
    rh === undefined
  )
    return null;
  const r = Math.max(5.0, Math.min(99.0, rh));
  const t = temp_c;
  const tw =
    t * Math.atan(0.151977 * Math.sqrt(r + 8.313659)) +
    Math.atan(t + r) -
    Math.atan(r - 1.676331) +
    0.00391838 * Math.pow(r, 1.5) * Math.atan(0.023101 * r) -
    4.686035;
  return tw;
}

// ------------------------------------------------------------------ date helpers

function dayPart(hour: number): string {
  if (hour >= 0 && hour < 3) return "midnight";
  if (hour >= 3 && hour < 6) return "early morning";
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

function fmtWhen(dt: string | Date | null): string {
  if (!dt) return "";
  let d: Date;
  if (typeof dt === "string") {
    const s = dt.replace("T", " ");
    d = new Date(s.length >= 16 ? s.slice(0, 16).replace(" ", "T") : s);
    if (isNaN(d.getTime())) return String(dt);
  } else {
    d = dt;
  }
  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-US", { month: "short" });
  return `${day} ${mon} ${dayPart(d.getHours())}`;
}

function fmtDate(d: string | Date | null): string {
  if (!d) return "";
  let dt: Date;
  if (typeof d === "string") {
    const s = d.replace("T", " ");
    dt = new Date(s.slice(0, 10));
    if (isNaN(dt.getTime())) return String(d);
  } else {
    dt = d;
  }
  const day = String(dt.getDate()).padStart(2, "0");
  const mon = dt.toLocaleString("en-US", { month: "short" });
  return `${day} ${mon}`;
}

// ------------------------------------------------------------------ scorers

type ScoreResult = [number, string, string[]];

/**
 * Heavy-rain / waterlogging risk — evaluated over the NEXT 5 DAYS only.
 *
 * Base driver : peak single-day rainfall in the window, vs IMD daily bands.
 * Amplifiers  : 5-day accumulation (waterlogging is duration-driven), number
 *               of wet days, and already-wet (antecedent) soil.
 */
export function scoreHeavyRain(
  rain_next5: (number | null)[] | null | undefined,
  soil_percentile: number | null | undefined,
  rain_dates?: (string | Date | null)[] | null,
  max_daily_rain?: number | null,
  total_rainfall?: number | null,
  rainy_days?: number | null,
): ScoreResult {
  const reasons: string[] = [];
  const contributions: [number, string][] = [];

  let peak: number;
  let total5: number;
  let wet_days5: number;
  let peak_date_str: string | null = null;

  if (rain_next5 && rain_next5.length > 0) {
    const window = rain_next5
      .slice(0, 5)
      .map((r, i) => [i, r] as [number, number | null])
      .filter(([, r]) => r !== null) as [number, number][];

    if (window.length > 0) {
      const [peak_idx, peakVal] = window.reduce((a, b) =>
        b[1] > a[1] ? b : a,
      );
      peak = peakVal;
      total5 = window.reduce((s, [, r]) => s + r, 0);
      wet_days5 = window.filter(([, r]) => r >= 2.5).length;
      if (
        rain_dates &&
        peak_idx < rain_dates.length &&
        rain_dates[peak_idx] !== null
      ) {
        peak_date_str = fmtDate(rain_dates[peak_idx]);
      }
    } else {
      peak = 0;
      total5 = 0;
      wet_days5 = 0;
    }
  } else {
    peak = max_daily_rain ?? 0;
    total5 = total_rainfall ?? peak;
    wet_days5 = rainy_days ?? 0;
  }

  if (
    (!rain_next5?.length && max_daily_rain === null) ||
    max_daily_rain === undefined
  ) {
    return [0.0, "no rainfall data", ["no rainfall data"]];
  }

  // Peak-day driver vs IMD 24-hr bands
  const r = peak;
  let base: number;
  if (r < 15.6) {
    base = lerp(r, 2.5, 15.6, 0, 15);
  } else if (r < 64.5) {
    base = lerp(r, 15.6, 64.5, 15, 45);
  } else if (r < 115.6) {
    base = lerp(r, 64.5, 115.6, 45, 70);
  } else if (r < 204.4) {
    base = lerp(r, 115.6, 204.4, 70, 90);
  } else {
    base = lerp(r, 204.4, 300.0, 90, 100);
  }

  if (peak_date_str) {
    reasons.push(
      `peak daily rain ${r.toFixed(1)} mm expected on ${peak_date_str}`,
    );
    contributions.push([
      base,
      `peak daily rain of ${r.toFixed(1)} mm on ${peak_date_str} (IMD 24-hr band)`,
    ]);
  } else {
    reasons.push(`peak daily rain ${r.toFixed(1)} mm in next 5 days`);
    contributions.push([
      base,
      `peak daily rain of ${r.toFixed(1)} mm (IMD 24-hr band)`,
    ]);
  }

  // 5-day accumulation bump
  let acc = 0.0;
  if (total5 > 100) {
    acc = lerp(total5, 100, 400, 0, 12);
    reasons.push(`5-day total ${total5.toFixed(1)} mm`);
    contributions.push([
      acc,
      `5-day rainfall accumulation of ${total5.toFixed(1)} mm`,
    ]);
  }
  if (wet_days5 >= 3) {
    const wd = Math.min(6.0, (wet_days5 - 2) * 2.0);
    acc += wd;
    reasons.push(`${wet_days5} wet days in the next 5 days`);
    contributions.push([
      wd,
      `${wet_days5} consecutive/near-consecutive wet days`,
    ]);
  }

  // Wet-soil amplifier
  let wet_bump = 0.0;
  if (
    soil_percentile !== null &&
    soil_percentile !== undefined &&
    soil_percentile > 70 &&
    r >= 64.5
  ) {
    wet_bump = lerp(soil_percentile, 70, 98, 4, 15);
    reasons.push("already-wet soil reduces infiltration");
    contributions.push([
      wet_bump,
      "already-saturated soil that cannot absorb more",
    ]);
  }

  const score = clamp100(base + acc + wet_bump);
  const major = contributions.reduce((a, b) => (b[0] > a[0] ? b : a))[1];
  return [score, major, reasons];
}

/**
 * Heat-stress risk combining DRY-BULB crop threshold and WET-BULB humid heat.
 */
export function scoreHeatStress(
  max_temp: number | null | undefined,
  avg_max_temp: number | null | undefined,
  humidity: number | null | undefined,
  station_type: string = "plains",
  crop_heat_threshold: number | null | undefined = null,
): ScoreResult {
  const reasons: string[] = [];
  const contributions: [number, string][] = [];

  if (max_temp === null || max_temp === undefined) {
    return [0.0, "no temperature data", ["no temperature data"]];
  }

  const st = (station_type || "plains").trim().toLowerCase();
  const thresholdMap: Record<string, number> = {
    plains: 40.0,
    coastal: 37.0,
    hilly: 30.0,
  };
  const thr =
    crop_heat_threshold !== null && crop_heat_threshold !== undefined
      ? crop_heat_threshold
      : (thresholdMap[st] ?? 40.0);
  const severe = thr + 5.0;

  // (1) Dry-bulb driver
  const t = max_temp;
  let dry: number;
  if (t < thr - 5) {
    dry = 0.0;
  } else if (t < thr) {
    dry = lerp(t, thr - 5, thr, 0, 35);
  } else if (t < severe) {
    dry = lerp(t, thr, severe, 35, 85);
  } else {
    dry = lerp(t, severe, severe + 3, 85, 100);
  }
  reasons.push(
    `peak temp ${t.toFixed(1)} C vs ${st} threshold ${Math.round(thr)} C`,
  );
  contributions.push([
    dry,
    `dry-bulb peak of ${t.toFixed(1)} C vs ${Math.round(thr)} C crop threshold`,
  ]);

  // Sustained-heat bump
  if (
    avg_max_temp !== null &&
    avg_max_temp !== undefined &&
    avg_max_temp >= thr - 3
  ) {
    const bump = Math.min(8.0, lerp(avg_max_temp, thr - 3, thr + 3, 0, 8));
    dry = clamp100(dry + bump);
    reasons.push(`sustained avg max ${avg_max_temp.toFixed(1)} C`);
  }

  // (2) Wet-bulb driver
  let wet = 0.0;
  const twb = wetBulbStull(max_temp, humidity ?? null);
  if (twb !== null) {
    if (twb < 26) {
      wet = lerp(twb, 22, 26, 0, 30);
    } else if (twb < 31) {
      wet = lerp(twb, 26, 31, 30, 70);
    } else {
      wet = lerp(twb, 31, 35, 70, 100);
    }
    reasons.push(`wet-bulb temp ${twb.toFixed(1)} C (humid-heat, Stull 2011)`);
    contributions.push([
      wet,
      `wet-bulb temperature of ${twb.toFixed(1)} C (humid heat limits cooling)`,
    ]);
  }

  const score = clamp100(Math.max(dry, wet));
  const major = contributions.reduce((a, b) => (b[0] > a[0] ? b : a))[1];
  return [score, major, reasons];
}

/**
 * Pest / disease pressure (heuristic index).
 */
export function scorePest(
  avg_max_temp: number | null | undefined,
  humidity: number | null | undefined,
  soil_percentile: number | null | undefined,
  rainy_days: number | null | undefined,
  total_rainfall?: number | null,
): ScoreResult {
  const reasons: string[] = [];
  const contributions: [number, string][] = [];
  let total = 0.0;
  let components = 0;

  if (avg_max_temp !== null && avg_max_temp !== undefined) {
    let t_score: number;
    if (avg_max_temp >= 25 && avg_max_temp <= 35) {
      t_score = lerp(Math.abs(avg_max_temp - 30), 0, 5, 100, 60);
    } else if (avg_max_temp < 25) {
      t_score = lerp(avg_max_temp, 15, 25, 20, 60);
    } else {
      t_score = lerp(avg_max_temp, 35, 45, 60, 20);
    }
    total += t_score;
    components += 1;
    reasons.push("warm temperatures favour pest activity");
    contributions.push([
      t_score,
      `warm temperatures (${avg_max_temp.toFixed(1)} C) in the pest-active band`,
    ]);
  }

  if (humidity !== null && humidity !== undefined) {
    const h_score = lerp(humidity, 50, 95, 10, 100);
    total += h_score;
    components += 1;
    if (humidity >= 70) {
      reasons.push(`high humidity ${Math.round(humidity)}% favours disease`);
    }
    contributions.push([
      h_score,
      `humidity of ${Math.round(humidity)}% favouring fungal disease`,
    ]);
  }

  let wet_score = 0.0;
  let wet_label: string | null = null;
  if (soil_percentile !== null && soil_percentile !== undefined) {
    const s = lerp(soil_percentile, 40, 95, 20, 90);
    if (s > wet_score) {
      wet_score = s;
      wet_label = "wet soil supporting pest/disease build-up";
    }
  }
  if (rainy_days !== null && rainy_days !== undefined) {
    const s = lerp(rainy_days, 2, 8, 20, 90);
    if (s > wet_score) {
      wet_score = s;
      wet_label = `${rainy_days} rainy days keeping foliage wet`;
    }
  }
  if (wet_label !== null) {
    total += wet_score;
    components += 1;
    reasons.push("prolonged wetness supports pest/disease build-up");
    contributions.push([wet_score, wet_label]);
  }

  if (components === 0) {
    return [
      0.0,
      "insufficient data for pest index",
      ["insufficient data for pest index"],
    ];
  }

  const score = clamp100(total / components);
  const major = contributions.reduce((a, b) => (b[0] > a[0] ? b : a))[1];
  return [score, major, reasons];
}

/**
 * Lightning risk — driven by the upstream lightning product.
 */
export function scoreLightning(
  lightning_score: number | null | undefined,
  lightning_category: string | null | undefined,
  wind_gusts: number | null | undefined,
): ScoreResult {
  const reasons: string[] = [];
  const contributions: [number, string][] = [];
  let base: number | null = null;

  if (lightning_score !== null && lightning_score !== undefined) {
    base = Number(lightning_score);
    reasons.push(`lightning index ${Math.round(base)}`);
    contributions.push([
      base,
      `upstream lightning index of ${Math.round(base)}`,
    ]);
  } else if (lightning_category) {
    const catMap: Record<string, number> = {
      none: 0,
      low: 20,
      moderate: 45,
      high: 70,
      severe: 90,
      extreme: 95,
    };
    const cat = lightning_category.trim().toLowerCase();
    base = catMap[cat] ?? 30;
    reasons.push(`lightning category '${lightning_category}'`);
    contributions.push([base, `lightning category '${lightning_category}'`]);
  } else {
    return [0.0, "no lightning data", ["no lightning data"]];
  }

  if (
    wind_gusts !== null &&
    wind_gusts !== undefined &&
    wind_gusts >= 40 &&
    base < 90
  ) {
    const bump = Math.min(8.0, lerp(wind_gusts, 40, 65, 2, 8));
    base += bump;
    reasons.push("gusty (convective) winds present");
    contributions.push([
      bump,
      "convective gusts indicating active thunderstorms",
    ]);
  }

  const score = clamp100(base);
  const major = contributions.reduce((a, b) => (b[0] > a[0] ? b : a))[1];
  return [score, major, reasons];
}

/**
 * Wind / lodging & spray-drift risk vs IMD gust bands.
 * Preferred input: raw hourly gust forecast (gusts_hourly + times_hourly).
 */
export function scoreWind(
  gusts_hourly?: (number | null)[] | null,
  times_hourly?: (string | Date | null)[] | null,
  wind_gusts?: number | null,
  wind_speed?: number | null,
): ScoreResult {
  const reasons: string[] = [];
  let peak: number | null = null;
  let when_str: string | null = null;

  if (gusts_hourly && gusts_hourly.length > 0) {
    const vals = gusts_hourly
      .map((g, i) => [i, g] as [number, number | null])
      .filter(([, g]) => g !== null) as [number, number][];
    if (vals.length > 0) {
      const [peak_idx, peakVal] = vals.reduce((a, b) => (b[1] > a[1] ? b : a));
      peak = peakVal;
      if (
        times_hourly &&
        peak_idx < times_hourly.length &&
        times_hourly[peak_idx] !== null
      ) {
        when_str = fmtWhen(times_hourly[peak_idx]);
      }
    }
  }
  if (peak === null) peak = wind_gusts ?? wind_speed ?? null;
  if (peak === null) {
    return [0.0, "no wind data", ["no wind data"]];
  }

  const g = peak;
  let base: number;
  if (g < 30) {
    base = lerp(g, 10, 30, 0, 20);
  } else if (g < 40) {
    base = lerp(g, 30, 40, 20, 40);
  } else if (g < 50) {
    base = lerp(g, 40, 50, 40, 65);
  } else if (g < 65) {
    base = lerp(g, 50, 65, 65, 90);
  } else {
    base = lerp(g, 65, 85, 90, 100);
  }

  if (when_str) {
    reasons.push(`wind gusts ${Math.round(g)} km/h expected on ${when_str}`);
  } else {
    reasons.push(`wind gusts ${Math.round(g)} km/h`);
  }
  if (g >= 40) reasons.push("spraying will drift — postpone");
  if (g >= 50) reasons.push("lodging risk for tall/flowering crops");

  const score = clamp100(base);
  const major = when_str
    ? `peak wind gusts of ${Math.round(g)} km/h on ${when_str} (IMD gust band)`
    : `wind gusts of ${Math.round(g)} km/h (IMD gust band)`;
  return [score, major, reasons];
}

/**
 * Frost / cold-stress risk from forecast minimum temperature.
 * Anchored to IMD India cold-wave criteria.
 */
export function scoreFrost(
  min_temp: number | null | undefined,
  avg_min_temp?: number | null,
  station_type: string = "plains",
): ScoreResult {
  const reasons: string[] = [];
  const t = min_temp ?? avg_min_temp ?? null;
  if (t === null || t === undefined) {
    return [
      0.0,
      "no minimum-temperature data",
      ["no minimum-temperature data"],
    ];
  }

  const st = (station_type || "plains").trim().toLowerCase();
  let base: number;

  if (st === "hilly") {
    if (t > 6) {
      base = 0.0;
    } else if (t > 2) {
      base = lerp(t, 6, 2, 0, 40);
    } else if (t > 0) {
      base = lerp(t, 2, 0, 40, 80);
    } else {
      base = lerp(t, 0, -4, 80, 100);
    }
    reasons.push(
      `forecast min temp ${t.toFixed(1)} C (IMD hilly cold-wave <=0 C)`,
    );
  } else {
    if (t > 10) {
      base = 0.0;
    } else if (t > 4) {
      base = lerp(t, 10, 4, 0, 40);
    } else if (t > 2) {
      base = lerp(t, 4, 2, 40, 70);
    } else if (t > 0) {
      base = lerp(t, 2, 0, 70, 85);
    } else {
      base = lerp(t, 0, -3, 85, 100);
    }
    reasons.push(
      `forecast min temp ${t.toFixed(1)} C (IMD plains Cold Wave <=4 C)`,
    );
  }

  const score = clamp100(base);
  if (score <= 0) {
    return [
      0.0,
      "temperatures well above frost/cold-wave range",
      ["temperatures well above frost/cold-wave range"],
    ];
  }
  const major = `forecast minimum temperature of ${t.toFixed(1)} C`;
  return [score, major, reasons];
}

// ------------------------------------------------------------------ top-level

const HAZARD_LABELS: Record<string, string> = {
  heavy_rain: "Heavy rain",
  heat_stress: "Heat stress",
  pest: "Pest / disease",
  lightning: "Lightning",
  wind: "Wind",
  frost: "Frost",
};

function pack(s: number, m: string, r: string[]): HazardScore {
  return { score: pythonRound(s), band: band(s), major_factor: m, reasons: r };
}

export function computeOverall(
  per_hazard: Record<string, HazardScore>,
): OverallScore {
  const items = Object.entries(per_hazard).sort(
    (a, b) => b[1].score - a[1].score,
  );
  const [_, worst] = items[0];
  const worst_score = worst.score;

  // Escalation from other high hazards (>= 40), diminishing per extra hazard
  const others_high = items
    .slice(1)
    .filter(([, v]) => v.score >= 40)
    .map(([, v]) => v.score);
  let escalation = 0.0;
  let weight = 0.5;
  for (const s of others_high) {
    escalation += weight * (s / 100.0) * 15.0;
    weight *= 0.5;
  }
  const overall_score = clamp100(worst_score + escalation);

  const ranked = items
    .filter(([, v]) => v.score >= 20)
    .map(([k, v]) => ({
      hazard: HAZARD_LABELS[k] ?? k,
      score: v.score,
      band: v.band,
      major_factor: v.major_factor,
    }));
  const contributors = ranked.slice(0, 3);

  let summary: string;
  if (contributors.length > 0) {
    const named = contributors
      .map((c) => `${c.hazard} (${c.score}/100, ${c.band})`)
      .join("; ");
    summary = `Driven mainly by ${named}.`;
  } else {
    summary = "All individual hazards are minimal.";
  }

  return {
    score: pythonRound(overall_score),
    band: band(overall_score),
    summary,
    major_contributors: contributors,
  };
}

/**
 * Compute all six risk scores from weather data.
 */
export function computeRiskScores(input: ComputeRiskInput): RiskScores {
  const {
    rain_next5,
    rain_dates,
    max_daily_rain,
    total_rainfall,
    rainy_days,
    max_temp,
    avg_max_temp,
    min_temp,
    avg_min_temp,
    humidity,
    gusts_hourly,
    times_hourly,
    wind_gusts,
    wind_speed,
    soil_moisture_available = false,
    soil_percentile,
    lightning_score,
    lightning_category,
    station_type = "plains",
    crop_heat_threshold,
  } = input;

  const sm = soil_moisture_available ? soil_percentile : null;

  // Derive peak gust from hourly series for lightning's convective bump
  let peak_gust = wind_gusts ?? null;
  if (gusts_hourly && gusts_hourly.length > 0) {
    const validGusts = gusts_hourly.filter((g) => g !== null) as number[];
    if (validGusts.length > 0) peak_gust = Math.max(...validGusts);
  }

  const [hr_s, hr_m, hr_r] = scoreHeavyRain(
    rain_next5,
    sm,
    rain_dates,
    max_daily_rain,
    total_rainfall,
    rainy_days,
  );
  const [ht_s, ht_m, ht_r] = scoreHeatStress(
    max_temp,
    avg_max_temp,
    humidity,
    station_type,
    crop_heat_threshold,
  );
  const [pe_s, pe_m, pe_r] = scorePest(
    avg_max_temp,
    humidity,
    sm,
    rainy_days,
    total_rainfall,
  );
  const [li_s, li_m, li_r] = scoreLightning(
    lightning_score,
    lightning_category,
    peak_gust,
  );
  const [wi_s, wi_m, wi_r] = scoreWind(
    gusts_hourly,
    times_hourly,
    wind_gusts,
    wind_speed,
  );
  const [fr_s, fr_m, fr_r] = scoreFrost(min_temp, avg_min_temp, station_type);

  const per_hazard: Record<string, HazardScore> = {
    heavy_rain: pack(hr_s, hr_m, hr_r),
    heat_stress: pack(ht_s, ht_m, ht_r),
    pest: pack(pe_s, pe_m, pe_r),
    lightning: pack(li_s, li_m, li_r),
    wind: pack(wi_s, wi_m, wi_r),
    frost: pack(fr_s, fr_m, fr_r),
  };

  const overall = computeOverall(per_hazard);

  return {
    overall,
    heavy_rain: per_hazard.heavy_rain,
    heat_stress: per_hazard.heat_stress,
    pest: per_hazard.pest,
    lightning: per_hazard.lightning,
    wind: per_hazard.wind,
    frost: per_hazard.frost,
  };
}
