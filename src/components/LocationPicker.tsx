"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";

export type Focus = { lat: number; lng: number; id: number };

type Props = {
  lat: number;
  lng: number;
  focus?: Focus | null;
  onChange: (lat: number, lng: number) => void;
};

function ClickHandler({ onChange }: { onChange: Props["onChange"] }) {
  useMapEvents({
    click: (e) => onChange(+e.latlng.lat.toFixed(2), +e.latlng.lng.toFixed(2)),
  });
  return null;
}

// Flies to a searched place; map clicks don't move the view
function FlyTo({ focus }: { focus?: Focus | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lng], 10, { duration: 1.2 });
  }, [focus, map]);
  return null;
}

export default function LocationPicker({ lat, lng, focus, onChange }: Props) {
  return (
    <MapContainer
      center={[37.2, -119.5]}
      zoom={5}
      minZoom={5}
      maxBounds={[
        [32.3, -124.6],
        [42.1, -114],
      ]}
      className="z-0 h-80 w-full"
    >
      {/* Quiet, light basemap */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <CircleMarker
        center={[lat, lng]}
        radius={10}
        pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#a8844f", fillOpacity: 1 }}
      />
      <ClickHandler onChange={onChange} />
      <FlyTo focus={focus} />
    </MapContainer>
  );
}
