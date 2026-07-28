#!/usr/bin/env node
/**
 * compare_risk_scores.mjs
 * ===========================================================================
 * Runs 100 randomised test cases through BOTH:
 *   - Python  : app/api/risk/Risk_scores.py  (via child_process)
 *   - TypeScript: app/api/risk/riskScores.ts  (compiled inline with tsx/ts-node)
 *
 * Usage:
 *   node scripts/compare_risk_scores.mjs
 *   # or, if you have tsx:
 *   npx tsx scripts/compare_risk_scores.mjs
 *
 * Requirements:
 *   - python3 in PATH
 *   - The project root to have node_modules (npm install already done)
 * ===========================================================================
 */

import { execSync, spawnSync } from "child_process";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// 1.  TypeScript scorer — imported via dynamic require after ts-node/tsx
// ---------------------------------------------------------------------------

// We'll evaluate the TS file by transpiling it on-the-fly using tsx / ts-node.
// We write a tiny runner script that accepts JSON on stdin and prints JSON on stdout.
const TS_RUNNER = path.join(ROOT, "scripts", "_ts_risk_runner.mts");
fs.writeFileSync(
  TS_RUNNER,
  `
import { computeRiskScores } from "../app/api/risk/riskScores.ts";
const input = JSON.parse(process.argv[2]);
const result = computeRiskScores(input);
console.log(JSON.stringify(result));
`.trim(),
);

// ---------------------------------------------------------------------------
// 2.  Python scorer runner — inline Python that wraps Risk_scores.py
// ---------------------------------------------------------------------------
const PY_RUNNER = path.join(ROOT, "scripts", "_py_risk_runner.py");
fs.writeFileSync(
  PY_RUNNER,
  `
import sys, json, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'app', 'api', 'risk'))
from Risk_scores import compute_risk_scores

raw = json.loads(sys.argv[1])

def fix(v):
    if isinstance(v, list):
        return [fix(x) for x in v]
    return v

result = compute_risk_scores(
    rain_next5=raw.get('rain_next5'),
    rain_dates=raw.get('rain_dates'),
    max_daily_rain=raw.get('max_daily_rain'),
    total_rainfall=raw.get('total_rainfall'),
    rainy_days=raw.get('rainy_days'),
    max_temp=raw.get('max_temp'),
    avg_max_temp=raw.get('avg_max_temp'),
    min_temp=raw.get('min_temp'),
    avg_min_temp=raw.get('avg_min_temp'),
    humidity=raw.get('humidity'),
    gusts_hourly=raw.get('gusts_hourly'),
    times_hourly=raw.get('times_hourly'),
    wind_gusts=raw.get('wind_gusts'),
    wind_speed=raw.get('wind_speed'),
    soil_moisture_available=raw.get('soil_moisture_available', False),
    soil_percentile=raw.get('soil_percentile'),
    lightning_score=raw.get('lightning_score'),
    lightning_category=raw.get('lightning_category'),
    station_type=raw.get('station_type', 'plains'),
    crop_heat_threshold=raw.get('crop_heat_threshold'),
)

# Convert any non-serialisable types to strings
def serialise(obj):
    if isinstance(obj, dict):
        return {k: serialise(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [serialise(x) for x in obj]
    return obj

print(json.dumps(serialise(result)))
`.trim(),
);

// ---------------------------------------------------------------------------
// 3.  Random input generator
// ---------------------------------------------------------------------------
function rand(min, max) {
  return Math.random() * (max - min) + min;
}
function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}
function maybe(fn, prob = 0.8) {
  return Math.random() < prob ? fn() : null;
}

const ISO_BASE = "2026-07-07";

function makeDates(n) {
  const d = new Date(ISO_BASE);
  return Array.from({ length: n }, (_, i) => {
    const dd = new Date(d);
    dd.setDate(dd.getDate() + i);
    return dd.toISOString().slice(0, 10);
  });
}

function makeHourlyGusts(n = 120) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    arr.push(maybe(() => rand(5, 85), 0.95));
  }
  return arr;
}

function makeHourlyTimes(n = 120) {
  const d = new Date(ISO_BASE + "T00:00:00");
  return Array.from({ length: n }, (_, i) => {
    const dd = new Date(d.getTime() + i * 3600000);
    return dd.toISOString().slice(0, 16);
  });
}

const STATION_TYPES = ["plains", "hilly", "coastal"];
const LIGHTNING_CATS = ["none", "low", "moderate", "high", "severe", "extreme", null];

