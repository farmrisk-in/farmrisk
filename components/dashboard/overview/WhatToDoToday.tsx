"use client";

import React from "react";
import { ListChecks } from "lucide-react";

export default function WhatToDoToday() {
  return (
    <div className="w-full bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
      {/* HEADER */}
      <div className="flex items-center gap-2 border-b border-border mb-3 pb-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <ListChecks className="size-4" />
        </div>
        <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground">
          What To Do Today
        </h3>
      </div>

      {/* COMING SOON STATE */}
      <div className="flex items-center gap-3 py-2">
        <div className="text-base">🌱</div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Coming Soon</p>
          <p className="text-xs text-muted-foreground">
            Personalized daily recommendations will be available here.
          </p>
        </div>
      </div>
    </div>
  );
}