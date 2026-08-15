"use client";

import React, { useState } from "react";
import { useFields } from "@/hooks/useFields";
import { useLanguage } from "@/hooks/useLanguage";
import { useNavigation } from "@/hooks/useNavigation";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { translateCropName } from "@/lib/cropName";
import { cn } from "@/lib/utils";
import type { SavedField } from "@/types/fields";
import { setPendingFieldZoom } from "@/lib/pendingFieldZoom";
import {
  ArrowLeft,
  ArrowUpRight,
  Download,
  LandPlot,
  LoaderCircle,
  MapPin,
  PenLine,
  Trash2,
  ZoomIn,
} from "lucide-react";
import EditFieldCropDialog from "./EditFieldCropDialog";

function fmtFieldArea(m2: number | null | undefined): string {
  if (m2 == null || isNaN(m2)) return "";
  const ha = m2 / 10000;
  return ha >= 1 ? `${ha.toFixed(2)} ha` : `${Math.round(m2)} m²`;
}

function FieldDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="truncate text-xs font-medium text-foreground">{value}</dd>
    </div>
  );
}

export default function MyFields() {
  const { t, language } = useLanguage();
  const { setCurrentPage } = useNavigation();
  const {
    fields: savedFields,
    deleteField,
    updateField,
    isUpdating,
    isDeleting,
    isLoading,
  } = useFields();
  const { syncCropHistory } = useProfile();

  const [editingField, setEditingField] = useState<SavedField | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fieldDisplayName = (field: SavedField) =>
    field.name || `${t.fields.fieldFallbackName} · ${field.year}`;

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(language === "hi" ? "hi-IN" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleExport = () => {
    if (!savedFields.length) return;
    const fc = {
      type: "FeatureCollection",
      features: savedFields.map((sf) => ({
        type: "Feature",
        properties: {
          ...sf.properties,
          year: sf.year,
          savedAt: sf.savedAt,
          name: sf.name,
          crops: sf.crops,
          season: sf.season,
          cropStage: sf.cropStage,
        },
        geometry: sf.geometry,
      })),
    };
    const blob = new Blob([JSON.stringify(fc, null, 2)], {
      type: "application/geo+json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "my-fields.geojson";
    a.click();
    toast.success(t.fields.exportSuccess);
  };

  const handleRemove = async (field: SavedField) => {
    try {
      await deleteField(field.id);
      try {
        const remainingCrops = [
          ...new Set(
            savedFields
              .filter((x) => x.id !== field.id)
              .flatMap((x) => x.crops ?? []),
          ),
        ];
        await syncCropHistory(remainingCrops);
      } catch {
        // best effort - crop history must not block the field delete flow
      }
      toast.success(t.fields.removeSuccess);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.fields.saveError);
    }
  };

  const handleViewField = (field: SavedField) => {
    setPendingFieldZoom({
      id: field.fieldId,
      properties: field.properties,
      geometry: field.geometry,
      year: field.year,
    });
    setCurrentPage("SelectFields");
  };

  const handleEditClick = (field: SavedField) => {
    setEditingField(field);
    setEditOpen(true);
  };

  const handleEditCrop = async (cropId: string) => {
    if (!editingField) return;
    try {
      await updateField({
        id: editingField.id,
        patch: {
          crops: [cropId],
          properties: {
            ...(editingField.properties ?? {}),
            lastCropEditedAt: new Date().toISOString(),
          },
        },
      });
      try {
        const activeCrops = [
          ...new Set([
            ...savedFields
              .filter((x) => x.id !== editingField.id)
              .flatMap((x) => x.crops ?? []),
            cropId,
          ]),
        ];
        await syncCropHistory(activeCrops);
      } catch {
        // best effort - crop history must not block the field edit flow
      }
      toast.success(t.fields.cropUpdated);
      setEditOpen(false);
      setEditingField(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.fields.saveError);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-3 sm:p-4 space-y-3 animate-in fade-in duration-200">
      {/* Back */}
      <button
        type="button"
        onClick={() => setCurrentPage("Profile")}
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        {t.fields.back}
      </button>

      {/* Title + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <LandPlot className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {t.fields.myFieldsTitle}
            </h2>
            <p className="text-xs text-muted-foreground">
              {savedFields.length > 0
                ? `${savedFields.length} ${t.fields.savedFields}`
                : t.fields.noFieldsYet}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={savedFields.length === 0}
            className="h-8 text-xs rounded-md flex items-center gap-1.5 border-border hover:bg-muted cursor-pointer"
          >
            <Download className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{t.fields.exportBtn}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setCurrentPage("SelectFields")}
            className="h-8 text-xs rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
          >
            <ArrowUpRight className="size-3.5" />
            {t.sidebar.selectFields}
          </Button>
        </div>
      </div>

      {/* Field cards */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-md" />
          <Skeleton className="h-32 w-full rounded-md" />
        </div>
      ) : savedFields.length === 0 ? (
        <div className="mt-1 flex flex-col items-center justify-center gap-2.5 rounded-md border border-dashed border-border bg-muted/40 px-4 py-10 text-center">
          <MapPin className="size-6 text-muted-foreground/80" />
          <p className="text-xs text-muted-foreground">{t.fields.noFieldsYet}</p>
          <Button
            type="button"
            size="sm"
            onClick={() => setCurrentPage("SelectFields")}
            className="mt-1 h-8 text-xs rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
          >
            <ArrowUpRight className="size-3.5" />
            {t.sidebar.selectFields}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {savedFields.map((field) => {
            const fieldCrops = field.crops ?? [];
            return (
              <div
                key={`${field.year}:${field.id}:${field.savedAt}`}
                className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/50 hover:shadow-md"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold text-foreground">
                    {fieldDisplayName(field)}
                  </p>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "shrink-0 rounded-full text-[10px] font-medium",
                      field.source === "manual"
                        ? "bg-muted text-muted-foreground"
                        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                    )}
                  >
                    {field.source === "manual" ? t.fields.manual : t.fields.detected}
                  </Badge>
                </div>

                {/* Meta */}
                <p className="mt-1 truncate text-[11px] text-muted-foreground">
                  {field.countryCode || "FTW"} · {field.year}
                  {field.confidence != null
                    ? ` · ${Math.round(field.confidence)}% ${t.fields.confidenceLabel}`
                    : ""}
                </p>

                {/* Crop chips */}
                {fieldCrops.length > 0 ? (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {fieldCrops.map((cid) => (
                      <Badge
                        key={cid}
                        variant="secondary"
                        className="rounded-full text-[10px]"
                      >
                        {translateCropName({ id: cid, name: cid }, t)}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2.5 text-[11px] text-muted-foreground italic">
                    {t.fields.noCrops}
                  </p>
                )}

                {/* Details */}
                <dl className="mt-3 space-y-1.5">
                  <FieldDetail
                    label={t.fields.areaLabel}
                    value={fmtFieldArea(field.areaM2) || "—"}
                  />
                  <FieldDetail
                    label={t.fields.addedLabel}
                    value={fmtDate(field.savedAt)}
                  />
                </dl>

                {/* ID */}
                <p className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5 text-[10px] text-muted-foreground/70">
                  <span className="truncate">
                    {t.fields.idLabel}: {String(field.fieldId || field.id).slice(0, 20)}
                  </span>
                  <span className="shrink-0">
                    {t.fields.lastCropEdited}:{" "}
                    {field.lastCropEditedAt
                      ? fmtDate(field.lastCropEditedAt)
                      : t.fields.notEditedYet}
                  </span>
                </p>

                {/* Actions */}
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => handleViewField(field)}
                    className="min-w-0 h-auto min-h-[2.25rem] whitespace-normal text-xs leading-tight rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-1.5 px-1"
                  >
                    <ZoomIn className="size-3.5 shrink-0" />
                    <span className="min-w-0">{t.fields.zoomBtn}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleEditClick(field)}
                    className="min-w-0 h-auto min-h-[2.25rem] whitespace-normal text-xs leading-tight rounded-lg border-border flex items-center justify-center gap-1.5 px-1"
                  >
                    <PenLine className="size-3.5 shrink-0 text-primary" />
                    <span className="min-w-0">{t.fields.editCropBtn}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isDeleting}
                    onClick={() => handleRemove(field)}
                    className="min-w-0 h-auto min-h-[2.25rem] whitespace-normal text-xs leading-tight rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center justify-center gap-1.5 px-1"
                  >
                    {isDeleting ? (
                      <LoaderCircle className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5 shrink-0" />
                    )}
                    <span className="min-w-0">{t.fields.removeBtn}</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EditFieldCropDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        field={editingField}
        isSaving={isUpdating}
        onSave={handleEditCrop}
      />
    </div>
  );
}
