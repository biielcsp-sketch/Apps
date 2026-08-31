"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import type { LeafletMouseEvent, Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { markerIcon, DEFAULT_MAP_CENTER } from "@/components/grupos/leaflet-icon";
import { Button } from "@/components/ui/Button";
import { updateGroupLocationAction, clearGroupLocationAction } from "@/app/actions/group-location";

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function GroupLocationEditor({
  groupId,
  initialLatitude,
  initialLongitude,
}: {
  groupId: string;
  initialLatitude: number | null;
  initialLongitude: number | null;
}) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLatitude != null && initialLongitude != null ? [initialLatitude, initialLongitude] : null,
  );
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    if (!position) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    const result = await updateGroupLocationAction(groupId, position[0], position[1]);
    setSaving(false);
    if (result?.error) setError(result.error);
    else setSuccess(true);
  }

  async function handleRemove() {
    setRemoving(true);
    setError(null);
    setSuccess(false);
    const result = await clearGroupLocationAction(groupId);
    setRemoving(false);
    if (result?.error) setError(result.error);
    else setPosition(null);
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setError("Seu navegador não suporta geolocalização.");
      return;
    }
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => setError("Não foi possível obter sua localização atual."),
    );
  }

  const center = position ?? DEFAULT_MAP_CENTER;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Clique no mapa para marcar o local de encontro deste café, ou arraste o pino depois de
        colocado.
      </p>

      <div className="h-[360px] overflow-hidden rounded-2xl border border-border">
        <MapContainer center={center} zoom={position ? 15 : 10} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={(lat, lng) => setPosition([lat, lng])} />
          {position && (
            <Marker
              position={position}
              icon={markerIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target as LeafletMarker;
                  const latlng = marker.getLatLng();
                  setPosition([latlng.lat, latlng.lng]);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {position ? `Lat ${position[0].toFixed(6)}, Lng ${position[1].toFixed(6)}` : "Nenhuma localização definida ainda."}
        </span>
        <Button type="button" variant="secondary" onClick={handleUseMyLocation}>
          Usar minha localização atual
        </Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {success && <p className="text-sm text-primary">Localização salva.</p>}

      <div className="flex gap-2">
        <Button type="button" onClick={handleSave} disabled={!position || saving}>
          {saving ? "Salvando..." : "Salvar localização"}
        </Button>
        {position && (
          <Button type="button" variant="secondary" onClick={handleRemove} disabled={removing}>
            {removing ? "Removendo..." : "Remover localização"}
          </Button>
        )}
      </div>
    </div>
  );
}
