"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Leaflet's default marker icons break under bundlers unless re-pointed
// at the CDN explicitly — standard workaround, not a code smell.
const campIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const alertIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: "hue-rotate-[300deg]", // rough visual differentiation from camp pins
});

type Camp = { id: string; name: string; type: string; latitude: number; longitude: number };
type AlertPin = { id: string; type: string; latitude: number | null; longitude: number | null };

export default function DispatchMap({ camps, alerts }: { camps: Camp[]; alerts: AlertPin[] }) {
  const center: [number, number] = camps.length
    ? [camps[0].latitude, camps[0].longitude]
    : [18.52, 73.85]; // Pune-ish fallback

  return (
    <MapContainer center={center} zoom={12} style={{ height: "70vh", width: "100%", borderRadius: "12px" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {camps.map((c) => (
        <Marker key={c.id} position={[c.latitude, c.longitude]} icon={campIcon}>
          <Popup>
            <strong>{c.name}</strong>
            <br />
            {c.type}
          </Popup>
        </Marker>
      ))}

      {alerts
        .filter((a) => a.latitude != null && a.longitude != null)
        .map((a) => (
          <Marker key={a.id} position={[a.latitude as number, a.longitude as number]} icon={alertIcon}>
            <Popup>
              <strong>{a.type}</strong>
              <br />
              Alert #{a.id.slice(0, 8)}
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}