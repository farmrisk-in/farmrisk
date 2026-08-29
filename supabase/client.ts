import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-anon-key";

  return { url, publishableKey };
}

export function isSupabaseConfigured() {
  const { url, publishableKey } = getSupabaseConfig();
  return (
    Boolean(url) &&
    !url.includes("placeholder") &&
    Boolean(publishableKey) &&
    !publishableKey.includes("placeholder")
  );
}

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  const { url, publishableKey } = getSupabaseConfig();

  browserClient ??= createBrowserClient<Database>(url, publishableKey);
  return browserClient;
}

