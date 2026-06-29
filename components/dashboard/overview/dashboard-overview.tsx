"use client";

import {
  Brain,
  CalendarDays,
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSun,
  Snowflake,
  Sparkles,
  Sprout,
  Sun,
  Wind,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import {
  aiOverview,
  FARM_TASKS,
} from "@/components/dashboard/overview/dashboard-data";
import { VillageLocationPicker } from "./village-location-picker";
import { useLanguage } from "@/hooks/use-language";
import { useWeather, type WeatherIcon } from "@/hooks/use-weather";
import { useLocationContext } from "@/providers/LocationProvider";
import { Skeleton } from "@/components/ui/skeleton";

const ICON_MAP: Record<WeatherIcon, LucideIcon> = {
  Sun,
  CloudSun,
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudLightning,
  Snowflake,
  Wind,
};

// Shared layout primitives

function SectionCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-lg border border-emerald-950/10 bg-background shadow-sm shadow-emerald-950/5 ${className}`}
    >
      {children}
    </section>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  action?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
          <Icon className="size-4" />
        </span>
        <h2 className="truncate text-base font-semibold text-slate-950">
          {title}
        </h2>
      </div>
      {action ? (
        <span className="text-xs font-semibold text-emerald-700">{action}</span>
      ) : null}
    </div>
  );
}

function WeatherErrorBanner({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <AlertTriangle className="size-4 shrink-0 text-amber-600" />
      <span>
        Weather data unavailable.{" "}
        {message ? `(${message})` : "Please check your connection."}
      </span>
    </div>
  );
}

function HourlyWeatherBlock() {
  const { language, t } = useLanguage();
  const { isLoading, isError, errorMessage, hourly } = useWeather();

  return (
    <SectionCard className="lg:col-span-8 transition-all duration-300 hover:shadow-md hover:border-emerald-950/20">
      <SectionHeader
        icon={CloudSun}
        title={t.dashboard.hourlyWeather}
        action={t.dashboard.today}
      />
      <div className="overflow-x-auto p-5">
        {isError ? (
          <WeatherErrorBanner message={errorMessage} />
        ) : isLoading || !hourly ? (
          <div className="grid min-w-180 grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="size-5 rounded-full" />
                </div>
                <Skeleton className="h-7 w-14 mt-4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex justify-between mt-4">
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid min-w-180d-cols-6 gap-3">
            {hourly.map((hour) => {
              const conditionStr =
                hour.condition[language as keyof typeof hour.condition] ||
                hour.condition.en;

              return (
                <div
                  key={hour.time}
                  className="group relative rounded-lg border border-slate-100 bg-slate-50/50 p-4 transition-all duration-300 hover:bg-white hover:border-emerald-500/20 hover:shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      {hour.time}
                    </span>
                    {/* <WeatherLucideIcon
                      name={hour.icon}
                      className="size-5 text-amber-500 transition-transform group-hover:scale-110"
                    /> */}
                  </div>
                  <p className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
                    {hour.temp}°C
                  </p>
                  <p className="mt-1 min-h-9 text-xs font-medium leading-5 text-slate-600">
                    {conditionStr}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="inline-block size-1.5 rounded-full bg-blue-400" />
                      {hour.rainChance}%
                    </span>
                    <span>{hour.windKph} km/h</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// AI overview (hardcoded)

function AiOverviewBlock() {
  const { language, t } = useLanguage();

  const riskLevelStr =
    aiOverview.riskLevel[language as keyof typeof aiOverview.riskLevel] ||
    aiOverview.riskLevel.en;
  const summaryStr =
    aiOverview.summary[language as keyof typeof aiOverview.summary] ||
    aiOverview.summary.en;
  const recommendationsList =
    aiOverview.recommendations[
      language as keyof typeof aiOverview.recommendations
    ] || aiOverview.recommendations.en;

  return (
    <SectionCard className="lg:col-span-4 transition-all duration-300 hover:shadow-md hover:border-emerald-950/20">
      <SectionHeader
        icon={Brain}
        title={t.dashboard.aiOverview}
        action={t.dashboard.intelligence}
      />
      <div className="space-y-5 p-5">
        <div className="relative overflow-hidden rounded-xl border border-emerald-100 bg-linear-to-br from-emerald-50/90 to-teal-50/40 p-5 shadow-xs">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 size-24 rounded-full bg-emerald-500/5 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                {t.dashboard.riskAssessment}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-950">
                {riskLevelStr}
              </p>
            </div>
            <div className="relative flex size-16 items-center justify-center rounded-full border-[5px] border-emerald-200/80 bg-white text-lg font-bold text-emerald-800 shadow-sm shadow-emerald-950/5">
              {aiOverview.score}
            </div>
          </div>
        </div>

        <p className="text-xs leading-5 text-slate-600 font-medium">
          {summaryStr}
        </p>

        <div className="space-y-3 pt-2">
          {recommendationsList.map((item) => (
            <div
              key={item}
              className="flex gap-3 text-xs text-slate-700 leading-relaxed"
            >
              <Sparkles className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

// 16-day forecast

function ForecastBlock() {
  const { language, t } = useLanguage();
  const { isLoading, isError, errorMessage, forecast } = useWeather();

  return (
    <SectionCard className="lg:col-span-8 transition-all duration-300 hover:shadow-md hover:border-emerald-950/20">
      <SectionHeader
        icon={CalendarDays}
        title={t.dashboard.forecast16Day}
        action={t.dashboard.planningWindow}
      />
      <div className="max-h-115 overflow-y-auto p-5">
        {isError ? (
          <WeatherErrorBanner message={errorMessage} />
        ) : isLoading || !forecast ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-100 bg-white p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="size-5 rounded-full" />
                </div>
                <Skeleton className="h-7 w-20 mt-4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-1.5 w-full rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {forecast.map((day) => {
              const dayStr =
                day.day[language as keyof typeof day.day] || day.day.en;
              const conditionStr =
                day.condition[language as keyof typeof day.condition] ||
                day.condition.en;

              return (
                <div
                  key={`${day.day.en}-${day.date}`}
                  className="group rounded-lg border border-slate-100 bg-white p-4 shadow-xs transition-all duration-300 hover:border-emerald-500/10 hover:shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {dayStr}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400">
                        {day.date}
                      </p>
                    </div>
                    {/* <WeatherLucideIcon
                      name={day.icon}
                      className="size-5 text-amber-500 transition-transform group-hover:scale-110"
                    /> */}
                  </div>
                  <div className="mt-4 flex items-end gap-1.5">
                    <span className="text-2xl font-bold tracking-tight text-slate-950">
                      {day.high}°C
                    </span>
                    <span className="pb-0.5 text-xs font-semibold text-slate-400">
                      / {day.low}°C
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-600 leading-normal">
                    {conditionStr}
                  </p>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-sky-400 to-blue-500"
                      style={{ width: `${day.rainChance}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] font-semibold text-slate-400">
                    {day.rainChance}% {t.dashboard.rainChance}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// Farm tasks (hardcoded)

