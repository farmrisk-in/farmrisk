"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

interface AuthButtonsProps {
  className?: string;
  isScrolled?: boolean;
  text: string;
  icon?: React.ReactNode;
}

export function AuthButtons({
  className,
  isScrolled,
  text,
  icon,
}: AuthButtonsProps) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return <div className="bg-foreground/50 rounded-lg h-9 w-24" />;
  }

  return (
    <div
      className={cn(
        "bg-foreground/10 border p-0.5 rounded-full items-center justify-center",
        className,
      )}
    >
      <Button
        asChild
        size={isScrolled ? "sm" : "lg"}
        className="rounded-full text-nowrap w-full h-full"
      >
        <Link href={user ? "/dashboard" : "/auth/choice"}>
          <span className="flex gap-1.5 items-center text-nowrap">
            {user ? t.nav.goDashboard : text}
            {icon}
          </span>
        </Link>
      </Button>
    </div>
  );
}
