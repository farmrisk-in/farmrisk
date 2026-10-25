import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info/InfoPage";

export const metadata: Metadata = {
  title: "FAQs",
  alternates: { canonical: "/faq" },
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Do I need an account?",
    a: (
      <>
        No. The <Link href="/dashboard">free dashboard</Link> shows weather,
        soil moisture and risk for any location without signing up. An account
        lets you save farms and crops and unlocks tools such as pre-sowing
        advice.
      </>
    ),
  },
  {
    q: "Where does the weather forecast come from?",
    a: "We start from a global numerical weather forecast and correct its temperature and rainfall using machine-learning models trained against India Meteorological Department (IMD) gridded observations for the surrounding grid cells.",
  },
  {
    q: "How far ahead does the forecast go?",
    a: "15 days. Hourly detail is shown for the next 24 hours.",
  },
  {
    q: "How is soil moisture estimated?",
    a: "A root-zone water-balance (leaky bucket) model tracks rainfall and evaporation day by day. We show the result as a percentile of the local historical record, so you can see whether the soil is drier or wetter than usual for this time of year.",
  },
  {
    q: "Can I rely on the AI advisory?",
    a: "Treat it as a second opinion. Advisories are generated from the forecast and soil data and are checked automatically against those numbers, but they can still be wrong. Follow official IMD and KVK guidance where it differs.",
  },
  {
    q: "Which languages are supported?",
    a: "English, Hindi, Marathi, Tamil and Gujarati.",
  },
  {
    q: "Is there a mobile app?",
    a: "Yes, an Android app offers the same dashboard and tools.",
  },
];

export default function FaqPage() {
  return (
    <InfoPage title="Frequently asked questions">
      {FAQS.map(({ q, a }) => (
        <section key={q}>
          <h2>{q}</h2>
          <p className="mt-2">{a}</p>
        </section>
      ))}
    </InfoPage>
  );
}
