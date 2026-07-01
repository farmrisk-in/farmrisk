import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { LocationProvider } from "@/providers/LocationProvider";
import { NavigationProvider } from "@/providers/NavigationProvider";
import { Toaster } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/ThemeChange";
import { PageHeading } from "@/components/ui/PageHeading";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Download from "@/components/dashboard/overview/Download";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavigationProvider>
      <LocationProvider>
        <SidebarProvider defaultOpen>
          <AppSidebar />
          <div className="pt-(--standalone) flex flex-col gap-3 flex-1 min-w-0 m-3 h-[calc(100vh-24px)] lg:ml-0 md:ml-0">
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <div className="flex items-center justify-center rounded-md gap-3 w-10">
                  <SidebarTrigger className="rounded-md" />
                </div>
                <div className="flex items-center justify-center rounded-md gap-3">
                  <PageHeading classname="text-lg font-bold" />
                </div>
              </div>
              <div className="flex gap-3 self-end ml-auto">
                <Badge
                  variant={"outline"}
                  color="blue"
                  className="lg:flex hidden"
                >
                  {new Date().toDateString()}
                </Badge>
                <Download />
                <LanguageSwitcher isScrolled={true} rounded={false} />
                <ModeToggle rounded={false} />
              </div>
            </div>
            <main className="rounded-xl grow border w-full p-3 lg:p-6 overflow-scroll">
              <div className="max-w-7xl mx-auto">{children}</div>
              <Toaster position="bottom-center" richColors />
            </main>
          </div>
        </SidebarProvider>
      </LocationProvider>
    </NavigationProvider>
  );
}
