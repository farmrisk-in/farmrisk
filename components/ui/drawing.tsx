import useLanguage from "@/hooks/useLanguage";
import { LightningData } from "@/types/weather";
import L from "leaflet";
import { MapPin } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { Circle, Marker, Popup } from "react-leaflet";

const markerIcon = L.divIcon({
  className: "custom-marker",
  html: renderToStaticMarkup(
    <MapPin size={32} strokeWidth={2} className="text-foreground" />,
  ),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export const Drawing = ({
  data: { score, category, color },
  location: { lat, lng, name },
  t,
}: {
  data: LightningData;
  location: { lat: number; lng: number; name?: string };
  t: ReturnType<typeof useLanguage>["t"];
}) => {
  let radius = 2000;
  if (color === "green") radius = 2000;
  if (color === "yellow") radius = 5000;
  if (color === "orange") radius = 8000;
  if (color === "red") radius = 12000;
  return (
    <>
      <Circle
        center={[lat, lng]}
        radius={radius}
        pathOptions={{
          color: color,
          fillColor: color,
          fillOpacity: 0.2,
          weight: 2,
        }}
      />
      <Marker position={[lat, lng]} icon={markerIcon}>
        <Popup className="rounded-lg">
          <div className="flex flex-col gap-1 min-w-37.5 p-0.5 font-sans">
            <div className="font-semibold text-sm text-black">{name}</div>
            <div className="text-xs font-medium flex justify-between items-center mt-1 border-b border-border pb-1">
              <span className="text-black">
                {t?.dashboard?.riskLevel || "Risk Level"}:{" "}
              </span>
              <span className="capitalize font-bold" style={{ color: color }}>
                {(category === "Low" && t?.dashboard?.riskLow) ||
                  (category === "Moderate" && t?.dashboard?.riskModerate) ||
                  (category === "High" && t?.dashboard?.riskHigh) ||
                  (category === "Severe" && t?.dashboard?.riskSevere) ||
                  category}{" "}
                ({score}/100)
              </span>
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
};
