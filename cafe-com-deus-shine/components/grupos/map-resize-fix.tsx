"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

// O Leaflet calcula o tamanho do mapa a partir do contêiner no
// momento em que ele nasce. Dentro de layouts flex/abas o contêiner
// às vezes ainda não tem a altura final nesse instante, e o mapa fica
// cortado ou com os tiles fora de posição até a janela ser
// redimensionada. Força um recálculo logo depois de montar.
export function MapResizeFix() {
  const map = useMap();

  useEffect(() => {
    const timeout = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(timeout);
  }, [map]);

  return null;
}
