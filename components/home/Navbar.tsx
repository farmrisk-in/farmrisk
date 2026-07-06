import React from "react";
import { LayoutDashboard, Leaf, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "../ThemeChange";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/hooks/useLanguage";
import Link from "next/link";
import { AuthButtons } from "../auth/AuthButtons";

export const NavBar = ({ type }: { type: "small" | "large" }) => {
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
    { name: t.nav.features, href: "#solution" },
  ];

  const isSmall = type === "small" || isScrolled;

  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className="z-1000 fixed w-full px-2 group"
      >
        <div
          className={cn(
            "bg-background/40 mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:pl-12 lg:pr-6 backdrop-blur-sm rounded-2xl border",
            isSmall &&
              "max-w-4xl rounded-2xl backdrop-blur-lg lg:pl-5 border-2 border-black/40 dark:border-white/20",
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
                <Leaf className="size-6 shrink-0 text-emerald-900 dark:text-emerald-500" />
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

            {type === "large" && (
              <div className="hidden lg:flex lg:flex-none lg:justify-center px-4">
                <ul className="flex gap-6 xl:gap-8 text-sm">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="block duration-150 transition-colors font-medium text-black dark:text-slate-200 hover:text-emerald-900 dark:hover:text-emerald-400 text-nowrap"
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:flex-1 lg:justify-end lg:gap-4 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              {type === "large" && (
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
              )}
              <div className="flex w-full justify-center flex-row items-center gap-3 md:w-fit">
                <LanguageSwitcher isScrolled={type == "large"} />
                <ModeToggle isScrolled={type == "small"} />

                {type == "large" && (
                  <AuthButtons
                    isScrolled={isSmall}
                    text={t.nav.dashboard}
                    icon={<LayoutDashboard />}
                    className="h-10"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
