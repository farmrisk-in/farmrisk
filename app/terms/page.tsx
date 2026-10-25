import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, Todo } from "@/components/info/InfoPage";

export const metadata: Metadata = {
  title: "Terms of Use",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <InfoPage title="Terms of Use" updated="TODO">
      <p>
        These terms apply when you use the FarmRisk website and app, operated by{" "}
        <Todo>legal entity name</Todo>. By using FarmRisk you agree to them.
      </p>

      <h2>Advisory information only</h2>
      <p>
        Forecasts, soil moisture estimates, risk scores and AI-generated
        advisories are model outputs and can be wrong. Use them alongside your
        own judgement and official advisories from IMD, your state agriculture
        department or your local Krishi Vigyan Kendra. FarmRisk is not liable
        for losses arising from decisions made using this information.{" "}
        <Todo>have this liability wording reviewed</Todo>
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Register only with a mobile number that belongs to you.</li>
        <li>Keep your password private. You are responsible for activity on your account.</li>
        <li>You must be at least 18 years old, or use FarmRisk with a parent or guardian.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>
        Do not misuse the service, including by sending automated requests to
        our APIs, trying to access other users&apos; data or uploading unlawful
        content.
      </p>

      <h2>Privacy</h2>
      <p>
        How we handle your data is described in our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>Fees</h2>
      <p>
        <Todo>state that the dashboard is free, and any paid plans</Todo>
      </p>

      <h2>Changes and governing law</h2>
      <p>
        We may update these terms and will post changes on this page. These
        terms are governed by the laws of India.{" "}
        <Todo>jurisdiction (city) for disputes</Todo>
      </p>
    </InfoPage>
  );
}
