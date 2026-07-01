import { NextRequest } from "next/server";
// WMO weather interpretation code → { condition, icon }
// https://open-meteo.com/en/docs (WMO Weather interpretation codes)
type WmoEntry = {
  condition: {
    en: string;
    hi: string;
    mr: string;
    ta: string;
    gu: string;
  };
  icon:
    | "Sun"
    | "CloudSun"
    | "Cloud"
    | "CloudDrizzle"
    | "CloudRain"
    | "CloudLightning"
    | "Snowflake"
    | "Wind";
};

const WMO_MAP: Record<number, WmoEntry> = {
  0: {
    condition: {
      en: "Clear sky",
      hi: "साफ़ आसमान",
      mr: "स्वच्छ आकाश",
      ta: "தெளிவான வானம்",
      gu: "સ્વચ્છ આકાશ",
    },
    icon: "Sun",
  },
  1: {
    condition: {
      en: "Mainly clear",
      hi: "मुख्यतः साफ़",
      mr: "प्रामुख्याने स्वच्छ",
      ta: "பெரும்பாலும் தெளிவு",
      gu: "મુખ્યત્વે સ્વચ્છ",
    },
    icon: "Sun",
  },
  2: {
    condition: {
      en: "Partly cloudy",
      hi: "आंशिक बादल",
      mr: "अंशतः ढगाळ",
      ta: "பகுதி மேகமூட்டம்",
      gu: "આંશિક વાદળ",
    },
    icon: "CloudSun",
  },
  3: {
    condition: {
      en: "Overcast",
      hi: "बादल छाए हुए",
      mr: "आच्छादित",
      ta: "மேகமூட்டம்",
      gu: "વાદળછાયું",
    },
    icon: "Cloud",
  },
  45: {
    condition: {
      en: "Foggy",
      hi: "धुंध",
      mr: "धुक्याचे",
      ta: "மூடுபனி",
      gu: "靄",
    },
    icon: "Cloud",
  },
  48: {
    condition: {
      en: "Icy fog",
      hi: "जमी हुई धुंध",
      mr: "गोठलेली धुकी",
      ta: "பனி மூட்டம்",
      gu: "ઠંડી靄",
    },
    icon: "Cloud",
  },
  51: {
    condition: {
      en: "Light drizzle",
      hi: "हल्की बूंदाबांदी",
      mr: "हलकी रिमझिम",
      ta: "இலகுவான தூறல்",
      gu: "હળવી ઝરમર",
    },
    icon: "CloudDrizzle",
  },
  53: {
    condition: {
      en: "Drizzle",
      hi: "बूंदाबांदी",
      mr: "रिमझिम",
      ta: "தூறல்",
      gu: "ઝરમર",
    },
    icon: "CloudDrizzle",
  },
  55: {
    condition: {
      en: "Heavy drizzle",
      hi: "भारी बूंदाबांदी",
      mr: "जड रिमझिम",
      ta: "கனமான தூறல்",
      gu: "ભારી ઝરમર",
    },
    icon: "CloudDrizzle",
  },
  61: {
    condition: {
      en: "Light rain",
      hi: "हल्की बारिश",
      mr: "हलका पाऊस",
      ta: "இலகுவான மழை",
      gu: "હળવો વરસાદ",
    },
    icon: "CloudRain",
  },
  63: {
    condition: { en: "Rain", hi: "बारिश", mr: "पाऊस", ta: "மழை", gu: "વરસાદ" },
    icon: "CloudRain",
  },
  65: {
    condition: {
      en: "Heavy rain",
      hi: "भारी बारिश",
      mr: "जड पाऊस",
      ta: "கனமழை",
      gu: "ભારી વરસાદ",
    },
    icon: "CloudRain",
  },
  71: {
    condition: {
      en: "Light snow",
      hi: "हल्की बर्फ",
      mr: "हलका हिमवर्षाव",
      ta: "இலகுவான பனி",
      gu: "હળવો હિમ",
    },
    icon: "Snowflake",
  },
  73: {
    condition: {
      en: "Snow",
      hi: "बर्फबारी",
      mr: "हिमवर्षाव",
      ta: "பனிப்பொழிவு",
      gu: "હિમ",
    },
    icon: "Snowflake",
  },
  75: {
    condition: {
      en: "Heavy snow",
      hi: "भारी बर्फबारी",
      mr: "जड हिमवर्षाव",
      ta: "கனமான பனி",
      gu: "ભારી હિમ",
    },
    icon: "Snowflake",
  },
  77: {
    condition: {
      en: "Snow grains",
      hi: "बर्फ के दाने",
      mr: "हिम दाणे",
      ta: "பனி துகள்கள்",
      gu: "હિમ કણ",
    },
    icon: "Snowflake",
  },
  80: {
    condition: {
      en: "Rain showers",
      hi: "बारिश की बौछारें",
      mr: "पावसाच्या सरी",
      ta: "மழை சாரல்",
      gu: "ઝાપટાં",
    },
    icon: "CloudRain",
  },
  81: {
    condition: {
      en: "Showers",
      hi: "बौछारें",
      mr: "सरी",
      ta: "சாரல்",
      gu: "ઝાપટ",
    },
    icon: "CloudRain",
  },
  82: {
    condition: {
      en: "Heavy showers",
      hi: "भारी बौछारें",
      mr: "जड सरी",
      ta: "கனமான சாரல்",
      gu: "ભારી ઝાપટ",
    },
    icon: "CloudRain",
  },
  85: {
    condition: {
      en: "Snow showers",
      hi: "बर्फ की बौछारें",
      mr: "हिम सरी",
      ta: "பனி சாரல்",
      gu: "હિમ ઝાપટ",
    },
    icon: "Snowflake",
  },
  86: {
    condition: {
      en: "Heavy snow showers",
      hi: "भारी बर्फ की बौछारें",
      mr: "जड हिम सरी",
      ta: "கனமான பனி சாரல்",
      gu: "ભારી હિમ ઝાપટ",
    },
    icon: "Snowflake",
  },
  95: {
    condition: {
      en: "Thunderstorm",
      hi: "आंधी-तूफान",
      mr: "वादळ",
      ta: "இடியுடன் கூடிய மழை",
      gu: "વીજળી-તોફાન",
    },
    icon: "CloudLightning",
  },
  96: {
    condition: {
      en: "Thunderstorm with hail",
      hi: "ओलावृष्टि के साथ तूफान",
      mr: "गारपिटीसह वादळ",
      ta: "கல் மழையுடன் இடி",
      gu: "કરા સાથે વાવાઝોડું",
    },
    icon: "CloudLightning",
  },
  99: {
    condition: {
      en: "Heavy thunderstorm",
      hi: "भारी आंधी-तूफान",
      mr: "जड वादळ",
      ta: "கடுமையான இடி",
      gu: "ભારી વીજળી-તોફાન",
    },
    icon: "CloudLightning",
  },
};

