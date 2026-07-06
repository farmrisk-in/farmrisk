"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageCode } from "@/constants/content";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  isScrolled?: boolean;
  rounded?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  isScrolled = true,
  rounded = true,
}) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const languages: { code: LanguageCode; label: string; native: string }[] = [
    { code: "en", label: "English", native: "English" },
    { code: "hi", label: "Hindi", native: "हिन्दी" },
    { code: "mr", label: "Marathi", native: "मराठी" },
    { code: "ta", label: "Tamil", native: "தமிழ்" },
    { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  ];

  const currentLangObj =
    languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative mt-1 inline-block text-left" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size={isScrolled ? "sm" : "lg"}
        className={cn(
          "cursor-pointer border-border gap-1.5 font-semibold text-xs text-black dark:text-white",
          rounded ? "rounded-full" : "rounded-md",
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe
          className={
            isScrolled
              ? "size-3.5 opacity-70 shrink-0"
              : "size-4 opacity-70 shrink-0"
          }
        />
        <span className="truncate">
          {isScrolled ? (
            <span className="uppercase">{currentLangObj.code}</span>
          ) : (
            currentLangObj.native
          )}
        </span>
        <ChevronDown
          className={`opacity-70 transition-transform duration-200 shrink-0 ${
            isScrolled ? "size-3.5" : "size-4"
          } ${isOpen ? "rotate-180" : ""}`}
        />
      </Button>

      {isOpen && (
        <div className="bg-background absolute -left-1/2 mt-1.5 z-1000 w-48 rounded-xl border p-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 border-border text-slate-800 dark:text-white">
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLanguage(l.code);
                setIsOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition cursor-pointer ${
                language === l.code
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400"
                  : "hover:bg-slate-50 dark:hover:bg-white/5 text-black/70 dark:text-slate-300 hover:text-black dark:hover:text-white"
              }`}
            >
              <span>{l.label}</span>
              <span className="text-[10px] opacity-75 font-normal">
                {l.native}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
