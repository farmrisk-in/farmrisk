import { Footer } from "@/components/home/Footer";
import { Hero } from "@/components/home/Hero";
import { Problem } from "@/components/home/Problem";
import { Solution } from "@/components/home/Solution";

export default function Home() {
  return (
    <div className="pt-(--standalone)">
      <Hero />
      <Problem />
      <Solution />
      <Footer />
    </div>
  );
}
