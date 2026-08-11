"use client";

import { Moon, Sun } from "lucide-react";
import { useModeAnimation } from "react-theme-switch-animation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface ModeToggleProps {
  isScrolled?: boolean;
  rounded?: boolean;
}

export function ModeToggle({
  isScrolled = true,
  rounded = true,
}: ModeToggleProps) {
  const { ref, toggleSwitchTheme } = useModeAnimation({
    duration: 500,
  });
  const { t } = useLanguage();

  return (
    <div className="relative inline-block text-left">
      <Button
        ref={ref}
        variant="outline"
        size={isScrolled ? "icon-sm" : "icon-lg"}
        className={cn(
          "text-black dark:text-white border-border cursor-pointer p-2",
          isScrolled ? "w-10 h-10" : "",
          rounded ? "rounded-full" : "rounded-md",
        )}
        onClick={toggleSwitchTheme}
        aria-label={t.nav.toggleTheme}
      >
        <Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      </Button>
    </div>
  );
}
