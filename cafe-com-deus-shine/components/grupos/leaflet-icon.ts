import L from "leaflet";

// Os ícones padrão do Leaflet apontam pra caminhos relativos que o
// bundler não resolve — servindo do CDN oficial em vez de tentar
// importar os PNGs (evita ficar refém de como cada bundler resolve
// asset import).
export const markerIcon = L.icon({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const DEFAULT_MAP_CENTER: [number, number] = [-23.5505, -46.6333];
