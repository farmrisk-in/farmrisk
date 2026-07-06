"use client";
import Link from "next/link";
import { CloudSun, ArrowRight, Sparkles, X, Check } from "lucide-react";
import { NavBar } from "@/components/home/Navbar";
import { useLanguage } from "@/hooks/useLanguage";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ChoiceClient() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  useEffect(() => {
    if (!loading && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsRedirecting(true); // Lock the UI in loading state
      router.replace("/dashboard");
    }
  }, [user, loading, router]);
  const freeContent = t.choice.free;
  const proContent = t.choice.personalized;

  if (loading || user || isRedirecting) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f7f9f4]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-800 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <NavBar type="small" />
      <div className="relative min-h-screen w-full flex flex-col md:flex-row overflow-hidden bg-background">
        <div className="hidden border-8 border-l-0 p-2 border-accent md:block absolute top-1/2 -translate-y-1/2 left-0 w-1/4 h-2/3 rounded-r-2xl shadow-xl overflow-hidden pointer-events-none transition-all duration-500">
          <Image
            width={440}
            height={280}
            src="/dashlight.webp"
            alt="Free Dashboard Snapshot"
            className="w-full h-full block dark:hidden object-cover object-top-right"
          />
          <Image
            width={440}
            height={280}
            src="/dashdark.webp"
            alt="Free Dashboard Snapshot"
            className="w-full h-full hidden dark:block object-cover object-top-right"
          />
        </div>

        <div className="hidden border-8 border-r-0 p-2 md:block absolute top-1/2 -translate-y-1/2 right-0 w-1/4 h-2/3 rounded-l-2xl shadow-xl overflow-hidden pointer-events-none transition-all duration-700 ease-in-out">
          <Image
            width={440}
            height={280}
            src="/dashlight.webp"
            alt="Free Dashboard Snapshot"
            className="w-full h-full block dark:hidden object-cover object-top-left"
          />
          <Image
            width={440}
            height={280}
            src="/dashdark.webp"
            alt="Free Dashboard Snapshot"
            className="w-full h-full hidden dark:block object-cover object-top-left"
          />
        </div>
        {/* LEFT SIDE: FREE TIER */}
        <div className="flex gap-5 flex-col md:flex-row justify-center items-center w-full lg:h-screen mt-10 md:mt-0">
          <div className="min-w-[90%] md:min-w-xs max-w-lg md:mr-0 mb-0 md:mb-16 mx-10 my-16 bg-sky-50/50 transition-all dark:bg-sky-950/50 backdrop-blur-md border-2 border-sky-800 relative z-10 flex-1 flex flex-col justify-between rounded-2xl p-6 md:p-8 lg:p-10">
            {/* Peeking Light Dashboard Image (Only on Desktop) */}

            {/* Card Content Wrapper */}
            <div className="md:mr-0 w-full flex-1 flex flex-col justify-between space-y-12 relative z-20">
              <div className="space-y-6">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  <CloudSun className="mr-2 h-4 w-4" /> {freeContent.badge}
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                  {freeContent.title}
                </h2>
                <p className="text-muted-foreground text-base leading-relaxed">
                  {freeContent.description}
                </p>

                <ul className="space-y-4 pt-4">
                  {freeContent.points.map((point: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-start text-sm text-foreground/80 leading-snug"
                    >
                      <Check className="mr-3 h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                  {proContent.points.map((point: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-start text-sm text-foreground/80 leading-snug"
                    >
                      <X className="mr-3 h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom Button */}
              <div className="pt-6">
                <Link
                  href="/dashboard"
                  className="group w-full flex items-center justify-center py-4 px-6 rounded-xl font-semibold border border-border bg-sky-600 text-white hover:bg-sky-700 transition-all duration-300 shadow-sm"
                >
                  {freeContent.buttonText}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: PERSONALIZED TIER */}
          <div className="min-w-[90%] md:min-w-xs max-w-lg md:ml-0 mx-10 mt-0 md:mt-16 my-16 bg-emerald-50/50 dark:bg-emerald-950/50 border-2 backdrop-blur-md transition-all border-emerald-700 z-10 flex-1 flex flex-col justify-between p-6 md:p-8 rounded-2xl lg:p-10">
            {/* Peeking Dark Dashboard Image (Only on Desktop) */}

            {/* Card Content Wrapper */}
            <div className="md:mr-0 w-full flex-1 flex flex-col justify-between space-y-12 relative z-20">
              <div className="space-y-6">
                <div className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-500">
                  <Sparkles className="mr-2 h-4 w-4" /> {proContent.badge}
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                  {proContent.title}
                </h2>
                <p className="text-muted-foreground text-base leading-relaxed">
                  {proContent.description}
                </p>

                <ul className="space-y-4 pt-4">
                  {freeContent.points
                    .concat(proContent.points)
                    .map((point: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start text-sm text-foreground/80 leading-snug"
                      >
                        <Check className="mr-3 h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Bottom Button */}
              <div className="pt-6">
                <Link
                  href={"/auth/login"}
                  className="group text-nowrap w-full flex items-center justify-center py-4 px-6 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 shadow-md shadow-emerald-950/20"
                >
                  {proContent.buttonText}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
