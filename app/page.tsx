import { Footer } from "@/components/home/Footer";
import { Hero } from "@/components/home/Hero";
import { Problem } from "@/components/home/Problem";
import { Solution } from "@/components/home/Solution";
import { createClient } from "@/supabase/server";

export default async function Home() {
  let userCount = 10000;

  try {
    const supabase = await createClient();
    // Using untyped call to bypass TypeScript compilation checks on custom database RPCs
    const { data, error } = await (supabase as any).rpc("get_user_count");
    if (error) {
      console.warn(
        "RPC get_user_count error, trying profiles table count fallback:",
        error,
      );
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (count !== null) {
        userCount = count;
      }
    } else if (data !== null) {
      userCount = data;
    }
  } catch (err) {
    console.error("Failed to query user count on server side:", err);
  }

  return (
    <div className="pt-(--standalone)">
      <Hero userCount={userCount} />
      <Problem />
      <Solution />
      <Footer />
    </div>
  );
}
