"use client";

import React from "react";
import { LoaderFive } from "@/components/ui/loader";
import { riskColor } from "@/components/ui/riskChart";
import { usePestDisease } from "@/hooks/usePestDisease";
import { useLanguage } from "@/hooks/useLanguage";
import { type PestDiseaseCardResponse } from "@/lib/api/pestDisease";
import {
  Bug,
  BookOpen,
  Droplets,
  Eye,
  Leaf,
  Sprout,
  SprayCan,
  Trash2,
  Wind,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { type CropOption } from "@/components/dashboard/overview/Overview";

interface PestAndDiseaseProps {
  selectedCrop: CropOption;
}

/** Escape regex-special characters so user terms match literally. */
function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Split `text` on the given terms and wrap every match in an emerald span.
 * Only meaningful keywords (crop name, named pests/diseases, key weather
 * conditions) are highlighted — never the whole sentence. Multi-word terms
 * (e.g. "high humidity", "root and stem rot") match as one phrase.
 */
function highlightSummary(
  text: string,
  terms: string[],
): React.ReactNode[] {
  const unique = Array.from(
    new Set(
      terms
        .map((t) => t.trim())
        .filter((t) => t.length >= 2)
        .sort((a, b) => b.length - a.length),
    ),
  );
  if (unique.length === 0) return [text];

  const pattern = new RegExp(
    `(?<![\\p{L}\\p{M}\\p{N}])(${unique.map(escapeRegex).join("|")})(?![\\p{L}\\p{M}\\p{N}])`,
    "giu",
  );
  return text.split(pattern).map((part, i) =>
    unique.some((t) => t.toLowerCase() === part.toLowerCase())
      ? React.createElement(
          "span",
          { key: i, className: HIGHLIGHT_CLASS },
          part,
        )
      : part,
  );
}

/** Emerald treatment used for every highlighted entity (FarmRisk theme). */
const HIGHLIGHT_CLASS =
  "text-emerald-600 dark:text-emerald-400 font-bold";

/**
 * Controlled category mappings for meaningful agricultural entities.
 * The summary/action text is LLM-phrased plain text, so alongside the
 * structured fields (crop name, `potential`, season, stage) we add curated
 * multi-word phrases for the pest/disease and environmental categories the
 * card is designed to surface. Terms only highlight if they literally appear.
 */

/** Environmental risk conditions derived from weather/soil/risk inputs. */
const ENV_RISK_TERMS = [
  "high humidity",
  "low humidity",
  "warm temperatures",
  "warm temperature",
  "high temperature",
  "high temperatures",
  "wet soil",
  "wet soil conditions",
  "prolonged wetness",
  "heavy rainfall",
  "heavy rain",
  "high rainfall",
  "waterlogging",
  "waterlogged",
  "soil moisture",
  "drought stress",
  "excess moisture",
  "excessive moisture",
  "prolonged rain",
  "rainy conditions",
];

/** Controlled agricultural pest/disease entity phrases. */
const PEST_DISEASE_TERMS = [
  "sucking pests",
  "sucking pest",
  "bollworms",
  "bollworm",
  "fall armyworm",
  "aphids",
  "aphid",
  "jassids",
  "jassid",
  "whiteflies",
  "whitefly",
  "thrips",
  "stem borers",
  "stem borer",
  "shoot borers",
  "shoot borer",
  "fruit borers",
  "fruit borer",
  "pod borers",
  "pod borer",
  "leaf hoppers",
  "leaf hopper",
  "leaf miner",
  "spider mites",
  "cutworms",
  "earworms",
  "root and stem rot",
  "root rot",
  "stem rot",
  "leaf spot",
  "alternaria",
  "anthracnose",
  "powdery mildew",
  "downy mildew",
  "fungal diseases",
  "fungal disease",
  "fungal pathogens",
  "fungal pathogen",
  "bacterial diseases",
  "bacterial disease",
  "viral diseases",
  "viral disease",
  "blight",
  "wilt",
  "rust",
  "smut",
  "mildew",
];

/** Crop stage / season terms. */
const STAGE_SEASON_TERMS = [
  "kharif",
  "rabi",
  "zaid",
  "flowering stage",
  "boll formation stage",
  "vegetative stage",
  "fruiting stage",
  "sowing stage",
  "seedling stage",
];

/** Common crop names (matched only when they actually appear in the text). */
const CROP_NAME_TERMS = [
  "castor",
  "cotton",
  "maize",
  "pearlmillet",
  "pearl millet",
  "wheat",
  "rice",
  "sorghum",
  "groundnut",
  "soybean",
  "sugarcane",
  "pigeonpea",
  "chickpea",
  "mungbean",
  "blackgram",
  "mustard",
];

/**
 * Build the full highlight term list for a card:
 *  - dynamic structured fields from the RAG response (crop, season, stage,
 *    named pests/diseases in `potential`)
 *  - controlled category mappings for environment / pests / diseases / stage
 */
function buildHighlightTerms(
  card: PestDiseaseCardResponse | undefined,
  isGeneral: boolean,
): string[] {
  const set = new Set<string>();

  if (!isGeneral && card?.crop_name) set.add(card.crop_name);

  for (const p of card?.potential ?? []) {
    const v = String(p ?? "").trim();
    if (v) set.add(v);
  }

  if (card?.season) set.add(card.season);

  const stage = String(card?.crop_stage ?? "").trim();
  if (stage && !/unknown|not known|n\/a/i.test(stage)) set.add(stage);

  for (const t of [
    ...CROP_NAME_TERMS,
    ...PEST_DISEASE_TERMS,
    ...ENV_RISK_TERMS,
    ...STAGE_SEASON_TERMS,
  ]) {
    set.add(t);
  }

  return Array.from(set);
}

/** Small icon per action, chosen from the (English) action title keywords. */
function actionIcon(title: string) {
  const t = title.toLowerCase();
  if (/air|flow|spacing|prun|foliage|ventilat/i.test(t)) return Wind;
  if (/inspect|scout|check|monitor|look|underside|examin|sign|watch/i.test(t)) return Eye;
  if (/drain|waterlog|water|moisture|drainage|irrigat/i.test(t)) return Droplets;
  if (/pest|insect|bug|bollworm|aphid|jassid|whitefly|suck|infest/i.test(t)) return Bug;
  if (/weed|residue|remove|clean/i.test(t)) return Trash2;
  if (/spray|chemical|pesticide|fungicid|insecticid|treat/i.test(t)) return SprayCan;
  if (/soil|fert|nutrient|top.?dress|amend/i.test(t)) return Sprout;
  return Leaf;
}

/**
 * "Pest & Disease" card for the Farm Risk page — compact design.
 *
 * Uses the FULL advisory payload (weather + forecast + soil moisture), so it
 * renders only once that complete context is ready, with the same centered
 * "Generating…" loader as the AI Overview card. Content (summary, actions) is
 * generated by the existing RAG + deterministic pipeline — the risk band is
 * decided by the backend score, never the LLM.
 */
const PestAndDisease = ({ selectedCrop }: PestAndDiseaseProps) => {
  const { language, t } = useLanguage();
  const {
    data: card,
    isLoading,
    isFetching,
    error,
  } = usePestDisease(selectedCrop.id, language);

  const title = t.dashboard.hazardPest;

  // While fetching for a different crop (crop switch) the previous crop's card
  // would otherwise linger via keepPreviousData — show the loader instead,
  // mirroring the AI Overview advisory.
  const isStaleCrop = isFetching && card?.crop_id !== selectedCrop.id;

  if (isLoading || isStaleCrop) {
    return (
      <div className="w-full bg-card border border-border text-foreground rounded-xl shadow-sm p-5 select-none flex flex-col">
        {/* Full card header */}
        <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase border-b border-border tracking-wider mb-2.5 pb-2 shrink-0">
          <Bug className="size-4.5 shrink-0 text-muted-foreground" />
          {title}
        </div>
        {/* Centered loading state, same as AI Overview */}
        <div className="flex flex-col items-center justify-center gap-4 w-full h-full min-h-32 py-6">
          <LoaderFive text={t.dashboard.generatingPestDisease} />
        </div>
      </div>
    );
  }

  const score = card?.score ?? 0;
  const color = riskColor(score);
  const band = card?.risk ?? "";
  const isGeneral = card?.is_general ?? selectedCrop.id.toLowerCase() === "general";

  // Sources backing the named pests/diseases (for RAG transparency).
  const sources = card?.potential_sources ?? [];
  const actions = card?.actions ?? [];

  // Terms to highlight in the summary: crop name, named pests/diseases from
  // the RAG response, and relevant weather conditions. Never empty/generic.
  const summaryTerms = buildHighlightTerms(card, isGeneral);

  return (
    <div className="w-full bg-card border border-border text-foreground rounded-xl shadow-sm p-5 select-none flex flex-col">
      {/* Header row — title cluster with the SOURCES control beside the title,
          risk band pinned right */}
      <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase border-b border-border tracking-wider mb-2.5 pb-2 shrink-0">
        <Bug className="size-4.5 shrink-0" style={{ color }} />
        {title}
        {!isGeneral &&
          (sources.length > 0 ? (
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-emerald-500 active:scale-95 transition-all uppercase cursor-pointer py-0.5 px-1.5 rounded hover:bg-emerald-500/10">
                  <BookOpen className="size-3" />
                  {t.dashboard.sources}
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-popover border border-border rounded-2xl shadow-xl flex flex-col p-6">
                <DialogHeader className="border-b pb-4 mb-4">
                  <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <BookOpen className="size-5 text-emerald-500" />
                    {t.dashboard.retrievedSources}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-1">
                    {t.dashboard.sourcesDescription}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent">
                  {Array.from(
                    new Set(
                      sources.map(
                        (s) => s.source || t.dashboard.icarGuideline,
                      ),
                    ),
                  ).map((sourceName, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-border bg-emerald-50/5 dark:bg-emerald-950/5 hover:border-emerald-500/20 transition-all font-mono text-xs text-foreground/85 flex items-center gap-2"
                    >
                      <span className="text-emerald-500">📄</span>
                      {sourceName}
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/40 uppercase select-none py-0.5 px-1.5">
              <BookOpen className="size-3 opacity-40" />
              {t.dashboard.noSources}
            </span>
          ))}
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-md ml-auto"
          style={{ background: `${color}20`, color }}
        >
          {band}
        </span>
      </div>

      {/* Body — content-driven height. No flex-1 filler: the card grows with
          the summary and actions, never leaving a forced empty area. */}
      <div className="flex flex-col">
        {error ? (
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            {t.dashboard.advisoryError}
          </p>
        ) : (
          <>
            {/* One summary paragraph — key terms highlighted, advisory-sized */}
            {card?.summary && (
              <p
                className="text-[13px] sm:text-sm text-foreground/90 font-medium leading-relaxed border-l-2 pl-2 pb-4"
                style={{ borderColor: color }}
              >
                {highlightSummary(card.summary, summaryTerms)}
              </p>
            )}

            {/* Action rows — natural flow, gap-driven spacing, with a subtle
                divider between actions (never after the final one). */}
            {actions.length > 0 && (
              <ul className="flex flex-col divide-y divide-border/60">
                {actions.map((a, i) => {
                  const Icon = actionIcon(a.title);
                  return (
                    <li key={i} className="flex items-start gap-2.5 py-2.5">
                      <span
                        className="mt-0.5 w-7 h-7 rounded-md shrink-0 flex items-center justify-center border"
                        style={{
                          color,
                          borderColor: `${color}35`,
                          background: `${color}10`,
                        }}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <span className="text-[13px] font-semibold text-foreground/95 leading-snug block">
                          {a.title}
                        </span>
                        {a.detail && (
                          <span className="text-xs text-muted-foreground leading-snug block">
                            {highlightSummary(a.detail, summaryTerms)}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PestAndDisease;
