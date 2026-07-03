import { NextRequest } from "next/server";

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
    "weather_code,cloud_cover,precipitation,relative_humidity_2m,wind_gusts_10m",
  );
  url.searchParams.set("timezone", "auto");

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

  const raw = await response.json();
  const current = raw.current;

  // Extract variables
  const weatherCode = current.weather_code;
  const cloudCover = current.cloud_cover;
  const precipitation = current.precipitation;
  const humidity = current.relative_humidity_2m;
  const windGusts = current.wind_gusts_10m;

  // Calculate lightning risk score
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

  if (humidity > 80) score += 5;

  if (windGusts > 40) score += 10;
  else if (windGusts > 20) score += 5;

  score = Math.min(score, 100);

  let category = "Low";
  let color = "green";
  let advisory = "Low probability of lightning.";

  if (score >= 75) {
    category = "Severe";
    color = "red";
    advisory = "Thunderstorm conditions likely in your area.";
  } else if (score >= 50) {
    category = "High";
    color = "orange";
    advisory = "Heavy cloud cover and rainfall increase lightning risk.";
  } else if (score >= 25) {
    category = "Moderate";
    color = "yellow";
    advisory = "Moderate risk. Keep an eye on the weather.";
  }

  return Response.json({
    risk: {
      score,
      category,
      color,
      advisory,
    },
    factors: {
      cloudCover,
      precipitation,
      humidity,
      windGusts,
      weatherCode,
    },
    lastUpdated: current.time,
  });
}
