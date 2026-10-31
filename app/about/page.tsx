import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info/InfoPage";
import { SUPPORT_EMAIL } from "@/components/info/ContactForm";

export const metadata: Metadata = {
  title: "About",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <InfoPage title="About FarmRisk">
      <p>
        FarmRisk turns weather and soil-water data into simple, local advice
        for Indian farmers, in your language.
      </p>

      <h2>Why FarmRisk exists</h2>
      <p>
        Weather decides much of a farmer&apos;s season. One heavy rain spell
        can wash out a sowing. A heatwave can hurt a crop at flowering. Strong
        wind or lightning can put lives and fields at risk.
      </p>
      <p>
        Weather forecasts exist, but they are often hard to use. They come as
        numbers and maps. They rarely say what to do in the field today.
        FarmRisk closes that gap. It turns forecasts into clear risks and
        simple advice for your village and your farm.
      </p>

      <h2>What FarmRisk does</h2>
      <ul>
        <li>
          <strong>Weather Risk.</strong> FarmRisk checks the coming days and
          hours for five hazards: heavy rain, heat stress, lightning, strong
          wind, and frost. Each hazard gets a risk score. The app then shows
          one overall risk level and names the main reasons behind it.
        </li>
        <li>
          <strong>Farm Risk.</strong> FarmRisk also gives irrigation advice
          based on soil moisture, crop type and stage. It flags pest and
          disease risk linked to the weather. It also provides general crop
          advisories.
        </li>
        <li>
          <strong>Daily to-do list.</strong> Each day, FarmRisk suggests what
          to do and what to avoid. For example, it may advise you to delay
          spraying before rain or to irrigate before a hot spell.
        </li>
      </ul>

      <h2>Built on science</h2>
      <ul>
        <li>
          Forecasts come from Open-Meteo. We correct them using machine
          learning trained on India Meteorological Department (IMD)
          observations. This makes local forecasts more reliable, including
          for heavy rain.
        </li>
        <li>
          Risk scores follow IMD thresholds and published research. They are
          calculated by fixed rules, not guesses.
        </li>
        <li>
          AI is used only to explain the results in simple words. It does not
          decide the risk.
        </li>
        <li>
          Pest and disease advice is drawn from trusted agricultural sources,
          with references.
        </li>
        <li>We check our forecasts against observed weather every day.</li>
      </ul>

      <h2>In your language</h2>
      <p>
        FarmRisk is available in English, Hindi, Gujarati, Marathi and Tamil.
        More languages are planned.
      </p>

      <h2>Who it is for</h2>
      <ul>
        <li>Farmers who want simple, local weather advice.</li>
        <li>Farmer groups, FPOs and NGOs who support farming communities.</li>
        <li>
          Extension workers and partners who need reliable risk information
          for their region.
        </li>
      </ul>

      <h2>How to use FarmRisk</h2>
      <p>
        FarmRisk is free for village-level weather risk. A farm-level plan
        gives advice for your own fields and crop.
      </p>
      <ul>
        <li>
          Website: <Link href="/">www.farmrisk.in</Link>
        </li>
        <li>Android app: Search &ldquo;FarmRisk&rdquo; on Google Play</li>
      </ul>
      <p>Create an account with a few basic details to unlock all features.</p>

      <h2>Contact</h2>
      <p>
        Have feedback or want to partner with us? Write to us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </InfoPage>
  );
}
