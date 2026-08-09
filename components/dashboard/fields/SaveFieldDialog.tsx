"use client";

import { useMemo, useState } from "react";
import { Loader2, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { useCrop } from "@/hooks/useCrop";
import { fieldCenter } from "@/lib/ftw";
import { CROP_STAGES, DEFAULT_CROPS, SEASONS } from "@/constants/farm";
import type { ClickedField } from "@/types/fields";
import CropMultiSelect from "./CropMultiSelect";

export interface FieldInfo {
  name: string;
  crops: string[];
  season: string;
  cropStage: string;
}

interface SaveFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: ClickedField | null;
  isSaving?: boolean;
  onSave: (info: FieldInfo) => void;
}

/**
 * Holds all the form state. Rendered inside DialogContent, which Radix
 * unmounts when the dialog closes, so the form resets on every open.
 */
function SaveFieldForm({
  field,
  isSaving,
  onSave,
  onOpenChange,
}: {
  field: ClickedField;
  isSaving?: boolean;
  onSave: (info: FieldInfo) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLanguage();
  const f = t.fields;

  const center = useMemo(() => fieldCenter(field.geometry), [field]);
  const { crops, isLoading } = useCrop(
    center ? { lat: center.lat, lng: center.lng } : undefined,
  );

  // Location-aware crop list with a static fallback catalogue
  const options = useMemo(() => {
    const regional = crops.filter((c) => c.id !== "general");
    return regional.length ? regional : DEFAULT_CROPS;
  }, [crops]);

  const cropsLoading = isLoading && center != null;

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string[]>([]);
  const [cropsError, setCropsError] = useState<string | null>(null);

  // Season and crop stage are no longer collected in the form; keep the
  // existing defaults so the persisted payload stays backwards-compatible.
  const season = SEASONS[0];
  const cropStage = CROP_STAGES[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = name.trim() ? null : f.nameRequired;
    const cropsErr = selectedCrop.length > 0 ? null : f.cropsRequired;
    setNameError(nameErr);
    setCropsError(cropsErr);
    if (nameErr || cropsErr) return;
    onSave({ name: name.trim(), crops: selectedCrop, season, cropStage });
  };

  return (
    <>
      <div className="flex flex-col gap-1.5 border-b border-border px-6 pb-4 pt-5">
        <DialogHeader className="gap-1.5 p-0">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-base font-bold">
            <MapPinned className="size-4 shrink-0 text-primary" />
            {f.dialogTitle}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{f.dialogSubtitle}</p>
        </DialogHeader>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5">
        {/* Field Name */}
        <div className="space-y-1.5">
          <Label htmlFor="fieldName" className="text-sm font-medium">
            {f.fieldNameLabel}
          </Label>
          <Input
            id="fieldName"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder={f.fieldNamePlaceholder}
            aria-invalid={!!nameError}
            aria-describedby={nameError ? "fieldName-error" : undefined}
            className="bg-background text-sm"
          />
          {nameError && (
            <p
              id="fieldName-error"
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {nameError}
            </p>
          )}
        </div>

        {/* Crop Currently Grown */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{f.cropsLabel}</Label>
          {cropsLoading ? (
            <div className="space-y-2" aria-live="polite">
              <Skeleton className="h-9 w-full rounded-full" />
              <p className="text-xs text-muted-foreground">{f.cropsLoading}</p>
            </div>
          ) : (
            <>
              <CropMultiSelect
                options={options}
                value={selectedCrop}
                onChange={(v) => {
                  setSelectedCrop(v);
                  if (cropsError) setCropsError(null);
                }}
                placeholder={f.cropsPlaceholder}
                disabled={options.length === 0}
              />
              {cropsError && (
                <p
                  id="crops-error"
                  role="alert"
                  className="text-xs font-medium text-destructive"
                >
                  {cropsError}
                </p>
              )}
            </>
          )}
        </div>

        <DialogFooter className="-mx-6 -mb-5 flex flex-col-reverse gap-2 border-t border-border bg-muted/30 px-6 pb-5 pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border"
          >
            {f.cancelBtn}
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            {f.saveFieldBtn}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export default function SaveFieldDialog({
  open,
  onOpenChange,
  field,
  isSaving,
  onSave,
}: SaveFieldDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-4xl p-0 sm:max-w-md">
        {field && (
          <SaveFieldForm
            field={field}
            isSaving={isSaving}
            onSave={onSave}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
