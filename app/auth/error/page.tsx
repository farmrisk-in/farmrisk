"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

function ErrorContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="rounded-2xl border bg-white p-8 text-center shadow-xl shadow-emerald-950/5">
      <h1 className="text-2xl font-semibold text-slate-950">
        {t.auth.errorTitle}
      </h1>
      <p className="mt-3 text-sm text-slate-600">
        {error || t.auth.errorUnexpected}
      </p>
      <Button asChild className="mt-6">
        <Link href="/auth/login">{t.auth.errorRetry}</Link>
      </Button>
    </div>
  );
}

export default function Page() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <ErrorContent />
      </Suspense>
    </AuthShell>
  );
}
