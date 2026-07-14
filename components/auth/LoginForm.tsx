"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizePhoneNumber } from "@/lib/auth/phone";
import { createClient } from "@/supabase/client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type Mode = "login" | "register";

function getSafeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const { t } = useLanguage();

  // Form fields
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const normalizedPhone = normalizePhoneNumber(phone);
    const loginId = `${normalizedPhone}@farmrisk.app`;
    if (!normalizedPhone) {
      setError(t.auth.errorPhone);
      return;
    }

    if (mode === "register") {
      if (!name.trim()) {
        setError(t.auth.errorName);
        return;
      }
      if (!surname.trim()) {
        setError(t.auth.errorSurname);
        return;
      }
      if (password.length < 6) {
        setError(t.auth.errorPasswordLength);
        return;
      }
      if (password !== confirmPassword) {
        setError(t.auth.errorPasswordMatch);
        return;
      }
    } else {
      if (!password) {
        setError(t.auth.errorPasswordRequired);
        return;
      }
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      if (mode === "register") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: loginId,
          password: password,
          options: {
            data: {
              first_name: name,
              last_name: surname,
              phone: normalizedPhone,
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          setIsLoading(false);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: loginId,
          password: password,
        });

        if (signInError) {
          setError(signInError.message);
          setIsLoading(false);
          return;
        }
      }

      router.replace(getSafeNextPath(searchParams.get("next")));
      router.refresh();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.message || t.auth.errorUnexpected);
      setIsLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-background p-6 shadow-xl sm:p-10 text-slate-900 dark:text-slate-900",
        className,
      )}
      {...props}
    >
      <div className="mb-6 flex flex-col items-center gap-3">
        <LanguageSwitcher isScrolled={false} rounded={true} />
        <h1 className="text-2xl text-foreground font-semibold text-center mt-2">
          {mode === "login" ? t.auth.signInTitle : t.auth.registerTitle}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        {mode === "register" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-foreground"
              >
                {t.auth.nameLabel}
              </label>
              <Input
                id="name"
                type="text"
                placeholder={t.auth.namePlaceholder}
                value={name}
                className="text-foreground"
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="surname"
                className="text-sm font-medium text-foreground"
              >
                {t.auth.surnameLabel}
              </label>
              <Input
                id="surname"
                type="text"
                placeholder={t.auth.surnamePlaceholder}
                value={surname}
                className="text-foreground"
                onChange={(e) => setSurname(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>
        )}

        <div className="grid gap-2">
          <label
            htmlFor="phone"
            className="text-sm font-medium text-muted-foreground"
          >
            {t.auth.phoneLabel}
          </label>
          <Input
            id="phone"
            type="tel"
            placeholder={t.auth.phonePlaceholder}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isLoading}
            className="text-foreground"
            required
            autoFocus
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-muted-foreground"
          >
            {t.auth.passwordLabel}
          </label>
          <Input
            id="password"
            type="password"
            placeholder={t.auth.passwordPlaceholder}
            value={password}
            className="text-foreground"
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        {mode === "register" && (
          <div className="grid gap-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-foreground"
            >
              {t.auth.confirmPasswordLabel}
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={t.auth.confirmPasswordPlaceholder}
              className="text-foreground"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          )}
          {isLoading
            ? mode === "login"
              ? t.auth.signingIn
              : t.auth.registering
            : mode === "login"
              ? t.auth.signInBtn
              : t.auth.registerBtn}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard")}
          disabled={isLoading}
          className="w-full border-slate-200 dark:border-slate-800 text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
        >
          {t.auth.continueAsGuest}
        </Button>

        <div className="text-center mt-2">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
            className="text-sm text-emerald-700 hover:underline cursor-pointer"
            disabled={isLoading}
          >
            {mode === "login" ? t.auth.noAccount : t.auth.haveAccount}
          </button>
        </div>
      </form>
    </div>
  );
}
