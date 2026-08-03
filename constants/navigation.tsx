import {
  LayoutDashboard,
  UserRound,
  LandPlot,
  type LucideIcon,
} from "lucide-react";
import Overview from "@/components/dashboard/overview/Overview";
import Profile from "@/components/dashboard/profile/Profile";
import Fields from "@/components/dashboard/fields/Fields";
import MyFields from "@/components/dashboard/fields/MyFields";
import { ReactNode } from "react";

export interface NavigationItem {
  name: string;
  labelKey: "overview" | "profile" | "fields" | "myFields" | "selectFields";
  icon: LucideIcon;
  component: ReactNode;
  isLocked: boolean;
  /** Whether this page appears in the sidebar. */
  inSidebar: boolean;
}

export const navigationItems: NavigationItem[] = [
  {
    name: "Dashboard",
    labelKey: "overview",
    icon: LayoutDashboard,
    component: <Overview />,
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
