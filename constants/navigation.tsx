import {
  LayoutDashboard,
  CloudSun,
  ShieldAlert,
  ChartLine,
  UserRound,
  LandPlot,
  Sprout,
  Store,
  type LucideIcon,
} from "lucide-react";
import Overview from "@/components/dashboard/overview/Overview";
import Profile from "@/components/dashboard/profile/Profile";
import Fields from "@/components/dashboard/fields/Fields";
import MyFields from "@/components/dashboard/fields/MyFields";
import WeatherRisks from "@/components/dashboard/weather/WeatherRisks";
import FarmRisk from "@/components/dashboard/farmrisk/FarmRisk";
import Insights from "@/components/dashboard/insights/Insights";
import PreSowing from "@/components/dashboard/tools/PreSowing";
import PostHarvest from "@/components/dashboard/tools/PostHarvest";
import { ReactNode } from "react";

export interface NavigationItem {
  name: string;
  labelKey:
    | "overview"
    | "today"
    | "weather"
    | "farmRisk"
    | "insights"
    | "profile"
    | "fields"
    | "myFields"
    | "selectFields"
    | "preSowing"
    | "postHarvest";
  icon: LucideIcon;
  component: ReactNode;
  isLocked: boolean;
  /** Whether this page appears in the sidebar. */
  inSidebar: boolean;
}

export const navigationItems: NavigationItem[] = [
  {
    name: "Today",
    labelKey: "today",
    icon: LayoutDashboard,
    component: <Overview />,
    isLocked: false,
    inSidebar: true,
  },
  {
    name: "Weather",
    labelKey: "weather",
    icon: CloudSun,
    component: <WeatherRisks />,
    isLocked: false,
    inSidebar: true,
  },
  {
    name: "FarmRisk",
    labelKey: "farmRisk",
    icon: ShieldAlert,
    component: <FarmRisk />,
    isLocked: true,
    inSidebar: true,
  },
  {
    name: "Insights",
    labelKey: "insights",
    icon: ChartLine,
    component: <Insights />,
    isLocked: false,
    inSidebar: true,
  },
  {
    name: "Pre-Sowing",
    labelKey: "preSowing",
    icon: Sprout,
    component: <PreSowing />,
    isLocked: false,
    inSidebar: true,
  },
  {
    name: "Post-Harvest",
    labelKey: "postHarvest",
    icon: Store,
    component: <PostHarvest />,
    isLocked: false,
    inSidebar: true,
  },
  {
    name: "MyFields",
    labelKey: "myFields",
    icon: LandPlot,
    component: <MyFields />,
    isLocked: false,
    inSidebar: false,
  },
  {
    name: "SelectFields",
    labelKey: "selectFields",
    icon: LandPlot,
    component: <Fields />,
    isLocked: false,
    inSidebar: false,
  },
  {
    name: "Profile",
    labelKey: "profile",
    icon: UserRound,
    component: <Profile />,
    isLocked: true,
    inSidebar: true,
  },
];
