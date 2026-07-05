import { CalendarAPIResponse } from "@/types/calendar";

export async function getCalendar(
  crop: string,
  lat: number,
  lng: number
): Promise<CalendarAPIResponse> {
  const res = await fetch(`/api/calender?lat=${lat}&lng=${lng}&crop=${crop}`);

  if (!res.ok) {
    throw new Error(`Calendar request failed: ${res.statusText}`);
  }

  return res.json();
}
