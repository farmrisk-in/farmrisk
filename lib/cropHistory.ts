export interface CropHistoryRecord {
  id: string;
  addedAt: string;
}

/** A crop that is currently being grown on at least one of the user's fields. */
export interface ActiveCrop {
  /** ISO timestamp of when this crop most recently became active. */
  since: string;
}

export interface CropHistoryState {
  /** Crops currently grown (multi-field aware), keyed by crop id. */
  active: Record<string, ActiveCrop>;
  /** Historical crops (previously grown for >7 days), each id stored once. */
  history: CropHistoryRecord[];
}

export const HISTORY_ELIGIBLE_MS = 7 * 24 * 60 * 60 * 1000;

export const EMPTY_CROP_HISTORY: CropHistoryState = {
  active: {},
  history: [],
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Normalizes raw persisted data into a safe CropHistoryState. Understands both
 * the multi-field shape ({ active, history }) and the legacy single-crop shape
 * ({ currentCrop, currentSince, crops }).
 */
export function sanitizeCropHistory(raw: unknown): CropHistoryState {
  const base: CropHistoryState = {
    active: {},
    history: [],
  };
  if (!isRecord(raw)) return base;

  if (isRecord(raw.active)) {
    for (const [id, value] of Object.entries(raw.active)) {
      if (!id) continue;
      base.active[id] = {
        since: isRecord(value) && typeof value.since === "string" ? value.since : new Date(0).toISOString(),
      };
    }
  } else if (typeof raw.currentCrop === "string" && raw.currentCrop) {
    // Legacy single-crop shape.
    base.active[raw.currentCrop] = {
      since:
        typeof raw.currentSince === "string"
          ? raw.currentSince
          : new Date(0).toISOString(),
    };
  }

  const historyRaw = Array.isArray(raw.history)
    ? raw.history
    : Array.isArray(raw.crops)
      ? raw.crops
      : [];
  const seen = new Set<string>();
  for (const entry of historyRaw) {
    if (!isRecord(entry)) continue;
    const id = typeof entry.id === "string" && entry.id.length > 0 ? entry.id : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);
    base.history.push({
      id,
      addedAt:
        typeof entry.addedAt === "string" ? entry.addedAt : new Date(0).toISOString(),
    });
  }

  return base;
}

/**
 * Synchronizes the crop history so that the set of active (currently grown)
 * crops matches `currentActiveIds` (the union of crops across all saved fields).
 *
 * - Crops in `currentActiveIds` become/remain active. A newly active crop gets
 *   `since = now` and is never added to history on this step.
 * - A crop that leaves the active set moves into history ONLY if it stayed
 *   active for more than 7 days (HISTORY_ELIGIBLE_MS). Crops are never
 *   duplicated.
 */
export function syncCropHistory(
  state: CropHistoryState | null | undefined,
  currentActiveIds: string[],
  now: string,
): CropHistoryState {
  const base = state ? sanitizeCropHistory(state) : EMPTY_CROP_HISTORY;
  const nowMs = Date.parse(now);
  const wanted = new Set((currentActiveIds ?? []).filter(Boolean));

  const nextActive: Record<string, ActiveCrop> = {};
  let nextHistory = base.history;

  for (const [id, active] of Object.entries(base.active)) {
    if (wanted.has(id)) {
      nextActive[id] = active;
      continue;
    }
    const sinceMs = Date.parse(active.since);
    if (
      !Number.isNaN(sinceMs) &&
      !Number.isNaN(nowMs) &&
      nowMs - sinceMs > HISTORY_ELIGIBLE_MS &&
      !nextHistory.some((r) => r.id === id)
    ) {
      nextHistory = [...nextHistory, { id, addedAt: now }];
    }
  }

  for (const id of wanted) {
    if (!(id in nextActive)) {
      nextActive[id] = { since: now };
    }
  }

  return { active: nextActive, history: nextHistory };
}

/** Ids of crops currently being grown. */
export function cropActiveIds(state: CropHistoryState | null | undefined): string[] {
  const s = state ? sanitizeCropHistory(state) : EMPTY_CROP_HISTORY;
  return Object.keys(s.active);
}

/** Union of active + historical crops, each id once. */
export function cropHistoryUnionIds(
  state: CropHistoryState | null | undefined,
): string[] {
  const s = state ? sanitizeCropHistory(state) : EMPTY_CROP_HISTORY;
  const ids = Object.keys(s.active);
  const seen = new Set(ids);
  for (const r of s.history) {
    if (!seen.has(r.id) && r.id) {
      seen.add(r.id);
      ids.push(r.id);
    }
  }
  return ids;
}