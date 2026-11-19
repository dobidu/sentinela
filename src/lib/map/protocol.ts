import type { addProtocol, setWorkerUrl } from "maplibre-gl";
import { Protocol } from "pmtiles";

let registered = false;

/**
 * Prepara o MapLibre uma vez só (idempotente entre montagens): worker servido
 * pela própria origem e protocolo `pmtiles://`. O MapLibre 6 procura o worker
 * ao lado do próprio módulo, o que não existe depois do bundle.
 */
export function registerPmtiles(lib: {
  addProtocol: typeof addProtocol;
  setWorkerUrl: typeof setWorkerUrl;
}): void {
  if (registered) return;
  lib.setWorkerUrl(
    new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href,
  );
  const protocol = new Protocol();
  lib.addProtocol("pmtiles", protocol.tile);
  registered = true;
}

/** Sem WebGL o mapa não roda: a tela cai no fluxo só com GPS. */
export function hasWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
