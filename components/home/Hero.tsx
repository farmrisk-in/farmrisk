"use client";
import Link from "next/link";
import { Menu } from "lucide-react";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { Button } from "../ui/button";
import { useLanguage } from "@/hooks/use-language";
import { UserBaseCounter } from "@/components/ui/UserCount";
import Image from "next/image";
import { NavBar } from "@/components/home/Navbar";

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

export function Hero() {
  const { t } = useLanguage();

  return (
    <>
      <NavBar type="large" />
      <main className="overflow-hidden">
        <section
          id="hero"
          className="relative min-h-125 lg:min-h-screen dark:bg-[url('/sat2.png')] bg-[url('/sat1.png')] bg-cover bg-center flex items-center overflow-hidden"
        >
          {/* Radial gradient background */}
          <div
            aria-hidden
            className="absolute z-1 inset-0 size-full [background:linear-gradient(to_bottom,transparent_0%,transparent_70%,var(--background)_100%)]"
          />
          <div className="mx-[10%] max-w-7xl pt-28 pb-0 md:pt-36 lg:pt-24 w-full relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Side: Text and CTAs */}
              <div className="lg:col-span-5 flex flex-col items-start text-left w-full backdrop-brightness-95 rounded-2xl z-100">
                <AnimatedGroup
                  variants={transitionVariants}
                  className="w-full flex flex-col items-start"
                >
                  <h1 className="text-white font-bold text-5xl md:text-6xl xl:text-[5rem] tracking-tight text-left leading-tight">
                    {t.heroHeading}
                  </h1>
                  <p className="text-left text-white mt-6 text-base md:text-lg opacity-90 max-w-lg leading-relaxed">
                    {t.heroSubheading}
                  </p>
                  <div className="mt-8 w-full flex justify-start">
                    <UserBaseCounter totalUsers={10000} />
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
                    text="Get Started"
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
              <div className="relative z-10 lg:col-span-7 overflow-visible">
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
                        src="/dashlight.png"
                        alt="Dashboard"
                        width={2200}
                        height={1200}
                        priority
                        className="block dark:hidden w-full h-auto rounded-xl"
                      />

                      <Image
                        src="/dashdark.png"
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
