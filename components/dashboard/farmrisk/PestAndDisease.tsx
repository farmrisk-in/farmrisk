"use client";

import React from "react";

/**
 * "Pest & Disease" placeholder card for the Farm Risk page.
 * Displays only a title and a "Coming Soon" message, centered.
 */
const PestAndDisease = () => {
  return (
    <div className="w-full h-full min-h-55 bg-card border border-border text-foreground rounded-xl shadow-sm p-5 select-none flex items-center justify-center text-center">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold uppercase tracking-wider">
          Pest &amp; Disease
        </h3>
        <p className="text-xs text-muted-foreground">Coming Soon</p>
      </div>
    </div>
  );
};

export default PestAndDisease;