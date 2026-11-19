/**
 * Área atendida pelo Sentinela no MVP: João Pessoa + Cabedelo.
 * Extremos da malha IBGE embutida em `20261001185320_report_write_path.sql`.
 * O município exato continua vindo do RPC `resolve_municipality`; este bbox só
 * evita chamar o servidor quando o ponto está claramente fora.
 */
export const SERVICE_BOUNDS = {
  west: -34.9726,
  south: -7.2458,
  east: -34.7932,
  north: -6.9624,
} as const;

/** Limite de navegação do mapa = recorte do PMTiles (scripts/map/build-basemap.sh). */
export const MAP_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-35.0, -7.28],
  [-34.76, -6.93],
];

export const INITIAL_CENTER: [number, number] = [
  (SERVICE_BOUNDS.west + SERVICE_BOUNDS.east) / 2,
  (SERVICE_BOUNDS.south + SERVICE_BOUNDS.north) / 2,
];

export type Point = { lon: number; lat: number };

export function isInServiceArea({ lon, lat }: Point): boolean {
  return (
    lon >= SERVICE_BOUNDS.west &&
    lon <= SERVICE_BOUNDS.east &&
    lat >= SERVICE_BOUNDS.south &&
    lat <= SERVICE_BOUNDS.north
  );
}

/** Mesmo ponto para efeito de confirmação (~10 cm no equador). */
export function samePoint(a: Point, b: Point): boolean {
  return Math.abs(a.lon - b.lon) < 1e-6 && Math.abs(a.lat - b.lat) < 1e-6;
}

const EARTH_RADIUS_M = 6_371_008.8;

/** Polígono GeoJSON aproximando um círculo de `radiusM` metros (precisão do GPS). */
export type Polygon = { type: "Polygon"; coordinates: [number, number][][] };

export function circlePolygon(center: Point, radiusM: number, steps = 64): Polygon {
  const lat0 = (center.lat * Math.PI) / 180;
  const dLat = (radiusM / EARTH_RADIUS_M) * (180 / Math.PI);
  const dLon = dLat / Math.cos(lat0);
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (2 * Math.PI * (i % steps)) / steps;
    ring.push([center.lon + dLon * Math.cos(t), center.lat + dLat * Math.sin(t)]);
  }
  return { type: "Polygon", coordinates: [ring] };
}
