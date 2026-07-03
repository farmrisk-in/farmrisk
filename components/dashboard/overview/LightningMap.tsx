"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

interface LightningData {
  risk: {
    score: number;
    category: string;
    color: "green" | "yellow" | "orange" | "red";
    advisory: string;
  };
  factors: {
    cloudCover: number;
    precipitation: number;
    humidity: number;
    windGusts: number;
    weatherCode: number;
  };
  lastUpdated: string;
}

interface LightningMapProps {
  lat: number;
  lng: number;
  locationName: string;
  isDark: boolean;
  data: LightningData | null;
  t?: any;
}

const getRadius = (color: string) => {
  if (color === "green") return 2000;
  if (color === "yellow") return 5000;
  if (color === "orange") return 8000;
  if (color === "red") return 12000;
  return 2000;
};

const getHexColor = (color: string) => {
  if (color === "green") return "#10b981"; // emerald-500
  if (color === "yellow") return "#f59e0b"; // amber-500
  if (color === "orange") return "#f97316"; // orange-500
  if (color === "red") return "#f43f5e"; // rose-500
  return "#94a3b8"; // slate-400
};

const customIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to recenter map when lat/lng change
function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function LightningMap({ lat, lng, locationName, isDark, data, t }: LightningMapProps) {
  // Use CartoDB DarkMatter for dark mode, otherwise standard OSM
  const tileUrl = isDark 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    
  const riskColorHex = data ? getHexColor(data.risk.color) : "#94a3b8";
  const radius = data ? getRadius(data.risk.color) : 2000;
  const zoomLevel = 11; // Fixed zoom

  return (
    <MapContainer 
      center={[lat, lng]} 
      zoom={zoomLevel} 
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url={tileUrl} />
      <Recenter lat={lat} lng={lng} />

      {data && (
        <Circle
          center={[lat, lng]}
          radius={radius}
          pathOptions={{ 
            color: riskColorHex, 
            fillColor: riskColorHex, 
            fillOpacity: 0.2,
            weight: 2
          }}
        />
      )}

      <Marker position={[lat, lng]} icon={customIcon}>
        {data && (
          <Popup className="rounded-lg">
            <div className="flex flex-col gap-1 min-w-[150px] p-0.5 font-sans">
              <div className="font-semibold text-sm text-slate-800">{locationName}</div>
              <div className="text-xs font-medium flex justify-between items-center mt-1 border-b border-slate-100 pb-1">
                 <span className="text-slate-500">{t?.dashboard?.riskLevel || "Risk Level"}: </span>
                 <span className="capitalize font-bold" style={{ color: riskColorHex }}>
                   {data.risk.category === 'Low' && t?.dashboard?.riskLow || 
                    data.risk.category === 'Moderate' && t?.dashboard?.riskModerate || 
                    data.risk.category === 'High' && t?.dashboard?.riskHigh || 
                    data.risk.category === 'Severe' && t?.dashboard?.riskSevere || 
                    data.risk.category} ({data.risk.score}/100)
                 </span>
              </div>
              <div className="text-[11px] text-slate-600 mt-1 leading-tight">
                {data.risk.category === 'Low' && t?.dashboard?.advLow || 
                 data.risk.category === 'Moderate' && t?.dashboard?.advModerate || 
                 data.risk.category === 'High' && t?.dashboard?.advHigh || 
                 data.risk.category === 'Severe' && t?.dashboard?.advSevere || 
                 data.risk.advisory}
              </div>
              <div className="text-[9px] text-slate-400 mt-2 text-right">
                {t?.dashboard?.updatedAt || "Updated"}: {new Date(data.lastUpdated + "Z").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </Popup>
        )}
      </Marker>
    </MapContainer>
  );
}
