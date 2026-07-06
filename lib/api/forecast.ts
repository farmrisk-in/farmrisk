import { ForecastAPIResponse, DayPrediction } from "@/types/forecast";

export async function getForecast(
  lat: number,
  lng: number,
  forecastData?: any,
): Promise<ForecastAPIResponse> {
  const body: any = {
    lat,
    lon: lng,
    village_id: 12345,
  };

  if (forecastData) {
    const getCleanArray = (arr: any[] | undefined, defaultValue: any, isDate: boolean = false) => {
      const clean = [];
      for (let i = 0; i < 16; i++) {
        let val = arr && arr[i] !== undefined && arr[i] !== null ? arr[i] : defaultValue;
        if (isDate && (!val || val === "")) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          val = d.toISOString().split("T")[0];
        }
        clean.push(val);
      }
      return clean;
    };

    body.forecast_data = {
      daily: {
        time: getCleanArray(forecastData.time, "", true),
        temperature_2m_max: getCleanArray(forecastData.temperature_2m_max, 30.0),
        temperature_2m_min: getCleanArray(forecastData.temperature_2m_min, 20.0),
        precipitation_sum: getCleanArray(forecastData.precipitation_sum, 0.0),
      },
    };
  }

  const res = await fetch(`/api/forecast`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Forecast request failed: ${res.statusText}`);
  }

  const backendData = await res.json();

  // Map backend response structure to the frontend format
  const backendForecastObj = backendData.forecast;
  const success = backendForecastObj?.success ?? false;
  const rawPredictions = backendForecastObj?.forecast || [];

  const predictions: DayPrediction[] = rawPredictions.map((day: any) => ({
    date: day.date,
    raw: {
      tmax: day.tmax_raw,
      tmin: day.tmin_raw,
      pcp: day.pcp_raw,
    },
    corrected: {
      tmax: day.tmax_corrected,
      tmin: day.tmin_corrected,
      pcp: day.pcp_corrected,
    },
  }));

  return {
    success,
    predictions,
  };
}
