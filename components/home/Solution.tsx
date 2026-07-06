/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Locate, BrainCircuit, Zap, Languages, Check } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { WheatScrollWrapper } from "../ui/wheat";

// Animation Variants
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const iconMap = {
  Locate: Locate,
  BrainCircuit: BrainCircuit,
  Zap: Zap,
  Languages: Languages,
};

export function Solution() {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [0.95, 1, 1, 0.95],
  );

  const pillars = t.solution.pillars.map((pillar: any) => ({
    ...pillar,
    icon: iconMap[pillar.icon as keyof typeof iconMap] || Locate,
  }));

  return (
    <section
      id="solution"
      ref={containerRef}
      className="relative w-full bg-linear-to-b from-background pb-32 via-muted/20 to-background px-6 overflow-hidden"
    >
      {/* 🌌 Absolute Background Container */}
      <div className="absolute inset-x-0 bottom-0 top-0 -z-10 pointer-events-none overflow-hidden">
        {/* Left Wheat: Tucked cleanly into the bottom-left corner */}
        <div className="absolute left-0 bottom-0 translate-x-[-10%] translate-y-[10%]">
          <WheatScrollWrapper scrollProgress={scrollYProgress} side="left" />
        </div>

        {/* Right Wheat: Tucked cleanly into the bottom-right corner */}
        <div className="absolute hidden sm:block right-0 bottom-0 translate-x-[10%] translate-y-[10%]">
          <WheatScrollWrapper scrollProgress={scrollYProgress} side="right" />
        </div>
      </div>

      <motion.div
        style={{ opacity, scale }}
        className="relative max-w-7xl mx-auto space-y-20"
      >
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="text-center space-y-6 max-w-3xl mx-auto"
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 rounded-full border-green-700/50 bg-background/80 px-4 py-4 text-xs font-medium uppercase tracking-wider text-green-900 dark:text-green-400 backdrop-blur-sm"
          >
            <Check className="h-3.5 w-3.5" />
            {t.solution.badge}
          </Badge>

          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance">
            {t.solution.headingPart1}
            <span className="bg-linear-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
              {t.solution.headingHighlight}
            </span>
            {t.solution.headingPart2}
          </h2>

          <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
            {t.solution.description}
          </p>
        </motion.div>

        {/* USP Pillars Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {pillars.map((pillar: any, index: number) => {
            const IconComponent = pillar.icon;

            return (
              <motion.div key={index} variants={fadeUp} className="h-full">
                <Card className="relative h-full overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all duration-500 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 group flex flex-col justify-between">
                  {/* Subtle Gradient background on hover */}
                  <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-primary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <div className="relative space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Icon & Counter Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20">
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground/60 select-none">
                          0{index + 1}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                          {pillar.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {pillar.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="pt-16 border-t border-border/50"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {t.solution.stats.map((stat: any, index: number) => (
              <div key={index} className="space-y-2">
                <div className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
