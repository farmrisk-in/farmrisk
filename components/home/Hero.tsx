"use client";
import Link from "next/link";
import { ExternalLink, Menu } from "lucide-react";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { Button } from "../ui/button";
import { useLanguage } from "@/hooks/use-language";
import { UserBaseCounter } from "@/components/ui/UserCount";
import Image from "next/image";
import { NavBar } from "@/components/home/Navbar";
import { Highlight } from "@/components/ui/hero-highlight";

const transitionVariants = {
  container: {
    visible: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  },
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 16,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.1,
        duration: 0.9,
      },
    },
  },
};

interface HeroProps {
  userCount?: string;
  suffix?: string;
}

export function Hero({ userCount, suffix }: HeroProps) {
  const { t } = useLanguage();
  const parts = t.heroHeading.split(/\{([^}]*)\}/);
  return (
    <>
      <NavBar type="large" />
      <main className="overflow-hidden">
        <section
          id="hero"
          className="relative min-h-125 lg:min-h-screen dark:bg-[url('/sat2.webp')] bg-[url('/sat1.webp')] bg-cover bg-center flex items-center overflow-hidden"
        >
          {/* Radial gradient background */}
          <div
            aria-hidden
            className="absolute z-1 inset-0 size-full [background:linear-gradient(to_bottom,transparent_0%,transparent_70%,var(--background)_100%)]"
          />
          <div className="mx-[10%] max-w-350 pt-28 pb-0 md:pt-36 lg:pt-24 w-full relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Side: Text and CTAs */}
              <div className="lg:col-span-6 md:min-w-xl flex flex-col items-start text-left w-full backdrop-brightness-95 rounded-2xl z-100">
                <AnimatedGroup
                  variants={transitionVariants}
                  className="w-full flex flex-col items-start"
                >
                  <h1 className="text-white font-bold text-4xl md:text-5xl xl:text-[4.9rem] text-balance tracking-tight text-left leading-tight">
                    {parts[0]}
                    <Highlight text={parts[1]} />
                    {parts[2]}
                  </h1>
                  <p className="text-left text-white mt-6 text-base md:text-lg opacity-90 max-w-lg leading-relaxed">
                    <span className="relative group/src1 cursor-pointer underline decoration-dotted decoration-white/40 hover:decoration-white transition-all">
                      <a
                        href="https://www.downtoearth.org.in/climate-change/year-of-extremes-india-hit-by-disasters-on-331-of-334-days-in-2025-up-from-295-in-2024-and-292-in-2022"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t.heroSubheadingPart1}
                      </a>
                      <span className="flex items-center gap-2 absolute -top-8 left-1/2 -translate-x-1/2 bg-black/85 text-white text-sm px-2 py-1 rounded shadow-md pointer-events-none opacity-0 group-hover/src1:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                        Go to source (Down To Earth, Dec 2025)
                        <ExternalLink className="w-4 h-4" />
                      </span>
                    </span>
                    {t.heroSubheadingPart2}
                    <span className="relative group/src2 cursor-pointer underline decoration-dotted decoration-white/40 hover:decoration-white transition-all">
                      <a
                        href="https://www.sciencedirect.com/science/article/pii/S0308521X23001567"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t.heroSubheadingPart3}
                      </a>
                      <span className="flex items-center gap-2 absolute -top-8 left-1/2 -translate-x-1/2 bg-black/85 text-white text-sm px-2 py-1 rounded shadow-md pointer-events-none opacity-0 group-hover/src2:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                        Go to source (ScienceDirect)
                        <ExternalLink className="w-4 h-4" />
                      </span>
                    </span>
                  </p>
                  <div className="mt-8 w-full flex justify-start">
                    <UserBaseCounter totalUsers={userCount} append={suffix} />
                  </div>
                </AnimatedGroup>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.08,
                          delayChildren: 0.45,
                        },
                      },
                    },
                    item: transitionVariants.item,
                  }}
                  className="mt-8 flex flex-row items-stretch sm:items-center justify-start gap-4 w-full sm:w-auto"
                >
                  <AuthButtons
                    className="w-40 h-13"
                    text={t.nav.getStarted}
                    icon={<Menu />}
                  />
                  <Button
                    variant="secondary"
                    size="lg"
                    className="bg-background w-35 h-12"
                  >
                    <Link
                      href="#problem"
                      className="w-full flex items-center justify-center"
                    >
                      {t.nav.learnMore}
                    </Link>
                  </Button>
                </AnimatedGroup>
              </div>

              {/* Right Side: Dashboard Image */}
              <div className="relative z-10 lg:col-span-6 overflow-visible transform scale-120 lg:scale-130 lg:translate-x-20">
                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.2,
                        },
                      },
                    },
                    item: transitionVariants.item,
                  }}
                  className="w-full lg:w-[155%] xl:w-[140%]"
                >
                  <Link className="cursor-pointer" href="/auth/choice">
                    <div className="rounded-2xl rounded-b-none lg:rounded-b-2xl border-border bg-background p-2 shadow-2xl ring-1">
                      <Image
                        src="/dashlight.webp"
                        alt="Dashboard"
                        width={2200}
                        height={1200}
                        priority
                        className="block dark:hidden w-full h-auto rounded-xl"
                      />

                      <Image
                        src="/dashdark.webp"
                        alt="Dashboard"
                        width={2200}
                        height={1200}
                        priority
                        className="hidden dark:block w-full h-auto rounded-xl"
                      />
                    </div>
                  </Link>
                </AnimatedGroup>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
