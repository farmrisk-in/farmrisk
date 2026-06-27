"use client";
import React from "react";
import Link from "next/link";
import { LayoutDashboard, Leaf, Menu, Pickaxe, X } from "lucide-react";
import { AuthButtons } from "@/components/home/AuthButtons";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { cn } from "@/lib/utils";
import { ModeToggle } from "../ThemeChange";
import { Button } from "../ui/button";
import { useLanguage } from "@/hooks/use-language";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserBaseCounter } from "@/components/home/UserCount";
import Image from "next/image";

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
      <HeroHeader />
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
                    icon={<Pickaxe />}
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
              <div className="relative z-0 lg:col-span-7 overflow-visible">
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
                  <div className="rounded-2xl rounded-b-none lg:rounded-b-2xl border bg-background p-2 shadow-2xl ring-1">
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
                </AnimatedGroup>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

const HeroHeader = () => {
  const { t } = useLanguage();
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { name: t.nav.problem, href: "#problem" },
    { name: t.nav.solution, href: "#solution" },
    { name: t.nav.features, href: "#feature" },
  ];

  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className="fixed z-20 w-full px-2 group"
      >
        <div
          className={cn(
            "bg-background/40 mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:pl-12 lg:pr-6 backdrop-blur-sm rounded-2xl border",
            isScrolled &&
              "bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:pl-5",
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:flex-1 lg:justify-start items-center">
              <Link
                href="/"
                aria-label="home"
                className={
                  "gap-2 flex items-center transition-colors duration-300 text-black dark:text-white"
                }
              >
                <Leaf className="size-6 shrink-0 text-emerald-700 dark:text-emerald-500" />
                <span
                  className={
                    "text-2xl font-bold logoFace transition-all duration-300 ease-in-out whitespace-nowrap inline-block overflow-hidden"
                  }
                >
                  {t.title}
                </span>
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 block cursor-pointer p-2.5 lg:hidden transition-colors duration-300 text-black dark:text-white"
              >
                <Menu className="in-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            <div className="hidden lg:flex lg:flex-none lg:justify-center px-4">
              <ul className="flex gap-6 xl:gap-8 text-sm">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className="block duration-150 transition-colors font-medium text-black dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 text-nowrap"
                    >
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:flex-1 lg:justify-end lg:gap-4 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="text-black dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 block duration-150 font-medium"
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full justify-center flex-row items-center gap-3 md:w-fit">
                <LanguageSwitcher />
                <ModeToggle />
                <AuthButtons
                  isScrolled={isScrolled}
                  text="Dashboard"
                  icon={<LayoutDashboard />}
                  className="h-10"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
