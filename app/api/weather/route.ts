import { NextRequest } from "next/server";
import { fetchWeatherApi } from "openmeteo";
import { OpenMeteoResponse, WmoEntry } from "@/types/weather";

const WMO_MAP: Record<number, WmoEntry> = {
  0: {
    condition: {
      en: "Clear sky",
      hi: "साफ़ आसमान",
      mr: "स्वच्छ आकाश",
      ta: "தெளிவான வானம்",
      gu: "સ્વચ્છ આકાશ",
    },
    icon: {
      day: "clear_day.svg",
      night: "clear_night.svg",
    },
  },
  1: {
    condition: {
      en: "Mainly clear",
      hi: "मुख्यतः साफ़",
      mr: "प्रामुख्याने स्वच्छ",
      ta: "பெரும்பாலும் தெளிவு",
      gu: "મુખ્યત્વે સ્વચ્છ",
    },
    icon: { day: "mostly_clear_day.svg", night: "mostly_clear_night.svg" },
  },
  2: {
    condition: {
      en: "Partly cloudy",
      hi: "आंशिक बादल",
      mr: "अंशतः ढगाळ",
      ta: "பகுதி மேகமூட்டம்",
      gu: "આંશિક વાદળ",
    },
    icon: {
      day: "partly_cloudy_day.svg",
      night: "partly_cloudy_night.svg",
    },
  },
  3: {
    condition: {
      en: "Overcast",
      hi: "बादल छाए हुए",
      mr: "आच्छादित",
      ta: "மேகமூட்டம்",
      gu: "વાદળછાયું",
    },
    icon: {
      day: "mostly_cloudy_day.svg",
      night: "mostly_cloudy_night.svg",
    },
  },
  45: {
    condition: {
      en: "Foggy",
      hi: "धुंध",
      mr: "धुक्याचे",
      ta: "மூடுபனி",
      gu: "靄",
    },
    icon: {
      day: "haze_fog_dust_smoke.svg",
    },
  },
  48: {
    condition: {
      en: "Icy fog",
      hi: "जमी हुई धुंध",
      mr: "गोठलेली धुकी",
      ta: "பனி மூட்டம்",
      gu: "ઠંડી靄",
    },
    icon: {
      day: "blizzard.svg",
    },
  },
  51: {
    condition: {
      en: "Light drizzle",
      hi: "हल्की बूंदाबांदी",
      mr: "हलकी रिमझिम",
      ta: "இலகுவான தூறல்",
      gu: "હળવી ઝરમર",
    },
    icon: {
      day: "drizzle.svg",
    },
  },
  53: {
    condition: {
      en: "Drizzle",
      hi: "बूंदाबांदी",
      mr: "रिमझिम",
      ta: "தூறல்",
      gu: "ઝરમર",
    },
    icon: {
      day: "drizzle.svg",
    },
  },
  55: {
    condition: {
      en: "Heavy drizzle",
      hi: "भारी बूंदाबांदी",
      mr: "जड रिमझिम",
      ta: "கனமான தூறல்",
      gu: "ભારી ઝરમર",
    },
    icon: {
      day: "drizzle.svg",
    },
  },
  61: {
    condition: {
      en: "Light rain",
      hi: "हल्की बारिश",
      mr: "हलका पाऊस",
      ta: "இலகுவான மழை",
      gu: "હળવો વરસાદ",
    },
    icon: {
      day: "drizzle.svg",
    },
  },
  63: {
    condition: { en: "Rain", hi: "बारिश", mr: "पाऊस", ta: "மழை", gu: "વરસાદ" },
    icon: { day: "showers_rain.svg" },
  },
  65: {
    condition: {
      en: "Heavy rain",
      hi: "भारी बारिश",
      mr: "जड पाऊस",
      ta: "கனமழை",
      gu: "ભારી વરસાદ",
    },
    icon: { day: "heavy_rain.svg" },
  },
  71: {
    condition: {
      en: "Light snow",
      hi: "हल्की बर्फ",
      mr: "हलका हिमवर्षाव",
      ta: "இலகுவான பனி",
      gu: "હળવો હિમ",
    },
    icon: { day: "flurries.svg" },
  },
  73: {
    condition: {
      en: "Snow",
      hi: "बर्फबारी",
      mr: "हिमवर्षाव",
      ta: "பனிப்பொழிவு",
      gu: "હિમ",
    },
    icon: { day: "cloudy_with_snow.svg" },
  },
  75: {
    condition: {
      en: "Heavy snow",
      hi: "भारी बर्फबारी",
      mr: "जड हिमवर्षाव",
      ta: "கனமான பனி",
      gu: "ભારી હિમ",
    },
    icon: {
      day: "heavy_snow.svg",
    },
  },
  77: {
    condition: {
      en: "Snow grains",
      hi: "बर्फ के दाने",
      mr: "हिम दाणे",
      ta: "பனி துகள்கள்",
      gu: "હિમ કણ",
    },
    icon: {
      day: "blowing_snow.svg",
    },
  },
  80: {
    condition: {
      en: "Rain showers",
      hi: "बारिश की बौछारें",
      mr: "पावसाच्या सरी",
      ta: "மழை சாரல்",
      gu: "ઝાપટાં",
    },
    icon: {
      day: "scattered_showers_day.svg",
      night: "scattered_showers_night.svg",
    },
  },
  81: {
    condition: {
      en: "Showers",
      hi: "बौछारें",
      mr: "सरी",
      ta: "சாரல்",
      gu: "ઝાપટ",
    },
    icon: {
      day: "showers_rain.svg",
    },
  },
  82: {
    condition: {
      en: "Heavy showers",
      hi: "भारी बौछारें",
      mr: "जड सरी",
      ta: "கனமான சாரல்",
      gu: "ભારી ઝાપટ",
    },
    icon: {
      day: "heavy_rain.svg",
    },
  },
  85: {
    condition: {
      en: "Snow showers",
      hi: "बर्फ की बौछारें",
      mr: "हिम सरी",
      ta: "பனி சாரல்",
      gu: "હિમ ઝાપટ",
    },
    icon: {
      day: "showers_snow.svg",
    },
  },
  86: {
    condition: {
      en: "Heavy snow showers",
      hi: "भारी बर्फ की बौछारें",
      mr: "जड हिम सरी",
      ta: "கனமான பனி சாரல்",
      gu: "ભારી હિમ ઝાપટ",
    },
    icon: {
      day: "heavy_snow.svg",
    },
  },
  95: {
    condition: {
      en: "Thunderstorm",
      hi: "आंधी-तूफान",
      mr: "वादळ",
      ta: "இடியுடன் கூடிய மழை",
      gu: "વીજળી-તોફાન",
    },
    icon: {
      day: "thunderstorms.svg",
    },
  },
  96: {
    condition: {
      en: "Thunderstorm with hail",
      hi: "ओलावृष्टि के साथ तूफान",
      mr: "गारपिटीसह वादळ",
      ta: "கல் மழையுடன் இடி",
      gu: "કરા સાથે વાવાઝોડું",
    },
    icon: { day: "isolated_thunderstorms.svg" },
  },
  99: {
    condition: {
      en: "Heavy thunderstorm",
      hi: "भारी आंधी-तूफान",
      mr: "जड वादळ",
      ta: "கடுமையான இடி",
      gu: "ભારી વીજળી-તોફાન",
    },
    icon: {
      day: "strong_thunderstorms.svg",
    },
  },
};

