"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { SavedField } from "@/types/fields";
import type { Database, Json } from "@/types/database";

type SavedFieldsRow = Database["public"]["Tables"]["saved_fields"]["Row"];
type SavedFieldsInsert = Database["public"]["Tables"]["saved_fields"]["Insert"];
type SavedFieldsUpdate = Database["public"]["Tables"]["saved_fields"]["Update"];
type ProfileMetadata = Database["public"]["Tables"]["profiles"]["Update"]["metadata"];

const asJson = (value: Record<string, unknown>): Json => value as unknown as Json;

/** Payload used to persist a newly saved field. `id` is assigned by the DB. */
export interface NewFieldRecord {
  fieldId: string;
  fieldName: string;
  source: "detected" | "manual";
  year: string;
  countryCode?: string | null;
  areaM2?: number | null;
  confidence?: number | null;
  geometry: Record<string, unknown>;
  properties: Record<string, unknown>;
  centerLat?: number | null;
  centerLng?: number | null;
  crops?: string[];
  season?: string;
  cropStage?: string;
}

function mapRowToField(row: SavedFieldsRow): SavedField {
  return {
    id: row.id,
    fieldId: row.field_id ?? "",
    source: row.source === "manual" ? "manual" : "detected",
    year: row.year ?? "",
    countryCode: row.country_code ?? undefined,
    areaM2: row.area_m2 ?? null,
    confidence: row.confidence ?? null,
    geometry: (row.geometry as Record<string, unknown>) ?? {},
    properties: (row.properties as Record<string, unknown>) ?? {},
    savedAt: row.created_at,
    name: row.field_name ?? undefined,
    centerLat: row.center_lat ?? null,
    centerLng: row.center_lng ?? null,
    crops: row.crops ?? [],
    season: row.season ?? undefined,
    cropStage: row.crop_stage ?? undefined,
    lastCropEditedAt:
      (row.properties as Record<string, unknown> | null)?.[
        "lastCropEditedAt"
      ] as string | null | undefined,
  };
}

function fieldToRow(userId: string, input: NewFieldRecord): SavedFieldsInsert {
  return {
    user_id: userId,
    field_id: input.fieldId,
    field_name: input.fieldName,
    source: input.source,
    year: input.year,
    country_code: input.countryCode ?? null,
    area_m2: input.areaM2 ?? null,
    confidence: input.confidence ?? null,
    geometry: asJson(input.geometry),
    properties: asJson(input.properties),
    center_lat: input.centerLat ?? null,
    center_lng: input.centerLng ?? null,
    crops: input.crops ?? [],
    season: input.season ?? null,
    crop_stage: input.cropStage ?? null,
  };
}

function fieldPatchToRow(patch: Partial<NewFieldRecord>): SavedFieldsUpdate {
  const row: SavedFieldsUpdate = {};
  if (patch.fieldId !== undefined) row.field_id = patch.fieldId;
  if (patch.fieldName !== undefined) row.field_name = patch.fieldName;
  if (patch.source !== undefined) row.source = patch.source;
  if (patch.year !== undefined) row.year = patch.year;
  if (patch.countryCode !== undefined) row.country_code = patch.countryCode ?? null;
  if (patch.areaM2 !== undefined) row.area_m2 = patch.areaM2 ?? null;
  if (patch.confidence !== undefined) row.confidence = patch.confidence ?? null;
  if (patch.geometry !== undefined) row.geometry = asJson(patch.geometry);
  if (patch.properties !== undefined) row.properties = asJson(patch.properties);
  if (patch.centerLat !== undefined) row.center_lat = patch.centerLat ?? null;
  if (patch.centerLng !== undefined) row.center_lng = patch.centerLng ?? null;
  if (patch.crops !== undefined) row.crops = patch.crops ?? [];
  if (patch.season !== undefined) row.season = patch.season ?? null;
  if (patch.cropStage !== undefined) row.crop_stage = patch.cropStage ?? null;
  return row;
}

