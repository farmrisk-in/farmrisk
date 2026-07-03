import { Footer } from "@/components/home/Footer";
import { Hero } from "@/components/home/Hero";
import { Problem } from "@/components/home/Problem";
import { Solution } from "@/components/home/Solution";
import { formatHeroUserCount } from "@/lib/utils";
import { createClient } from "@/supabase/server";

export default async function Home() {
  let userCount = 10000;

  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const { userCountRounded, suffix } = formatHeroUserCount(userCount);

  return (
    <div className="pt-(--standalone)">
      <Hero userCount={userCountRounded} suffix={suffix} />
      <Problem />
      <Solution />
      <Footer />
    </div>
  );
}
