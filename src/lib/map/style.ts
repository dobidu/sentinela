import { layers, namedFlavor, type Flavor } from "@protomaps/basemaps";
import type { StyleSpecification } from "maplibre-gl";

import { BASEMAP_FILE } from "./basemap-file";

export const BASEMAP_SOURCE = "protomaps";
export const ATTRIBUTION = "© OpenStreetMap";

const FONTS = {
  regular: "Noto Sans Regular",
  bold: "Noto Sans Medium",
  italic: "Noto Sans Italic",
} as const;

/**
 * Basemap dessaturado, em tons de papel (spec §6.4): o pin e, na fase 4, o
 * risco dominam. Sem POIs (menos ruído, sem sprites externos).
 */
const PAPER_LIGHT: Partial<Flavor> = {
  background: "#efe9dc",
  earth: "#f7f3ea",
  water: "#c9d6d8",
  park_a: "#e6e6d3",
  park_b: "#e6e6d3",
  wood_a: "#e3e4d0",
  wood_b: "#e3e4d0",
  scrub_a: "#ebe8d8",
  scrub_b: "#ebe8d8",
  sand: "#efe7d2",
  beach: "#efe7d2",
  buildings: "#e4ddcf",
  hospital: "#efe3dc",
  school: "#ece6d6",
  industrial: "#ebe6dc",
  pedestrian: "#f1ece1",
  aerodrome: "#e9e4d8",
  runway: "#ddd6c7",
  minor_a: "#fffdf8",
  minor_b: "#fffdf8",
  minor_service: "#fbf8f1",
  other: "#fbf8f1",
  link: "#fffdf8",
  major: "#fffdf8",
  highway: "#fffdf8",
  minor_casing: "#d9d2c3",
  minor_service_casing: "#d9d2c3",
  link_casing: "#cfc7b6",
  major_casing_early: "#cfc7b6",
  major_casing_late: "#cfc7b6",
  highway_casing_early: "#c4bba8",
  highway_casing_late: "#c4bba8",
  boundaries: "#a79e8b",
  roads_label_minor: "#4a5058",
  roads_label_minor_halo: "#f7f3ea",
  roads_label_major: "#4a5058",
  roads_label_major_halo: "#f7f3ea",
  ocean_label: "#5d7378",
  subplace_label: "#4a5058",
  subplace_label_halo: "#f7f3ea",
  city_label: "#1b1f23",
  city_label_halo: "#f7f3ea",
  state_label: "#4a5058",
  state_label_halo: "#f7f3ea",
  country_label: "#4a5058",
  address_label: "#4a5058",
  address_label_halo: "#f7f3ea",
};

const PAPER_DARK: Partial<Flavor> = {
  background: "#0e1315",
  earth: "#121719",
  water: "#0f2a30",
  park_a: "#16201d",
  park_b: "#16201d",
  wood_a: "#151f1b",
  wood_b: "#151f1b",
  scrub_a: "#161d1c",
  scrub_b: "#161d1c",
  sand: "#1c1f1c",
  beach: "#1c1f1c",
  buildings: "#1d2528",
  minor_a: "#2a3539",
  minor_b: "#2a3539",
  minor_service: "#232d31",
  other: "#232d31",
  link: "#2e3a3e",
  major: "#334146",
  highway: "#3a494e",
  roads_label_minor: "#a9b0b6",
  roads_label_minor_halo: "#121719",
  roads_label_major: "#a9b0b6",
  roads_label_major_halo: "#121719",
  subplace_label: "#a9b0b6",
  subplace_label_halo: "#121719",
  city_label: "#ece6da",
  city_label_halo: "#121719",
  address_label: "#a9b0b6",
  address_label_halo: "#121719",
};

export type MapTheme = "light" | "dark";

export function paperFlavor(theme: MapTheme): Flavor {
  const base = namedFlavor(theme === "dark" ? "dark" : "light");
  const flavor: Flavor = {
    ...base,
    ...(theme === "dark" ? PAPER_DARK : PAPER_LIGHT),
    ...FONTS,
  };
  delete flavor.pois;
  return flavor;
}

/**
 * Estilo MapLibre só com URLs da própria origem: PMTiles e glifos em
 * `public/map/`. `origin` é `window.location.origin` (MapLibre exige URL absoluta).
 */
export function buildStyle(theme: MapTheme, origin: string): StyleSpecification {
  return {
    version: 8,
    glyphs: `${origin}/map/fonts/{fontstack}/{range}.pbf`,
    sources: {
      [BASEMAP_SOURCE]: {
        type: "vector",
        url: `pmtiles://${origin}${BASEMAP_FILE}`,
        attribution: ATTRIBUTION,
      },
    },
    layers: layers(BASEMAP_SOURCE, paperFlavor(theme), { lang: "pt" }),
  };
}