function resolveWmo(code: number): WmoEntry {
  return (
    WMO_MAP[code] ?? {
      condition: {
        en: "Unknown",
        hi: "अज्ञात",
        mr: "अज्ञात",
        ta: "தெரியவில்லை",
        gu: "અજ્ઞાત",
      },
      icon: "Sun",
    }
  );
}

// Open-Meteo response shape (partial)

type OpenMeteoResponse = {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    pressure_msl: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
    precipitation: number;
    cloud_cover: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    windspeed_10m: number[];
    weathercode: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    weathercode: number[];
  };
};

// Helpers

function formatHour(isoTime: string): string {
  // isoTime is like "2024-06-26T07:00"
  const date = new Date(isoTime);
  const h = date.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")} ${ampm}`;
}

function formatDate(isoDate: string): string {
  // isoDate is like "2024-06-26"
  const date = new Date(`${isoDate}T00:00:00`);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

function getDayName(
  isoDate: string,
  index: number,
): { en: string; hi: string; mr: string; ta: string; gu: string } {
  if (index === 0) {
    return { en: "Today", hi: "आज", mr: "आज", ta: "இன்று", gu: "આજ" };
  }
  const date = new Date(`${isoDate}T00:00:00`);
  const dayNames = {
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    hi: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
    mr: ["रवि", "सोम", "मंगळ", "बुध", "गुरु", "शुक्र", "शनि"],
    ta: ["ஞாயிறு", "திங்கள்", "செவ்வாய்", "புதன்", "வியாழன்", "வெள்ளி", "சனி"],
    gu: ["રવિ", "સોમ", "મંગળ", "બુધ", "ગુરુ", "શુક્ર", "શનિ"],
  };
  const d = date.getDay();
  return {
    en: dayNames.en[d],
    hi: dayNames.hi[d],
    mr: dayNames.mr[d],
    ta: dayNames.ta[d],
    gu: dayNames.gu[d],
  };
}

// Route handler

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return Response.json(
      { error: "lat and lng query params are required." },
      { status: 400 },
    );
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  if (isNaN(latNum) || isNaN(lngNum)) {
    return Response.json(
      { error: "lat and lng must be valid numbers." },
      { status: 400 },
    );
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latNum));
  url.searchParams.set("longitude", String(lngNum));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,cloud_cover",
  );
  url.searchParams.set(
    "hourly",
    "temperature_2m,precipitation_probability,windspeed_10m,weathercode",
  );
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode",
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "16");

  const response = await fetch(url.toString(), {
    next: { revalidate: 1800 }, // cache 30 min server-side
  });

  if (!response.ok) {
    const body = await response.text();
    return Response.json(
      { error: `Open-Meteo error: ${body}` },
      { status: 502 },
    );
  }

  const raw = (await response.json()) as OpenMeteoResponse;

  // ---- Hourly: pick 6 slots from today starting at 6 AM local ----
  const now = new Date();
  const nowMs = now.getTime();
  let closestIndex = 0;
  let minDiff = Infinity;
  for (let i = 0; i < raw.hourly.time.length; i++) {
    const timeMs = new Date(raw.hourly.time[i]).getTime();
    const diff = Math.abs(timeMs - nowMs);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }

  // Pick the next 24 hours starting from the closest index
  const hourlySlots = Array.from({ length: 24 }, (_, i) => closestIndex + i)
    .filter((idx) => idx < raw.hourly.time.length);

  const hourly = hourlySlots.map((i) => {
    const wmo = resolveWmo(raw.hourly.weathercode[i]);
    return {
      time: formatHour(raw.hourly.time[i]),
      temp: Math.round(raw.hourly.temperature_2m[i]),
      condition: wmo.condition,
      rainChance: raw.hourly.precipitation_probability[i] ?? 0,
      windKph: Math.round(raw.hourly.windspeed_10m[i]),
      icon: wmo.icon,
    };
  });

  // ---- Daily: 16 days ----
  const forecast = raw.daily.time.slice(0, 16).map((date, idx) => {
    const wmo = resolveWmo(raw.daily.weathercode[idx]);
    return {
      day: getDayName(date, idx),
      date: formatDate(date),
      high: Math.round(raw.daily.temperature_2m_max[idx]),
      low: Math.round(raw.daily.temperature_2m_min[idx]),
      condition: wmo.condition,
    };
  });

  // ---- Current Weather ----
  const wmoCurrent = resolveWmo(raw.current.weather_code);
  const current = {
    temp: Math.round(raw.current.temperature_2m),
    condition: wmoCurrent.condition,
    icon: wmoCurrent.icon,
    humidity: raw.current.relative_humidity_2m,
    apparentTemp: Math.round(raw.current.apparent_temperature),
    windKph: Math.round(raw.current.wind_speed_10m),
    windGustsKph: Math.round(raw.current.wind_gusts_10m),
    pressureMb: Math.round(raw.current.pressure_msl),
    precipitation: raw.current.precipitation,
    windDirection: raw.current.wind_direction_10m,
    cloudCover: raw.current.cloud_cover,
    surfacePressureMb: Math.round(raw.current.surface_pressure),
  };

  return Response.json({ current, hourly, forecast });
}