const params = {
  latitude: 30,
  longitude: 78,
  daily: ["temperature_2m_max", "temperature_2m_min", "precipitation_sum"],
  hourly: [
    "temperature_2m",
    "precipitation_probability",
    "wind_speed_10m",
    "weather_code",
    "is_day",
  ],
  current: [
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "is_day",
    "weather_code",
    "surface_pressure",
    "pressure_msl",
    "wind_speed_10m",
    "wind_direction_10m",
    "wind_gusts_10m",
    "precipitation",
    "cloud_cover",
  ],
  timezone: "auto",
  forecast_days: 16,
  forecast_hours: 25,
  past_hours: 0,
  past_days: 0,
};

function calculateLightningRisk(
  weatherCode: number,
  cloudCover: number,
  precipitation: number,
  relativeHumidity: number,
  windGusts: number,
) {
  let score = 0;
  // WMO codes for thunderstorm: 95, 96, 99
  if ([95, 96, 99].includes(weatherCode)) {
    score += 50;
  } else if ([80, 81, 82, 85, 86].includes(weatherCode)) {
    // Showers
    score += 20;
  }

  if (cloudCover > 80) score += 15;
  else if (cloudCover > 50) score += 5;

  if (precipitation > 10) score += 20;
  else if (precipitation > 2) score += 10;

  if (relativeHumidity > 80) score += 5;

  if (windGusts > 40) score += 10;
  else if (windGusts > 20) score += 5;

  score = Math.min(score, 100);

  let category = "Low";

  if (score >= 75) {
    category = "Severe";
  } else if (score >= 50) {
    category = "High";
  } else if (score >= 25) {
    category = "Moderate";
  }

  return {
    score,
    category,
  };
}

