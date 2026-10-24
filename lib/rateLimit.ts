// Best-effort per-IP rate limiting for the public API routes.
//
// State lives in this server instance's memory, so on Vercel each instance
// counts separately and limits reset on cold starts. That is enough to stop a
// single script from running up the AI bill; for a hard global limit add a
// Vercel Firewall rate-limit rule or a shared store (e.g. Upstash Redis).
//
// Limits are deliberately generous: Indian mobile carriers put many users
// behind one CGNAT IP, and one dashboard load fires several AI calls at once.

type Rule = { prefix: string; limit: number; windowMs: number };

const RULES: Rule[] = [
  { prefix: "/api/ai", limit: 40, windowMs: 60_000 },
  { prefix: "/api/disease/analyze", limit: 15, windowMs: 60_000 },
  { prefix: "/api/risk", limit: 60, windowMs: 60_000 },
  { prefix: "/api/locations", limit: 90, windowMs: 60_000 },
  { prefix: "/api/auth", limit: 10, windowMs: 60_000 },
];

const hits = new Map<string, number[]>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, times] of hits) {
    if (times.length === 0 || now - times[times.length - 1] > 10 * 60_000) {
      hits.delete(key);
    }
  }
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/** Returns seconds to wait if the request is over its limit, else null. */
export function checkRateLimit(pathname: string, ip: string): number | null {
  const rule = RULES.find((r) => pathname.startsWith(r.prefix));
  if (!rule) return null;

  const now = Date.now();
  sweep(now);

  const key = `${rule.prefix}|${ip}`;
  const recent = (hits.get(key) ?? []).filter((t) => now - t < rule.windowMs);

  if (recent.length >= rule.limit) {
    hits.set(key, recent);
    return Math.ceil((rule.windowMs - (now - recent[0])) / 1000);
  }

  recent.push(now);
  hits.set(key, recent);
  return null;
}
