// Forces the page to be dynamically rendered on every request
export const dynamic = "force-dynamic";

// Prevents data fetches from being cached globally across this route
export const fetchCache = "force-no-store";

import DashboardContent from "@/components/dashboard/DashboardContent";
export default async function Dashboard() {
  return <DashboardContent />;
}
