"use client";

import { usePro } from "@/hooks/usePro";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

function getGreeting(t: { dashboard: { goodMorning: string; goodAfternoon: string; goodEvening: string; goodNight: string } }): string {
  const hour = new Date().getHours();
  if (hour < 5) return t.dashboard.goodNight;
  if (hour < 12) return t.dashboard.goodMorning;
  if (hour < 17) return t.dashboard.goodAfternoon;
  if (hour < 21) return t.dashboard.goodEvening;
  return t.dashboard.goodNight;
}

export default function Greeting() {
  const { isPro, loading, firstName, lastName } = usePro();
  const { t } = useLanguage();

  const greeting = getGreeting(t);
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || "there";

  return (
    <div className="flex items-center justify-between gap-3 px-1 min-h-[44px]">
      <div className="flex flex-col gap-0.5">
        {!loading && isPro && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {greeting},{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent">
                {displayName}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3 text-amber-500" />
              {t.dashboard.personalisedDashboard}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}