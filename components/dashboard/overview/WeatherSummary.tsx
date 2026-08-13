"use client";

import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useWeatherSummary } from "@/hooks/useWeatherSummary";
import { useWeather } from "@/hooks/useWeather";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2, Summary } from "lucide-react";

// Matches the hourly forecast time formatting used elsewhere in the dashboard.
const formatHour = (dateInput: Date | string) => {
  const date = new Date(dateInput);
  const h = date.getUTCHours();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")} ${ampm}`;
};

// Rain spell classification keys. The >100 mm/hour case is intentionally
// included under "Extremely Intense spell" (never shown as "Cloud Burst").
type RainSpellLabel =
  | "rainSpellLight"
  | "rainSpellModerate"
  | "rainSpellIntense"
  | "rainSpellVeryIntense"
  | "rainSpellExtremelyIntense";

type RainSpellSentence =
  | "rainSpellSentenceLight"
  | "rainSpellSentenceModerate"
  | "rainSpellSentenceIntense"
  | "rainSpellSentenceVeryIntense"
  | "rainSpellSentenceExtremelyIntense";

const SENTENCE_FOR: Record<RainSpellLabel, RainSpellSentence> = {
  rainSpellLight: "rainSpellSentenceLight",
  rainSpellModerate: "rainSpellSentenceModerate",
  rainSpellIntense: "rainSpellSentenceIntense",
  rainSpellVeryIntense: "rainSpellSentenceVeryIntense",
  rainSpellExtremelyIntense: "rainSpellSentenceExtremelyIntense",
};

// Classify an hourly rainfall intensity (mm/hour) into a Rain Spell category.
// Determination is based on the hourly precipitation amount/intensity only,
// never on precipitation probability or daily accumulated rainfall.
function getRainSpellLabel(rain: number): RainSpellLabel {
  if (rain < 10) return "rainSpellLight";
  if (rain < 20) return "rainSpellModerate";
  if (rain < 30) return "rainSpellIntense";
  if (rain < 50) return "rainSpellVeryIntense";
  return "rainSpellExtremelyIntense";
}

// Legacy rainfall-wording phrases that may leak from the AI/model summary text
// and must be replaced with the correct Rain Spell category.
const OLD_RAIN_REGEX =
  /extremely heavy rainfall|very heavy rainfall|heavy rainfall|light rainfall|moderate rainfall|intense rainfall|extremely intense rain|very intense rain|extremely heavy rain|very heavy rain|heavy showers|intense rain|moderate rain|light rain|heavy rain/gi;

export default function WeatherSummary() {
  const { language, t } = useLanguage();
  const {
    data: summary,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useWeatherSummary(language);

  const { data: weather } = useWeather();

  const title = t.dashboard.weatherSummary;

  // The Rain Spell category is derived from the highest hourly precipitation
  // intensity and its corresponding forecast time from the Open-Meteo data.
  let spellLabel: RainSpellLabel | null = null;
  let spellTime = "";
  const rain = weather?.hourly?.rain;
  const times = weather?.hourly?.time;
  if (rain && rain.length > 0 && times) {
    let maxRain = -1;
    let maxIdx = 0;
    rain.forEach((value, idx) => {
      if (value > maxRain) {
        maxRain = value;
        maxIdx = idx;
      }
    });
    spellLabel = getRainSpellLabel(maxRain);
    spellTime = formatHour(times[maxIdx]);
  }

  let displaySummary = summary || "";
  if (spellLabel && spellTime) {
    const category = t.dashboard[spellLabel];
    // Replace any legacy rainfall-intensity wording with the Rain Spell
    // category so cached summaries are never left showing the old terminology.
    const cleaned = displaySummary.replace(OLD_RAIN_REGEX, category);
    const sentence = t.dashboard[SENTENCE_FOR[spellLabel]].replace(
      "{time}",
      spellTime,
    );
    displaySummary = `${sentence} ${cleaned}`;
  }

  // When precipitation probability is exactly 100%, never present it as an
  // absolute certainty. Soften any such phrasing to "up to 100%" instead.
  const hasCertainPrecipitation =
    weather?.hourly?.precipitation_probability?.some((p) => p >= 100) ?? false;
  if (displaySummary && hasCertainPrecipitation) {
    displaySummary = displaySummary.replace(
      /(?<!up to )(?<!near )\b100\s*%/gi,
      "up to 100%",
    );
  }

  const handleRetry = () => {
    refetch().catch(() => {
      // Ignore failures here; the fallback UI stays visible and react-query
      // records the error so the card keeps showing the fallback message.
    });
  };

  // Show a skeleton loader while loading
  if (isLoading) {
    return (
      <div className="w-full bg-card border border-border rounded-xl p-3.5 shadow-sm animate-pulse">
        <div className="flex-1 space-y-2 min-w-0">
          <Skeleton className="h-4 w-1/4 rounded-sm" />
          <Skeleton className="h-4 w-3/4 rounded-sm" />
        </div>
      </div>
    );
  }

  // If the summary is missing or the API failed, show a graceful fallback
  // instead of leaving the card blank.
  if (isError || !summary) {
    return (
      <div className="w-full bg-card border border-border text-foreground rounded-xl p-4 shadow-sm select-none flex flex-col">
        {/* SECTION SUBTITLE BAR */}
        <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase border-b border-border tracking-wider mb-2 pb-2">
          <Summary className="size-4.5" />
          {title}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center min-h-36 py-3">
          <p className="text-sm font-semibold text-foreground">
            {t.dashboard.weatherSummaryLoadError}
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {t.dashboard.weatherSummaryRetryHint}
          </p>

          <Button
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={handleRetry}
            className="mt-3"
          >
            {isFetching && <Loader2 className="size-4 animate-spin" />}
            {t.dashboard.weatherSummaryRetry}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-card border border-border rounded-xl p-4 pb-2 shadow-sm select-none">
      {/* SECTION SUBTITLE BAR */}
      <div className="flex items-center gap-2 text-foreground text-xs font-bold uppercase border-b border-border tracking-wider mb-2 pb-2">
        <Summary className="size-4.5" />
        {title}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {displaySummary}
        </p>
      </div>
    </div>
  );
}
