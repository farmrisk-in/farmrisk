"use client";
import React, { useEffect, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Leaf } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface FooterLink {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
  label: string;
  links: FooterLink[];
}

export function Footer() {
  const { t } = useLanguage();

  const footerLinks: FooterSection[] = [
    {
      label: t.footer.product,
      links: [
        { title: t.footer.features, href: "#" },
        { title: t.footer.pricing, href: "#" },
        { title: t.footer.testimonials, href: "#" },
        { title: t.footer.integration, href: "#" },
      ],
    },
    {
      label: t.footer.company,
      links: [
        { title: t.footer.faqs, href: "#" },
        { title: t.footer.aboutUs, href: "#" },
        { title: t.footer.privacyPolicy, href: "#" },
        { title: t.footer.terms, href: "#" },
      ],
    },
    {
      label: t.footer.resources,
      links: [
        { title: t.footer.blog, href: "#" },
        { title: t.footer.changelog, href: "#" },
        { title: t.footer.brand, href: "#" },
        { title: t.footer.help, href: "#" },
      ],
    },
    {
      label: t.footer.socialLinks,
      links: [],
    },
  ];

  const [mounted, setMounted] = useState(false);

  // This lifecycle tracker triggers ONLY after the client browser handles hydration safely
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // 🚀 THE MAGIC: If not mounted yet, render a plain placeholder block
  // that matches exactly what the server sends down!
  if (!mounted) {
    return <div className="w-32 h-6 bg-transparent" />; // Invisible spacer box
  }

  return (
    <footer className="relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/8%),transparent)] px-6 py-12 lg:py-16">
      <div className="bg-foreground/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

      <div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
        <AnimatedContainer className="space-y-4">
          <div className="flex items-center space-x-2">
            <Leaf className="size-6 text-emerald-600" />
            <span className="text-xl font-bold logoFace">{t.title}</span>
          </div>
          <p className="text-muted-foreground mt-8 text-sm md:mt-0">
            {t.landing.footerRights}
          </p>
        </AnimatedContainer>

        <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
          {footerLinks.map((section, index) => (
            <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
              <div className="mb-10 md:mb-0">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {section.label}
                </h3>
                <ul className="text-muted-foreground mt-4 space-y-2 text-sm">
                  {section.links.map((link) => (
                    <li key={link.title}>
                      <a
                        href={link.href}
                        className="hover:text-foreground inline-flex items-center transition-all duration-300"
                      >
                        {link.icon && <link.icon className="me-1 size-4" />}
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>
    </footer>
  );
}

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>["className"];
  children: ReactNode;
};

function AnimatedContainer({
  className,
  delay = 0.1,
  children,
}: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return children;
  }

  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
export default Footer;
