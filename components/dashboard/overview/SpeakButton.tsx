"use client";

import { Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useSpeech } from "@/hooks/useSpeech";

interface SpeakButtonProps {
  text: string;
  className?: string;
}

export default function SpeakButton({ text, className }: SpeakButtonProps) {
  const { t, language } = useLanguage();
  const { supported, speaking, toggle } = useSpeech(text, language);

  if (!text.trim() || !supported) return null;

  const label = speaking ? t.dashboard.stopListening : t.dashboard.listen;
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={label}
      aria-pressed={speaking}
      title={label}
      className={`size-8 rounded-full shrink-0 text-muted-foreground hover:text-emerald-500 ${className ?? ""}`}
    >
      {speaking ? (
        <Square className="size-3.5 fill-current" />
      ) : (
        <Volume2 className="size-4" />
      )}
    </Button>
  );
}
