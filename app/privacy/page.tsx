import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, Todo } from "@/components/info/InfoPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy Policy" updated="TODO">
      <p>
        This notice explains what personal data FarmRisk collects, why, who it
        is shared with, and the rights you have under India&apos;s Digital
        Personal Data Protection Act, 2023. FarmRisk is operated by{" "}
        <Todo>legal entity name and registered address</Todo>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> first and last name, mobile number
          and password (stored only in hashed form by our authentication
          provider).
        </li>
        <li>
          <strong>Profile details you choose to add:</strong> age, location and
          a profile photo.
        </li>
        <li>
          <strong>Farm details:</strong> the places and field boundaries you
          save, and the crops you select.
        </li>
        <li>
          <strong>Location:</strong> the coordinates of the place you search
          for or, if you allow it, your device&apos;s GPS position. These are
          used to fetch weather, soil moisture and risk information.
        </li>
        <li>
          <strong>Crop photos:</strong> images you upload for disease
          detection.
        </li>
        <li>
          <strong>Feedback:</strong> messages you send us, with your phone
          number or email if you are signed in.
        </li>
      </ul>
      <p>
        You can use the free dashboard without an account. In that case we do
        not store your name or number; your chosen location is kept only in
        your browser.
      </p>

      <h2>Why we use it</h2>
      <ul>
        <li>To create and secure your account.</li>
        <li>
          To show forecasts, soil moisture, risk scores and advisories for your
          location and crops.
        </li>
        <li>To answer your feedback and fix problems.</li>
      </ul>
      <p>
        We do not sell your personal data. <Todo>confirm, and state whether
        data is used for any other purpose such as research or analytics</Todo>
      </p>

      <h2>Who we share it with</h2>
      <p>We use these service providers to run FarmRisk:</p>
      <ul>
        <li>Supabase: account login and database.</li>
        <li>Vercel and Hugging Face: hosting for the website and models.</li>
        <li>Open-Meteo: weather data (receives coordinates only).</li>
        <li>
          Ola Maps, LocationIQ and OpenStreetMap: place search (receive the
          search text).
        </li>
        <li>
          Groq and Google Gemini: AI advisory text (receive location, weather
          and crop details, not your name or number).
        </li>
      </ul>
      <p>
        <Todo>where data is stored (country/region) and how long it is kept</Todo>
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to see, correct or delete your personal data, and you can
        withdraw your consent at any time by deleting your account or writing
        to us. Withdrawing consent does not affect processing already done.
      </p>

      <h2>Grievance officer</h2>
      <p>
        <Todo>name, email and postal address of the grievance officer</Todo>.
        You may also contact us through the <Link href="/contact">contact
        page</Link>. If you are not satisfied with our response, you can
        complain to the Data Protection Board of India.
      </p>

      <h2>Changes</h2>
      <p>
        We will post any changes to this notice on this page and update the
        date above.
      </p>
    </InfoPage>
  );
}
