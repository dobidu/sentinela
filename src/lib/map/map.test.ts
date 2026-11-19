import { describe, expect, it } from "vitest";

import { BASEMAP_FILE } from "./basemap-file";
import {
  circlePolygon,
  INITIAL_CENTER,
  isInServiceArea,
  MAP_MAX_BOUNDS,
  samePoint,
  SERVICE_BOUNDS,
} from "./service-area";
import { buildStyle, paperFlavor } from "./style";

const ORIGIN = "https://sentinela.example";

function urlsIn(value: unknown): string[] {
  const found: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string" && /^[a-z]+:\/\//i.test(v)) found.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(value);
  return found;
}

describe("área de serviço", () => {
  it("João Pessoa e Cabedelo ficam dentro; Recife e Campina Grande, fora", () => {
    expect(isInServiceArea({ lon: -34.8641, lat: -7.1195 })).toBe(true); // JP centro
    expect(isInServiceArea({ lon: -34.8335, lat: -6.9811 })).toBe(true); // Cabedelo
    expect(isInServiceArea({ lon: -34.877, lat: -8.0476 })).toBe(false); // Recife
    expect(isInServiceArea({ lon: -35.8811, lat: -7.2307 })).toBe(false); // Campina Grande
  });

  it("o centro inicial está na área e o limite do mapa a contém", () => {
    expect(isInServiceArea({ lon: INITIAL_CENTER[0], lat: INITIAL_CENTER[1] })).toBe(true);
    const [[w, s], [e, n]] = MAP_MAX_BOUNDS;
    expect(w).toBeLessThan(SERVICE_BOUNDS.west);
    expect(s).toBeLessThan(SERVICE_BOUNDS.south);
    expect(e).toBeGreaterThan(SERVICE_BOUNDS.east);
    expect(n).toBeGreaterThan(SERVICE_BOUNDS.north);
  });

  it("samePoint tolera só ruído de ponto flutuante", () => {
    const p = { lon: -34.8641, lat: -7.1195 };
    expect(samePoint(p, { lon: p.lon + 1e-9, lat: p.lat - 1e-9 })).toBe(true);
    expect(samePoint(p, { lon: p.lon + 1e-5, lat: p.lat })).toBe(false);
  });

  it("círculo de precisão é um anel fechado com o raio pedido", () => {
    const c = { lon: -34.8641, lat: -7.1195 };
    const ring = circlePolygon(c, 100).coordinates[0];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    const dLatM = (ring[16][1] - c.lat) * 111_195; // ~1/4 de volta: norte
    expect(dLatM).toBeCloseTo(100, 0);
  });
});

describe("estilo do basemap", () => {
  it.each(["light", "dark"] as const)("tema %s só referencia a própria origem", (theme) => {
    const style = buildStyle(theme, ORIGIN);
    const urls = urlsIn(style);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url.startsWith(ORIGIN) || url.startsWith(`pmtiles://${ORIGIN}/`)).toBe(true);
    }
    expect(style.sources.protomaps).toMatchObject({
      url: `pmtiles://${ORIGIN}${BASEMAP_FILE}`,
      attribution: "© OpenStreetMap",
    });
  });

  it("arquivo do basemap tem a data no nome (cache imutável)", () => {
    expect(BASEMAP_FILE).toMatch(/^\/map\/jp-cabedelo-\d{8}\.pmtiles$/);
  });

  it("sem POIs (sem sprites externos) e com as fontes servidas em public/map/fonts", () => {
    const flavor = paperFlavor("light");
    expect(flavor.pois).toBeUndefined();
    const fonts = new Set(
      buildStyle("light", ORIGIN)
        .layers.flatMap((l) => {
          const f = (l as { layout?: { "text-font"?: unknown } }).layout?.["text-font"];
          return JSON.stringify(f ?? []).match(/Noto Sans [A-Za-z]+/g) ?? [];
        }),
    );
    for (const f of fonts) {
      expect(["Noto Sans Regular", "Noto Sans Medium", "Noto Sans Italic"]).toContain(f);
    }
    expect(buildStyle("light", ORIGIN).layers.some((l) => l.type === "symbol")).toBe(true);
  });
});