function generateInput() {
  const hasRainSeries = Math.random() < 0.7;
  const hasHourlyGusts = Math.random() < 0.6;
  const n5 = 5;

  return {
    rain_next5: hasRainSeries ? Array.from({ length: n5 }, () => maybe(() => rand(0, 250), 0.9)) : null,
    rain_dates: hasRainSeries ? makeDates(n5) : null,
    max_daily_rain: !hasRainSeries ? maybe(() => rand(0, 250)) : null,
    total_rainfall: !hasRainSeries ? maybe(() => rand(0, 600)) : null,
    rainy_days: maybe(() => randInt(0, 7)),
    max_temp: maybe(() => rand(5, 48)),
    avg_max_temp: maybe(() => rand(5, 45)),
    min_temp: maybe(() => rand(-5, 35)),
    avg_min_temp: maybe(() => rand(-5, 32)),
    humidity: maybe(() => rand(5, 99)),
    gusts_hourly: hasHourlyGusts ? makeHourlyGusts() : null,
    times_hourly: hasHourlyGusts ? makeHourlyTimes() : null,
    wind_gusts: maybe(() => rand(0, 120)),
    wind_speed: maybe(() => rand(0, 80)),
    soil_moisture_available: Math.random() < 0.6,
    soil_percentile: maybe(() => rand(0, 100)),
    lightning_score: maybe(() => rand(0, 100), 0.5),
    lightning_category: LIGHTNING_CATS[randInt(0, LIGHTNING_CATS.length - 1)],
    station_type: STATION_TYPES[randInt(0, 2)],
    crop_heat_threshold: maybe(() => rand(28, 45), 0.3),
  };
}

// ---------------------------------------------------------------------------
// 4.  Run one input through both scorers
// ---------------------------------------------------------------------------
function runPython(input) {
  const arg = JSON.stringify(input);
  const result = spawnSync("python3", [PY_RUNNER, arg], { encoding: "utf-8" });
  if (result.status !== 0) {
    throw new Error(`Python error: ${result.stderr}`);
  }
  return JSON.parse(result.stdout.trim());
}

function runTS(input) {
  const arg = JSON.stringify(input);
  // Try tsx first, fall back to ts-node
  for (const cmd of ["npx tsx", "npx ts-node --esm"]) {
    const result = spawnSync(cmd.split(" ")[0], [...cmd.split(" ").slice(1), TS_RUNNER, arg], {
      encoding: "utf-8",
      cwd: ROOT,
    });
    if (result.status === 0) return JSON.parse(result.stdout.trim());
  }
  throw new Error("Neither tsx nor ts-node is available. Install tsx: npm i -D tsx");
}

// ---------------------------------------------------------------------------
// 5.  Comparison logic
// ---------------------------------------------------------------------------
const SCORE_KEYS = ["overall", "heavy_rain", "heat_stress", "pest", "lightning", "wind", "frost"];

function compareScores(py, ts, caseIndex) {
  const diffs = [];

  for (const key of SCORE_KEYS) {
    const pyBlock = py[key];
    const tsBlock = ts[key];

    if (!pyBlock || !tsBlock) {
      diffs.push(`[${key}] missing in one output`);
      continue;
    }

    // score must match exactly (both use round())
    if (pyBlock.score !== tsBlock.score) {
      diffs.push(`[${key}] score: py=${pyBlock.score} ts=${tsBlock.score}`);
    }
    // band must match
    if (pyBlock.band !== tsBlock.band) {
      diffs.push(`[${key}] band: py="${pyBlock.band}" ts="${tsBlock.band}"`);
    }
  }

  return diffs;
}

// ---------------------------------------------------------------------------
// 6.  Main loop
// ---------------------------------------------------------------------------
const TOTAL = 100;
let passed = 0;
let failed = 0;
const failures = [];

console.log(`\n🧪  Comparing Python vs TypeScript risk scorer — ${TOTAL} random cases\n`);

for (let i = 0; i < TOTAL; i++) {
  const input = generateInput();

  let py, ts;
  try {
    py = runPython(input);
  } catch (e) {
    console.error(`  Case ${i + 1}: Python error — ${e.message}`);
    failed++;
    continue;
  }
  try {
    ts = runTS(input);
  } catch (e) {
    console.error(`  Case ${i + 1}: TypeScript error — ${e.message}`);
    failed++;
    continue;
  }

  const diffs = compareScores(py, ts, i + 1);
  if (diffs.length === 0) {
    passed++;
    process.stdout.write(`\r  ✅  ${passed} passed, ${failed} failed  (case ${i + 1}/${TOTAL})`);
  } else {
    failed++;
    failures.push({ case: i + 1, input, diffs, py, ts });
    console.log(`\n  ❌  Case ${i + 1} FAILED:`);
    for (const d of diffs) console.log(`       ${d}`);
  }
}

console.log(`\n\n${"=".repeat(60)}`);
console.log(`  Results: ${passed} passed / ${failed} failed / ${TOTAL} total`);

if (failures.length > 0) {
  console.log(`\n  First failure detail:`);
  const f = failures[0];
  console.log(`  Input: ${JSON.stringify(f.input, null, 2)}`);
  console.log(`  Python:     ${JSON.stringify(f.py?.overall)}`);
  console.log(`  TypeScript: ${JSON.stringify(f.ts?.overall)}`);
  console.log(`  Diffs: ${f.diffs.join(", ")}`);
  process.exit(1);
} else {
  console.log(`\n  🎉  All ${TOTAL} cases matched — Python and TypeScript are identical.\n`);
}

// Cleanup runner shims
fs.unlinkSync(TS_RUNNER);
fs.unlinkSync(PY_RUNNER);
