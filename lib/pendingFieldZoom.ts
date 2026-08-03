import type { ClickedField } from "@/types/fields";

/**
 * UI-only transport used by the "My Fields" list to tell the "Select Fields"
 * map page which saved field to zoom into, center and highlight once it
 * mounts. Purely presentational — no backend, navigation or map logic lives
 * here.
 */
const KEY = "farmrisk.pendingFieldZoom";

export interface PendingFieldZoom extends ClickedField {
  /** Saved year so the map switches to the same season tiles. */
  year?: string | number;
}

export function setPendingFieldZoom(field: PendingFieldZoom | null): void {
  if (field) {
    sessionStorage.setItem(KEY, JSON.stringify(field));
  } else {
    sessionStorage.removeItem(KEY);
  }
}

export function consumePendingFieldZoom(): PendingFieldZoom | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  sessionStorage.removeItem(KEY);
  try {
    return JSON.parse(raw) as PendingFieldZoom;
  } catch {
    return null;
  }
}
