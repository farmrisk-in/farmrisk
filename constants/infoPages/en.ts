import type { InfoContent } from "./types";

export const en: InfoContent = {
  about: {
    title: "About FarmRisk",
    intro: [
      "FarmRisk turns weather and soil-water data into simple, local advice for Indian farmers, in your language.",
    ],
    sections: [
      {
        heading: "Why FarmRisk exists",
        blocks: [
          {
            p: [
              "Weather decides much of a farmer’s season. One heavy rain spell can wash out a sowing. A heatwave can hurt a crop at flowering. Strong wind or lightning can put lives and fields at risk.",
            ],
          },
          {
            p: [
              "Weather forecasts exist, but they are often hard to use. They come as numbers and maps. They rarely say what to do in the field today. FarmRisk closes that gap. It turns forecasts into clear risks and simple advice for your village and your farm.",
            ],
          },
        ],
      },
      {
        heading: "What FarmRisk does",
        blocks: [
          {
            ul: [
              [
                { strong: "Weather Risk." },
                " FarmRisk checks the coming days and hours for five hazards: heavy rain, heat stress, lightning, strong wind, and frost. Each hazard gets a risk score. The app then shows one overall risk level and names the main reasons behind it.",
              ],
              [
                { strong: "Farm Risk." },
                " FarmRisk also gives irrigation advice based on soil moisture, crop type and stage. It flags pest and disease risk linked to the weather. It also provides general crop advisories.",
              ],
              [
                { strong: "Daily to-do list." },
                " Each day, FarmRisk suggests what to do and what to avoid. For example, it may advise you to delay spraying before rain or to irrigate before a hot spell.",
              ],
            ],
          },
        ],
      },
      {
        heading: "Built on science",
        blocks: [
          {
            ul: [
              [
                "Forecasts come from Open-Meteo. We correct them using machine learning trained on India Meteorological Department (IMD) observations. This makes local forecasts more reliable, including for heavy rain.",
              ],
              [
                "Risk scores follow IMD thresholds and published research. They are calculated by fixed rules, not guesses.",
              ],
              [
                "AI is used only to explain the results in simple words. It does not decide the risk.",
              ],
              [
                "Pest and disease advice is drawn from trusted agricultural sources, with references.",
              ],
              ["We check our forecasts against observed weather every day."],
            ],
          },
        ],
      },
      {
        heading: "In your language",
        blocks: [
          {
            p: [
              "FarmRisk is available in 11 languages: English, Hindi, Marathi, Gujarati, Tamil, Assamese, Bengali, Kannada, Malayalam, Punjabi and Telugu.",
            ],
          },
        ],
      },
      {
        heading: "Who it is for",
        blocks: [
          {
            ul: [
              ["Farmers who want simple, local weather advice."],
              ["Farmer groups, FPOs and NGOs who support farming communities."],
              [
                "Extension workers and partners who need reliable risk information for their region.",
              ],
            ],
          },
        ],
      },
      {
        heading: "How to use FarmRisk",
        blocks: [
          {
            p: [
              "FarmRisk is free for village-level weather risk. A farm-level plan gives advice for your own fields and crop.",
            ],
          },
          {
            ul: [
              ["Website: ", { link: "www.farmrisk.in", href: "/" }],
              ["Android app: Search “FarmRisk” on Google Play"],
            ],
          },
          { p: ["Create an account with a few basic details to unlock all features."] },
        ],
      },
      {
        heading: "Contact",
        blocks: [
          {
            p: [
              "Have feedback or want to partner with us? Write to us at ",
              { email: true },
              ".",
            ],
          },
        ],
      },
    ],
  },
  faq: {
    title: "Frequently Asked Questions (FAQs)",
    items: [
      {
        q: "What is FarmRisk?",
        a: [
          "FarmRisk turns weather forecasts into clear risk levels and simple farm advice. It is built by the Water & Climate Lab at IIT Gandhinagar.",
        ],
      },
      {
        q: "Do I need an account?",
        a: [
          "No. The ",
          { link: "free dashboard", href: "/dashboard" },
          " shows weather risk for any location without signing up. An account lets you save farms and crops and get advice for your own fields. It also unlocks farming tools such as pre-sowing, post-sowing and disease detection.",
        ],
      },
      {
        q: "Is FarmRisk free?",
        a: [
          "Yes, the village-level dashboard is free. A farm-level plan adds advice for your own fields after registering.",
        ],
      },
      {
        q: "Where does the weather forecast come from? How far ahead does the forecast go?",
        a: [
          "We start from a global weather forecast. We then correct its temperature and rainfall using machine-learning models. These models are trained on India Meteorological Department (IMD) gridded observations for the surrounding area. The forecast goes for 15 days. Hourly detail is shown for the next 24 hours.",
        ],
      },
      {
        q: "How accurate is the forecast?",
        a: [
          "We check our forecasts against observed weather every day. We compare them with IMD gridded data and airport weather station records. Accuracy is highest for the next few days and drops further ahead.",
        ],
      },
      {
        q: "What risks does FarmRisk check?",
        a: [
          "Weather risk covers heavy rain, heat stress, lightning, strong wind and frost. Farm risk covers irrigation needs, soil dryness, and pest and disease risk.",
        ],
      },
      {
        q: "How are risk scores calculated?",
        a: [
          "Each hazard is scored using IMD thresholds and published research. These are fixed rules, not AI guesses. The overall risk level reflects the biggest hazard. It goes up further when several hazards occur together.",
        ],
      },
      {
        q: "How is soil moisture estimated?",
        a: [
          "A root-zone water-balance (leaky bucket) model tracks rainfall and evaporation day by day. We show the result as a percentile of the local historical record. This tells you whether the soil is drier or wetter than usual for this time of year.",
        ],
      },
      {
        q: "Can I rely on the AI advisory?",
        a: [
          "Treat it as a second opinion. Advisories are generated from the forecast and soil data. They are checked automatically against those numbers, but they can still be wrong. Follow official IMD and KVK guidance where it differs.",
        ],
      },
      {
        q: "Where does pest and disease advice come from?",
        a: [
          "It is drawn from trusted agricultural sources and shown with references. Weather conditions decide when a pest or disease risk is flagged.",
        ],
      },
      {
        q: "Which languages are supported?",
        a: [
          "FarmRisk is available in 11 languages: English, Hindi, Marathi, Gujarati, Tamil, Assamese, Bengali, Kannada, Malayalam, Punjabi and Telugu.",
        ],
      },
      {
        q: "Is there a mobile app?",
        a: ["Yes. An Android app offers the same dashboard and tools."],
      },
      {
        q: "Is my data safe? Can I delete my account?",
        a: [
          "We only collect the details needed to run your account and farm advice. You can delete your account and data at any time. See our ",
          { link: "Privacy Policy", href: "/privacy" },
          " and ",
          { link: "Account Deletion", href: "/delete-account" },
          " pages.",
        ],
      },
      {
        q: "I work with farmers. Can we partner with you?",
        a: ["Yes. Please write to us at ", { email: true }, "."],
      },
    ],
  },
  contact: {
    title: "Contact us",
    intro: [
      "Send us a question, a bug report or an idea using the form below, or email ",
      { email: true },
      ".",
    ],
    form: {
      topicLabel: "Topic",
      topics: {
        general: "General",
        bugReport: "Bug Report",
        featureRequest: "Feature Request",
        dataAccuracy: "Data Accuracy",
        other: "Other",
      },
      messageLabel: "Message",
      send: "Send",
      sent: "Thank you. Your message has been sent.",
      failed: {
        before: "We could not send your message.",
        link: "Send it by email instead",
        after: ".",
      },
    },
  },
};