function roundToNDecimals(num: number, decimals: number): number {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function normalizeArray(
  arr: Float32Array<ArrayBufferLike> | null,
  roundTo: number,
): number[] {
  if (!arr) return [];
  return Array.from(arr).map((v) => roundToNDecimals(v, roundTo));
}

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
  const url = "https://api.open-meteo.com/v1/forecast";
  const responses = await fetchWeatherApi(url, params);

  // Process first location. Add a for-loop for multiple locations or weather models
  const response = responses[0];

  const current = response.current()!;
  const hourly = response.hourly()!;
  const daily = response.daily()!;

  // Note: The order of weather variables in the URL query and the indices below need to match!
  const weatherData: OpenMeteoResponse = {
    latitude: response.latitude(),
    longitude: response.longitude(),
    elevation: response.elevation(),
    timezone: response.timezone(),
    timezoneAbbreviation: response.timezoneAbbreviation(),
    utcOffsetSeconds: response.utcOffsetSeconds(),
    current: {
      time: new Date(
        (Number(current.time()) + response.utcOffsetSeconds()) * 1000,
      ),
      temperature_2m: roundToNDecimals(current.variables(0)!.value(), 0),
      relative_humidity_2m: roundToNDecimals(current.variables(1)!.value(), 0),
      apparent_temperature: roundToNDecimals(current.variables(2)!.value(), 0),
      weather_code: roundToNDecimals(current.variables(4)!.value(), 0),
      surface_pressure: roundToNDecimals(current.variables(5)!.value(), 0),
      pressure_msl: roundToNDecimals(current.variables(6)!.value(), 0),
      wind_speed_10m: roundToNDecimals(current.variables(7)!.value(), 0),
      wind_direction_10m: roundToNDecimals(current.variables(8)!.value(), 0),
      wind_gusts_10m: roundToNDecimals(current.variables(9)!.value(), 0),
      precipitation: roundToNDecimals(current.variables(10)!.value(), 1),
      cloud_cover: roundToNDecimals(current.variables(11)!.value(), 0),
      icon:
        WMO_MAP[current.variables(4)!.value()]?.icon[
          current.variables(3)!.value() ? "day" : "night"
        ] || "",
      condition: WMO_MAP[current.variables(4)!.value()]?.condition,
    },
    hourly: {
      time: Array.from(
        {
          length:
            (Number(hourly.timeEnd()) - Number(hourly.time())) /
            hourly.interval(),
        },
        (_, i) =>
          new Date(
            (Number(hourly.time()) +
              i * hourly.interval() +
              response.utcOffsetSeconds()) *
              1000,
          ),
      ).splice(-24),
      temperature_2m: normalizeArray(
        hourly.variables(0)!.valuesArray(),
        0,
      ).splice(-24),
      precipitation_probability: normalizeArray(
        hourly.variables(1)!.valuesArray(),
        1,
      ).splice(-24),
      wind_speed_10m: normalizeArray(
        hourly.variables(2)!.valuesArray(),
        0,
      ).splice(-24),
      weather_code: normalizeArray(
        hourly.variables(3)!.valuesArray(),
        0,
      ).splice(-24),
      icon: normalizeArray(hourly.variables(3)!.valuesArray(), 0)
        .map((code) => {
          const isDay = normalizeArray(
            hourly.variables(4)!.valuesArray(),
            0,
          ).map(Boolean);
          return WMO_MAP[code]?.icon[isDay ? "day" : "night"] || "";
        })
        .splice(-24),
    },
    daily: {
      time: Array.from(
        {
          length:
            (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval(),
        },
        (_, i) =>
          new Date(
            (Number(daily.time()) +
              i * daily.interval() +
              response.utcOffsetSeconds()) *
              1000,
          ),
      ).splice(-16),
      temperature_2m_max: normalizeArray(
        daily.variables(0)!.valuesArray(),
        0,
      ).splice(-16),
      temperature_2m_min: normalizeArray(
        daily.variables(1)!.valuesArray(),
        0,
      ).splice(-16),
      precipitation_sum: normalizeArray(
        daily.variables(2)!.valuesArray(),
        1,
      ).splice(-16),
    },
    lightning: calculateLightningRisk(
      current.variables(4)!.value(),
      current.variables(11)!.value(),
      current.variables(10)!.value(),
      current.variables(1)!.value(),
      current.variables(9)!.value(),
    ),
  };

  return Response.json(weatherData);
}
