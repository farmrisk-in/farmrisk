import { Features } from "@/components/home/Features";
import { Footer } from "@/components/home/Footer";
import { Hero } from "@/components/home/Hero";
import { Problem } from "@/components/home/Problem";
import Solution from "@/components/home/Solution";

export default function Home() {
  return (
    <div className="pt-(--standalone)">
      <div className="h-(--standalone) top-0 z-50 w-full fixed backdrop-blur-lg" />
      <Hero />
      <Problem />
      <Solution />
      <Features />
      <Footer />
    </div>
  );
}
