import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info/InfoPage";
import { SUPPORT_EMAIL } from "@/components/info/ContactForm";

export const metadata: Metadata = {
  title: "Terms of Use",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <InfoPage title="Terms of Use" updated="31 October 2026">
      <p>
        These terms apply when you use the FarmRisk website and Android app
        (together, &ldquo;FarmRisk&rdquo; or the &ldquo;Service&rdquo;). By
        using FarmRisk you agree to them. If you do not agree, please do not
        use the Service.
      </p>

      <h2>Advisory information only</h2>
      <p>
        Forecasts, soil moisture estimates, risk scores, pest and disease
        alerts, crop disease detection results and AI-generated advisories
        are produced by models and can be wrong or incomplete. They are
        provided for general information only and are not a substitute for
        professional agricultural advice. Use them alongside your own
        judgement and official advisories from the India Meteorological
        Department (IMD), your state agriculture department or your local
        Krishi Vigyan Kendra (KVK).
      </p>

      <h2>No warranty and limitation of liability</h2>
      <p>
        FarmRisk is provided &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo;, without warranties of any kind. We do not guarantee
        that the Service will be accurate, complete, uninterrupted or
        error-free. To the extent permitted by law, FarmRisk and its team are
        not liable for any loss or damage, including crop, financial or other
        losses, arising from the use of, or reliance on, the Service.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Register only with a mobile number that belongs to you.</li>
        <li>
          Keep your password private. You are responsible for activity on your
          account.
        </li>
        <li>
          You must be at least 18 years old, or use FarmRisk with a parent or
          guardian.
        </li>
        <li>
          You can delete your account at any time. See{" "}
          <Link href="/delete-account">Account Deletion</Link>.
        </li>
      </ul>

      <h2>Acceptable use</h2>
      <p>
        Do not misuse the Service. This includes sending automated or bulk
        requests to our APIs, trying to access other users&apos; data,
        interfering with the Service, or uploading unlawful, harmful or
        misleading content, including photos.
      </p>

      <h2>Fees</h2>
      <p>
        The village-level dashboard is free. Creating an account to unlock
        farm-level features is also free at present. If we introduce paid
        features in future, we will describe them clearly before you are
        charged.
      </p>

      <h2>Privacy</h2>
      <p>
        How we collect and use your data is described in our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>Changes to the Service and these terms</h2>
      <p>
        We may change, suspend or stop any part of the Service at any time. We
        may also update these terms; changes will be posted on this page with
        a new &ldquo;Last updated&rdquo; date. Continuing to use FarmRisk after
        a change means you accept the updated terms.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India.</p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Write to us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </InfoPage>
  );
}