function FarmTasksBlock() {
  const { language, t } = useLanguage();

  return (
    <SectionCard className="lg:col-span-4 transition-all duration-300 hover:shadow-md hover:border-emerald-950/20">
      <SectionHeader
        icon={Sprout}
        title={t.dashboard.farmTasks}
        action={t.dashboard.comingNext}
      />
      <div className="space-y-4 p-5">
        {FARM_TASKS.map((task) => {
          const Icon = task.icon;
          const labelStr =
            task.label[language as keyof typeof task.label] || task.label.en;
          const descStr =
            task.desc[language as keyof typeof task.desc] || task.desc.en;
          const statusStr =
            task.status[language as keyof typeof task.status] || task.status.en;

          return (
            <div
              key={task.label.en}
              className="flex items-start gap-4 rounded-lg border border-slate-100 bg-white p-4 shadow-xs transition-all hover:bg-slate-50/50"
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${task.color}`}
              >
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {labelStr}
                  </p>
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    {statusStr}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 truncate">
                  {descStr}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// Dashboard header with live location name

const dateTranslations: Record<string, string> = {
  en: "Tuesday, 23 June 2026",
  hi: "मंगलवार, 23 जून 2026",
  mr: "मंगळवार, 23 जून 2026",
  ta: "செவ்வாய்கிழமை, 23 ஜூன் 2026",
  gu: "મંગળવાર, 23 જૂન 2026",
};

// Root export

export function DashboardOverview() {
  const { language, t } = useLanguage();
  const { location } = useLocationContext();
  const dateStr = dateTranslations[language] || dateTranslations.en;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col justify-between gap-4 rounded-lg border border-emerald-950/10 bg-white p-5 shadow-sm shadow-emerald-950/5 md:flex-row md:items-center transition-all duration-300 hover:shadow-md">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            FarmRisk {t.dashboard.livePreview}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {t.dashboard.title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">
            {t.dashboard.subtitle}
          </p>
        </div>
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-right">
          <p className="text-sm font-bold text-emerald-950">{dateStr}</p>
          <p className="text-xs text-emerald-700 mt-0.5 truncate max-w-50">
            📍 {location.name}
          </p>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-12 w-full min-w-0">
        <VillageLocationPicker />
        <HourlyWeatherBlock />
        <AiOverviewBlock />
        <ForecastBlock />
        <FarmTasksBlock />
      </div>
    </div>
  );
}
