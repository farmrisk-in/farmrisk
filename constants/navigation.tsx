import { LayoutDashboard, UserRound } from "lucide-react";
import Overview from "@/components/dashboard/overview/Overview";
import Profile from "@/components/dashboard/profile/Profile";
import { ReactNode, ComponentType } from "react";

export interface NavigationItem {
  name: string;
  labelKey: "overview" | "profile";
  icon: ComponentType<any>;
  component: ReactNode;
  isLocked: boolean;
}

export const navigationItems: NavigationItem[] = [
  {
    name: "Dashboard",
    labelKey: "overview",
    icon: LayoutDashboard,
    component: <Overview />,
    isLocked: false,
  },
  {
    name: "Profile",
    labelKey: "profile",
    icon: UserRound,
    component: <Profile />,
    isLocked: true,
  },
];
