"use client";

import React from "react";
import { ListChecks } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export default function WhatToDoToday() {
  const { t } = useLanguage();
  return (
    <div className="w-full bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
      {/* HEADER */}
      <div className="flex items-center gap-2 border-b border-border mb-3 pb-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <ListChecks className="size-4" />
        </div>
        <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground">
          {t.dashboard.whatToDoToday}
        </h3>
      </div>

      {/* COMING SOON STATE */}
      <div className="flex items-center gap-3 py-2">
        <div className="text-base">🌱</div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{t.dashboard.comingSoon}</p>
          <p className="text-xs text-muted-foreground">
            {t.dashboard.personalisedDailyRecs}
          </p>
        </div>
      </div>
    </div>
  );
}