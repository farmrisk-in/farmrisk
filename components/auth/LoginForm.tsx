"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, KeyRound, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { normalizePhoneNumber } from "@/lib/auth/phone";
import { createClient } from "@/supabase/client";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { toast } from "sonner";

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
  const { t, language } = useLanguage();

  // Form fields
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Forgot Password Modal States
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [resetPhone, setResetPhone] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

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
    } catch (err: any) {
      setError(err?.message || t.auth.errorUnexpected);
      setIsLoading(false);
    }
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedPhone = normalizePhoneNumber(resetPhone);
    if (!normalizedPhone) {
      toast.error(
        language === "hi"
          ? "कृपया 10 अंकों का वैध फोन नंबर दर्ज करें"
          : "Please enter a valid 10-digit Indian phone number",
      );
      return;
    }

    if (!resetPassword || resetPassword.length < 6) {
      toast.error(
        language === "hi"
          ? "नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए"
          : "New password must be at least 6 characters long",
      );
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalizedPhone,
          newPassword: resetPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      toast.success(
        language === "hi"
          ? "पासवर्ड रीसेट लिंक भेजा गया!"
          : "Password reset instructions sent for this account!",
      );
      setIsForgotOpen(false);
      setResetPhone("");
      setResetPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to reset password");
    } finally {
      setIsResetting(false);
    }
  };

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
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium text-muted-foreground"
            >
              {t.auth.passwordLabel}
            </label>

            {mode === "login" && (
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
              >
                {language === "hi" ? "पासवर्ड भूल गए?" : "Forgot Password?"}
              </button>
            )}
          </div>
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

      {/* FORGOT PASSWORD DIALOG MODAL */}
      <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
        <DialogContent className="sm:max-w-md border border-border p-4 rounded-md gap-3">
          <DialogHeader className="pb-2 border-b border-border">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <KeyRound className="size-4 text-emerald-500" />
              {language === "hi" ? "पासवर्ड रीसेट करें" : "Reset Password"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleResetSubmit} className="space-y-3 py-1">
            <div className="space-y-1">
              <label htmlFor="resetPhone" className="text-xs font-semibold text-foreground">
                {language === "hi" ? "फ़ोन नंबर" : "Registered Phone Number"}
              </label>
              <Input
                id="resetPhone"
                type="tel"
                required
                value={resetPhone}
                onChange={(e) => setResetPhone(e.target.value)}
                placeholder="9876543210"
                className="bg-background h-8.5 text-xs rounded-md"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="resetPassword" className="text-xs font-semibold text-foreground">
                {language === "hi" ? "नया पासवर्ड" : "New Password"}
              </label>
              <Input
                id="resetPassword"
                type="password"
                required
                minLength={6}
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background h-8.5 text-xs rounded-md"
              />
            </div>

            <DialogFooter className="border-t border-border pt-3 flex justify-between gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsForgotOpen(false)}
                className="text-xs h-8 rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isResetting}
                className="text-xs h-8 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
              >
                {isResetting ? (
                  <>
                    <LoaderCircle className="size-3.5 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <span>Reset Password</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
