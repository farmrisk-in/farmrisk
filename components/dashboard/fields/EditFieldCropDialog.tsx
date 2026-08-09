"use client";

import { useMemo, useState } from "react";
import { Loader2, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { DEFAULT_CROPS } from "@/constants/farm";
import type { SavedField } from "@/types/fields";
import CropMultiSelect from "./CropMultiSelect";

interface EditFieldCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: SavedField | null;
  isSaving?: boolean;
  onSave: (cropId: string) => void;
}

/**
 * Lets the user change ONLY the crop currently grown on a saved field.
 * Rendered inside DialogContent, which Radix unmounts when the dialog
 * closes, so the form resets on every open.
 */
function EditCropForm({
  field,
  isSaving,
  onSave,
  onOpenChange,
}: {
  field: SavedField;
  isSaving?: boolean;
  onSave: (cropId: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLanguage();
  const f = t.fields;

  const center = useMemo(
    () =>
      field.centerLat != null && field.centerLng != null
        ? { lat: field.centerLat, lng: field.centerLng }
        : undefined,
    [field],
  );
  const { crops, isLoading } = useCrop(center);

  // Location-aware crop list with a static fallback catalogue
  const options = useMemo(() => {
    const regional = crops.filter((c) => c.id !== "general");
    return regional.length ? regional : DEFAULT_CROPS;
  }, [crops]);

  const cropsLoading = isLoading && center != null;

  const currentCrop = field.crops?.[0];
  const [selected, setSelected] = useState<string[]>(
    currentCrop ? [currentCrop] : [],
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cropId = selected[0] ?? "";
    if (!cropId) {
      setError(f.cropsRequired);
      return;
    }
    onSave(cropId);
  };

  return (
    <>
      <div className="flex flex-col gap-1.5 border-b border-border px-6 pb-4 pt-5">
        <DialogHeader className="gap-1.5 p-0">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-base font-bold">
            <MapPinned className="size-4 shrink-0 text-primary" />
            {f.editCropTitle}
          </DialogTitle>
        </DialogHeader>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">
            {field.name || f.fieldFallbackName}
          </p>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">{f.cropsLabel}</Label>
            {cropsLoading ? (
              <div className="space-y-2" aria-live="polite">
                <Skeleton className="h-9 w-full rounded-full" />
                <p className="text-xs text-muted-foreground">
                  {f.cropsLoading}
                </p>
              </div>
            ) : (
              <>
                <CropMultiSelect
                  options={options}
                  value={selected}
                  onChange={(v) => {
                    setSelected(v);
                    if (error) setError(null);
                  }}
                  placeholder={f.cropsPlaceholder}
                  disabled={options.length === 0}
                />
                {error && (
                  <p
                    role="alert"
                    className="text-xs font-medium text-destructive"
                  >
                    {error}
                  </p>
                )}
              </>
            )}
          </div>
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

export default function EditFieldCropDialog({
  open,
  onOpenChange,
  field,
  isSaving,
  onSave,
}: EditFieldCropDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-4xl p-0 sm:max-w-md">
        {field && (
          <EditCropForm
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