import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info/InfoPage";
import { SUPPORT_EMAIL } from "@/components/info/ContactForm";

export const metadata: Metadata = {
  title: "FAQs",
  alternates: { canonical: "/faq" },
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "What is FarmRisk?",
    a: "FarmRisk turns weather forecasts into clear risk levels and simple farm advice. It is built by the Water & Climate Lab at IIT Gandhinagar.",
  },
  {
    q: "Do I need an account?",
    a: (
      <>
        No. The <Link href="/dashboard">free dashboard</Link> shows weather
        risk for any location without signing up. An account lets you save
        farms and crops and get advice for your own fields. It also unlocks
        farming tools such as pre-sowing, post-sowing and disease detection.
      </>
    ),
  },
  {
    q: "Is FarmRisk free?",
    a: "Yes, the village-level dashboard is free. A farm-level plan adds advice for your own fields after registering.",
  },
  {
    q: "Where does the weather forecast come from? How far ahead does the forecast go?",
    a: "We start from a global weather forecast. We then correct its temperature and rainfall using machine-learning models. These models are trained on India Meteorological Department (IMD) gridded observations for the surrounding area. The forecast goes for 15 days. Hourly detail is shown for the next 24 hours.",
  },
  {
    q: "How accurate is the forecast?",
    a: "We check our forecasts against observed weather every day. We compare them with IMD gridded data and airport weather station records. Accuracy is highest for the next few days and drops further ahead.",
  },
  {
    q: "What risks does FarmRisk check?",
    a: "Weather risk covers heavy rain, heat stress, lightning, strong wind and frost. Farm risk covers irrigation needs, soil dryness, and pest and disease risk.",
  },
  {
    q: "How are risk scores calculated?",
    a: "Each hazard is scored using IMD thresholds and published research. These are fixed rules, not AI guesses. The overall risk level reflects the biggest hazard. It goes up further when several hazards occur together.",
  },
  {
    q: "How is soil moisture estimated?",
    a: "A root-zone water-balance (leaky bucket) model tracks rainfall and evaporation day by day. We show the result as a percentile of the local historical record. This tells you whether the soil is drier or wetter than usual for this time of year.",
  },
  {
    q: "Can I rely on the AI advisory?",
    a: "Treat it as a second opinion. Advisories are generated from the forecast and soil data. They are checked automatically against those numbers, but they can still be wrong. Follow official IMD and KVK guidance where it differs.",
  },
  {
    q: "Where does pest and disease advice come from?",
    a: "It is drawn from trusted agricultural sources and shown with references. Weather conditions decide when a pest or disease risk is flagged.",
  },
  {
    q: "Which languages are supported?",
    a: "FarmRisk is available in English, Hindi, Gujarati, Marathi and Tamil. More languages are planned.",
  },
  {
    q: "Is there a mobile app?",
    a: "Yes. An Android app offers the same dashboard and tools.",
  },
  {
    q: "Is my data safe? Can I delete my account?",
    a: (
      <>
        We only collect the details needed to run your account and farm
        advice. You can delete your account and data at any time. See our{" "}
        <Link href="/privacy">Privacy Policy</Link> and{" "}
        <Link href="/delete-account">Account Deletion</Link> pages.
      </>
    ),
  },
  {
    q: "I work with farmers. Can we partner with you?",
    a: (
      <>
        Yes. Please write to us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <InfoPage title="Frequently Asked Questions (FAQs)">
      {FAQS.map(({ q, a }) => (
        <section key={q}>
          <h2>{q}</h2>
          <p className="mt-2">{a}</p>
        </section>
      ))}
    </InfoPage>
  );
}
