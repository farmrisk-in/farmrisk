export interface SavedField {
  /** Primary key of the saved_fields row (uuid). */
  id: string;
  /** Identifier of the source field (e.g. FTW feature id) that was saved. */
  fieldId: string;
  /** How the field boundary was obtained: satellite detection or hand-drawn. */
  source: "detected" | "manual";
  year: string;
  countryCode?: string | null;
  areaM2?: number | null;
  confidence?: number | null;
  geometry: Record<string, unknown>;
  properties: Record<string, unknown>;
  savedAt: string;
  /** User-facing name, e.g. "North Farm" */
  name?: string;
  /** Bounding-box centroid of the field geometry */
  centerLat?: number | null;
  centerLng?: number | null;
  /** Crop ids grown on this field (from the crops API) */
  crops?: string[];
  /** Season id: kharif | rabi | zaid */
  season?: string;
  /** Crop stage id: sowing | vegetative | flowering | maturity */
  cropStage?: string;
}

export interface ClickedField {
  id: string;
  properties: Record<string, unknown>;
  geometry: Record<string, unknown>;
}
