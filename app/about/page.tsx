import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, Todo } from "@/components/info/InfoPage";

export const metadata: Metadata = {
  title: "About",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <InfoPage title="About FarmRisk">
      <p>
        FarmRisk turns weather and soil-water data into simple, local advice
        for Indian farmers, in English, Hindi, Marathi, Tamil and Gujarati.
      </p>

      <h2>What FarmRisk does</h2>
      <ul>
        <li>
          A 15-day weather forecast for your location, bias-corrected against
          India Meteorological Department (IMD) gridded observations.
        </li>
        <li>
          Root-zone soil moisture from a water-balance model, shown as a
          percentile against the local historical record.
        </li>
        <li>
          Risk scores for heavy rain, heat, pests and disease, lightning and
          other hazards, plus AI-written advisories based on these numbers.
        </li>
        <li>Crop calendars, mandi prices and crop disease detection from photos.</li>
      </ul>

      <h2>Who we are</h2>
      <p>
        <Todo>team, organisation, and the research background behind FarmRisk</Todo>
      </p>

      <h2>Who it is for</h2>
      <p>
        <Todo>audience: farmers, FPOs, insurers, banks, etc.</Todo>
      </p>

      <p>
        Questions or ideas? <Link href="/contact">Contact us</Link>.
      </p>
    </InfoPage>
  );
}
