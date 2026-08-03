"use client";

import { useMemo, useState } from "react";
import { ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguage } from "@/hooks/useLanguage";
import { translateCropName } from "@/lib/cropName";
import { cn } from "@/lib/utils";
import type { Crop } from "@/types/crops";

interface CropMultiSelectProps {
  options: Crop[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function CropMultiSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: CropMultiSelectProps) {
  const { t } = useLanguage();
  const f = t.fields;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Always be able to render a label for already-selected ids, even when the
  // current options list doesn't include them (e.g. regional list changed).
  const optionById = useMemo(() => {
    const map = new Map<string, Crop>();
    options.forEach((o) => map.set(o.id, o));
    value.forEach((id) => {
      if (!map.has(id)) map.set(id, { id, name: id, area: 0 });
    });
    return map;
  }, [options, value]);

  const labelFor = (id: string) =>
    translateCropName(optionById.get(id) ?? { id, name: id }, t);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter(
      (o) =>
        o.id !== "general" &&
        (!q ||
          o.name.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)),
    );
  }, [options, query]);

  const toggle = (id: string) =>
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );

  return (
    <div className={cn("space-y-2", className)}>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <span
              key={id}
              title={labelFor(id)}
              className="inline-flex min-w-0 max-w-full animate-in items-center gap-1.5 rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1 text-xs font-medium text-white shadow-xs fade-in-0 zoom-in-95 duration-150"
            >
              <span className="min-w-0 truncate">{labelFor(id)}</span>
              <button
                type="button"
                onClick={() => toggle(id)}
                aria-label={`Remove ${labelFor(id)}`}
                className="shrink-0 cursor-pointer rounded-full p-0.5 text-white/80 transition-colors hover:text-white focus-visible:outline-none"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="h-9 w-full justify-between border-border bg-background px-3 text-sm font-normal text-foreground"
          >
            <span className="truncate text-muted-foreground">
              {placeholder ?? f.cropsPlaceholder}
            </span>
            {value.length > 0 && (
              <span className="ml-auto mr-1.5 shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {value.length}
              </span>
            )}
            <ChevronsUpDown className="size-3.5 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="z-[10000] w-(--radix-popover-trigger-width) rounded-2xl p-2 shadow-2xl ring-1 ring-foreground/5"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command shouldFilter={false} className="rounded-2xl p-0">
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder={f.cropsPlaceholder}
              className="rounded-xl"
            />
            <CommandList className="max-h-64 p-1">
              <CommandEmpty>{f.cropsNoResults}</CommandEmpty>
              <CommandGroup>
                {filtered.map((o) => {
                  const active = value.includes(o.id);
                  return (
                    <CommandItem
                      key={o.id}
                      value={o.id}
                      data-checked={active}
                      onSelect={() => toggle(o.id)}
                      className="cursor-pointer rounded-xl px-3 py-2"
                    >
                      <span className="min-w-0 truncate">{labelFor(o.id)}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
