"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { markerIcon, DEFAULT_MAP_CENTER } from "@/components/grupos/leaflet-icon";
import { MapResizeFix } from "@/components/grupos/map-resize-fix";

export type MapGroupPoint = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  region: string | null;
};

export function GroupsMap({ groups }: { groups: MapGroupPoint[] }) {
  const center = useMemo<[number, number]>(() => {
    if (groups.length === 0) return DEFAULT_MAP_CENTER;
    const avgLat = groups.reduce((sum, g) => sum + g.latitude, 0) / groups.length;
    const avgLng = groups.reduce((sum, g) => sum + g.longitude, 0) / groups.length;
    return [avgLat, avgLng];
  }, [groups]);

  return (
    <MapContainer center={center} zoom={10} scrollWheelZoom className="h-full w-full">
      <MapResizeFix />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {groups.map((g) => (
        <Marker key={g.id} position={[g.latitude, g.longitude]} icon={markerIcon}>
          <Popup>
            <p className="font-medium">{g.name}</p>
            {g.region && <p className="text-sm">{g.region}</p>}
            <Link href={`/cafes/localizacao/${g.id}`} className="text-sm text-primary underline">
              Ver / editar localização
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
