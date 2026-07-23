"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/supabase/client";
import { Leaf, LockIcon, LoaderCircle, LogOut, LogIn } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarSeparator,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/hooks/useLanguage";
import { useNavigation } from "@/hooks/useNavigation";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import { navigationItems } from "@/constants/navigation";

export function AppSidebar() {
  const { currentPage, setCurrentPage } = useNavigation();
  const { isMobile: isSidebarMobile, state, setOpenMobile } = useSidebar();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || "";
  const firstName = profile?.first_name || user?.user_metadata?.first_name || "";
  const lastName = profile?.last_name || user?.user_metadata?.last_name || "";
  const displayName = `${firstName} ${lastName}`.trim() || user?.email?.split("@")[0] || "Farmer";

  function redirectToLogin() {
    if (!user) {
      router.replace("/auth/login");
    }
  }

  async function logout() {
    setIsLoading(true);
    
    // Clear irrigation session storage immediately
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("irrigation_days_before");
      sessionStorage.removeItem("irrigation_questions_answered");
      window.dispatchEvent(new CustomEvent("farmrisk-irrigation-updated", { detail: undefined }));
    }

    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    if (process.env.NODE_ENV === "development") {
      await fetch("/auth/dev-logout", { method: "POST" });
    }
    router.replace("/auth/login");
    router.refresh();
  }

  const loggingOutText =
    language === "hi"
      ? "लॉग आउट हो रहा है..."
      : language === "mr"
        ? "लॉग आउट होत आहे..."
        : language === "ta"
          ? "வெளியேறுகிறது..."
          : language === "gu"
            ? "લૉગ આઉટ થઈ રહ્યું છે..."
            : "Logging out...";

  return (
    <Sidebar
      collapsible={isSidebarMobile ? "offcanvas" : "icon"}
      variant="inset"
    >
      <SidebarContent className="pt-(--standalone)] overflow-hidden">
        <SidebarHeader className="h-14 flex flex-row items-center gap-2 m-2 px-4 border-b border-sidebar-border overflow-hidden">
          <Leaf
            className="text-emerald-500 shrink-0"
            style={{
              width: state === "collapsed" ? "32px" : "32px",
              height: state === "collapsed" ? "32px" : "32px",
            }}
          />

          {state !== "collapsed" && (
            <p className="text-xl font-bold text-nowrap logoFace animate-in fade-in duration-200">
              {t.title}
            </p>
          )}
        </SidebarHeader>

        <SidebarMenu className="gap-5">
          {navigationItems.map((link) => {
            const label = t.sidebar[link.labelKey];
            return (
              <SidebarMenuItem key={link.name} className="flex mx-3">
                <SidebarMenuButton
                  onClick={() => {
                    if (link.isLocked && user === null) {
                      redirectToLogin();
                    } else {
                      setOpenMobile(false);
                      setCurrentPage(link.name);
                    }
                  }}
                  variant={"outline"}
                  tooltip={label}
                  className={`group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:p-3! ml-1 hover:scale-105 rounded-sm transition-all text-nowrap p-3 py-1.5 size-12 w-full bg-white hover:bg-emerald-100 dark:bg-white/5 dark:hover:bg-white/10 ${
                    currentPage.name === link.name
                      ? "border border-emerald-300 bg-emerald-100"
                      : ""
                  }`}
                >
                  <link.icon style={{ height: "100%", width: "22px" }} />
                  <div className="pl-1.5 text-lg">{label}</div>
                  <SidebarMenuBadge>
                    {link.isLocked && user === null ? <LockIcon /> : null}
                  </SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
        <div className="grow"></div>
        {user !== null && (
          <SidebarFooter className="flex gap-3 m-0 p-0 mb-6">
            <SidebarSeparator className="border-slate-200 dark:border-slate-700" />
            <SidebarMenuItem className="flex items-center px-3 py-2 text-base text-nowrap overflow-hidden">
              {/* Upper Section: Avatar + Name Details */}
              <Avatar size="lg" className="mr-3 ml-1 shrink-0 border border-emerald-500/30">
                {avatarUrl && (
                  <AvatarImage
                    src={avatarUrl}
                    alt={displayName}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="text-base font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {firstName?.[0]?.toUpperCase() ?? displayName?.[0]?.toUpperCase() ?? "F"}
                  {lastName?.[0]?.toUpperCase() ?? ""}
                </AvatarFallback>
              </Avatar>
              {/* Name and Metadata Layout */}
              <span className="truncate font-semibold text-foreground text-sm">
                {displayName}
              </span>
            </SidebarMenuItem>

            <SidebarMenuItem className="flex mx-3">
              <SidebarMenuButton
                type="button"
                variant="outline"
                onClick={logout}
                disabled={isLoading}
                tooltip={t.sidebar.logout}
                className="group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:p-3.25! ml-1 hover:scale-105 rounded-sm transition-all text-nowrap p-3 py-1.5 size-12 w-full bg-white hover:bg-rose-200 dark:bg-white/5 dark:hover:bg-rose-500/10 border hover:border-rose-400"
              >
                <div className="flex items-center gap-2 h-full">
                  {isLoading ? (
                    <LoaderCircle
                      style={{ height: "100%", width: "22px" }}
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <LogOut
                      style={{ height: "100%", width: "22px" }}
                      aria-hidden="true"
                    />
                  )}
                  <div className="text-lg">
                    {isLoading ? loggingOutText : t.sidebar.logout}
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarFooter>
        )}
        {user === null && (
          <SidebarFooter className="flex gap-3 m-0 p-0 mb-6">
            <SidebarSeparator className="border-slate-200 dark:border-slate-700" />
            <SidebarMenuItem className="flex mx-3">
              <SidebarMenuButton
                type="button"
                variant="outline"
                onClick={() => router.push("/auth/login")}
                tooltip={t.nav.signIn}
                className="group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:p-3.25! ml-1 hover:scale-105 rounded-sm transition-all text-nowrap p-3 py-1.5 size-12 w-full bg-white hover:bg-emerald-100 dark:bg-white/5 dark:hover:bg-emerald-500/10 border hover:border-emerald-400"
              >
                <div className="flex items-center gap-2 h-full">
                  <LogIn
                    style={{ height: "100%", width: "22px" }}
                    className="text-emerald-500"
                    aria-hidden="true"
                  />
                  <div className="text-lg">
                    {t.nav.signIn}
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarFooter>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
export default AppSidebar;
