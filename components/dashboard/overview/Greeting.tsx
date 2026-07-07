"use client";

import { usePro } from "@/hooks/usePro";
import { Sparkles } from "lucide-react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
}

export default function Greeting() {
  const { isPro, loading, firstName, lastName } = usePro();

  // Never render for free (unauthenticated) users
  if (loading || !isPro) return null;

  const greeting = getGreeting();
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || "there";

  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          {greeting},{" "}
          <span className="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent">
            {displayName}
          </span>
        </h2>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="size-3 text-amber-500" />
          Personalised Dashboard
        </p>
      </div>
    </div>
  );
}
