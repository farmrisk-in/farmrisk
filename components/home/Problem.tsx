/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { CloudRain, AlertTriangle, TrendingDown } from "lucide-react";

// Animations
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

const metricIcons = [CloudRain, AlertTriangle, TrendingDown];

// Main Component
export function Problem() {
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

  const metrics = t.problem.metrics.map((metric: any, index: number) => ({
    ...metric,
    icon: metricIcons[index] || AlertTriangle,
  }));

  return (
    <section
      ref={containerRef}
      id="problem"
      className="relative overflow-hidden bg-linear-to-b from-background via-muted/20 to-background px-6 py-32 lg:py-20"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-125 w-125 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute right-1/4 bottom-0 h-100 w-100 rounded-full bg-destructive/5 blur-[100px]" />
      </div>

      <motion.div
        style={{ opacity, scale }}
        className="mx-auto max-w-7xl space-y-20"
      >
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto max-w-3xl text-center space-y-6"
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-2 rounded-full border-border/60 bg-background/80 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground backdrop-blur-sm"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {t.problem.badge}
          </Badge>

          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-5xl text-balance lg:text-6xl">
            {t.problem.headingPart1}
            <span className="bg-linear-to-r from-destructive to-orange-500 bg-clip-text text-transparent">
              {t.problem.headingHighlight}
            </span>
            {t.problem.headingPart2}
          </h2>

          <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
            {t.problem.description}
          </p>
        </motion.div>

        {/* Problem Metrics Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-6 md:grid-cols-1 lg:grid-cols-3"
        >
          {metrics.map((metric: any, index: number) => (
            <motion.div key={index} variants={fadeUp}>
              <a
                href={metric.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full group"
              >
                <Card className="relative h-full overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all duration-500 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                  {/* Subtle Gradient background on hover */}
                  <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-destructive/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <div className="relative h-full flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      {/* Icon */}
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/20">
                        <metric.icon className="h-6 w-6" />
                      </div>

                      {/* Number value, Label and Impact */}
                      <div className="space-y-2">
                        <span className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight block">
                          {metric.value}
                        </span>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
                          {metric.label}
                        </h3>
                        <p className="text-xl font-bold text-foreground">
                          {metric.impact}
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {metric.description}
                        </p>
                      </div>
                    </div>

                    {/* "Go to source" micro-interaction */}
                    <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-primary/80 opacity-0 translate-y-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0">
                      <span>{t.problem.goToSource}</span>
                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </div>
                </Card>
              </a>
            </motion.div>
          ))}
        </motion.div>

        {/* Impact Statement */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="relative overflow-hidden rounded-3xl border border-border/50 bg-linear-to-br from-destructive/10 via-background/50 to-background/50 p-8 backdrop-blur-sm md:p-12"
        >
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,var(--border)_0,var(--border)_1px,transparent_0,transparent_50%)] bg-size-[10px_10px] opacity-5" />

          <div className="relative space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10 text-destructive">
                <TrendingDown className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  {t.problem.impactEyebrow}
                </p>
                <p className="text-2xl font-bold text-foreground md:text-3xl">
                  {t.problem.impactTitle}
                </p>
              </div>
            </div>

            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              {t.problem.impactDesc}
            </p>

            <div className="flex flex-wrap gap-3 pt-4">
              <Button
                size="lg"
                className="rounded-full shadow-lg shadow-primary/20"
              >
                {t.problem.impactBtnSolution}
              </Button>
              <Button size="lg" variant="outline" className="rounded-full">
                {t.problem.impactBtnLearnMore}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