/** Maps a legacy profiles.metadata.fields entry (old SavedField shape) to a row. */
function legacyFieldToRow(userId: string, legacy: unknown): SavedFieldsInsert | null {
  if (!legacy || typeof legacy !== "object") return null;
  const f = legacy as Record<string, unknown>;
  const fieldId = f.id;
  const year = f.year;
  if (typeof fieldId !== "string" || typeof year !== "string") return null;

  const asString = (v: unknown): string | null =>
    typeof v === "string" && v.length > 0 ? v : null;
  const asNumber = (v: unknown): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null;
  const asObject = (v: unknown): Record<string, unknown> | null =>
    v && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : null;

  return {
    user_id: userId,
    field_id: fieldId,
    field_name: asString(f.name),
    source: "detected",
    year,
    country_code: asString(f.countryCode),
    area_m2: asNumber(f.areaM2),
    confidence: asNumber(f.confidence),
    geometry: asJson(asObject(f.geometry) ?? {}),
    properties: asJson(asObject(f.properties) ?? {}),
    center_lat: asNumber(f.centerLat),
    center_lng: asNumber(f.centerLng),
    crops: Array.isArray(f.crops)
      ? f.crops.filter((c): c is string => typeof c === "string")
      : [],
    season: asString(f.season),
    crop_stage: asString(f.cropStage),
    created_at: typeof f.savedAt === "string" ? f.savedAt : undefined,
  };
}

export function useFields() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const userId = user?.id;
  const queryKey = useMemo(() => ["saved-fields", userId] as const, [userId]);

  const query = useQuery<SavedField[], Error>({
    queryKey,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("saved_fields")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapRowToField);
    },
    enabled: !!userId,
  });

  const invalidate = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const saveMutation = useMutation({
    mutationFn: async (input: NewFieldRecord) => {
      if (!userId) throw new Error("User must be logged in to save a field");
      const { data, error } = await supabase
        .from("saved_fields")
        .insert(fieldToRow(userId, input))
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return mapRowToField(data);
    },
    onSuccess: () => invalidate(),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<NewFieldRecord>;
    }) => {
      if (!userId) throw new Error("User must be logged in to update a field");
      const { error } = await supabase
        .from("saved_fields")
        .update(fieldPatchToRow(patch))
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => invalidate(),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error("User must be logged in to delete a field");
      const { error } = await supabase
        .from("saved_fields")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => invalidate(),
  });

  // One-time backfill: if the legacy profiles.metadata.fields array still holds
  // data (e.g. the SQL backfill migration has not been applied yet), copy it into
  // saved_fields, then drop the key so the app never reads it again.
  const backfillRanRef = useRef(false);
  useEffect(() => {
    if (!userId || backfillRanRef.current) return;
    if (query.isLoading) return;
    if ((query.data ?? []).length > 0) {
      backfillRanRef.current = true;
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data: profileRow, error: profileError } = await supabase
          .from("profiles")
          .select("metadata")
          .eq("id", userId)
          .maybeSingle();
        if (profileError) return;
        const meta = (profileRow?.metadata ?? {}) as Record<string, unknown>;
        const legacy = meta.fields;
        if (!Array.isArray(legacy) || legacy.length === 0) {
          backfillRanRef.current = true;
          return;
        }
        const rows = legacy
          .map((f) => legacyFieldToRow(userId, f))
          .filter((r): r is SavedFieldsInsert => r !== null);
        if (rows.length === 0) {
          backfillRanRef.current = true;
          return;
        }
        const { error: insertError } = await supabase
          .from("saved_fields")
          .insert(rows);
        if (insertError) return;
        const nextMeta = { ...meta };
        delete nextMeta.fields;
        await supabase
          .from("profiles")
          .update({ metadata: nextMeta as ProfileMetadata })
          .eq("id", userId);
        if (!cancelled) {
          backfillRanRef.current = true;
          invalidate();
          queryClient.invalidateQueries({ queryKey: ["profile", userId] });
        }
      } catch (err) {
        console.warn("[useFields] Legacy fields backfill skipped:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, query.isLoading, query.data, invalidate, queryClient, supabase]);

  const getFieldById = useCallback(
    (id: string | null | undefined) => {
      if (!id) return null;
      return query.data?.find((f) => f.id === id) ?? null;
    },
    [query.data],
  );

  return {
    fields: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    saveField: saveMutation.mutateAsync,
    updateField: updateMutation.mutateAsync,
    deleteField: deleteMutation.mutateAsync,
    getFieldById,
    invalidate,
    isSaving: saveMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
