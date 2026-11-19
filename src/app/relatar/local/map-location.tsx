"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  AlertIcon,
  CrosshairIcon,
  MinusIcon,
  PlusIcon,
  ShieldIcon,
} from "@/app/_components/icons";
import { Button, Card, ErrorMessage, Notice, PrivacyLink } from "@/app/_components/ui";
import { registerPmtiles } from "@/lib/map/protocol";
import {
  circlePolygon,
  INITIAL_CENTER,
  isInServiceArea,
  MAP_MAX_BOUNDS,
  samePoint,
  type Point,
} from "@/lib/map/service-area";
import { BASEMAP_SOURCE, buildStyle } from "@/lib/map/style";
import { MESSAGES } from "@/lib/report/errors";
import {
  getPosition,
  GOOD_ACCURACY_M,
  resolveMunicipality,
  type Municipality,
  type PositionFailure,
} from "@/lib/report/location";
import { isSupabaseConfigured } from "@/lib/supabase/client";

import { useReportDraft } from "../report-draft";

const RESOLVE_DEBOUNCE_MS = 400;
const INITIAL_ZOOM = 11;
const POINT_ZOOM = 17;
const ACCURACY_SOURCE = "gps-accuracy";

const GPS_MESSAGES: Record<PositionFailure, string> = {
  denied:
    "Sem permissão de localização. Arraste o mapa até o ponto do foco, ou libere a localização nas configurações do navegador.",
  unavailable:
    "Não conseguimos achar sua localização. Arraste o mapa até o ponto do foco.",
  timeout: "A localização demorou demais. Arraste o mapa até o ponto do foco.",
  unsupported: "Este navegador não informa a localização. Arraste o mapa até o ponto do foco.",
};

const OFFLINE_MESSAGE =
  "Sem internet o mapa não carrega, mas o GPS funciona. Confirme o ponto do GPS ou volte mais tarde.";

/** Município resolvido para um ponto exato: o par confirmado é sempre este. */
type Resolution =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "resolved"; point: Point; municipality: Municipality | null }
  | { kind: "error"; message: string };

type Gps = { point: Point; accuracy: number };

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function prefersDark(): boolean {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

function toPoint(lngLat: { lng: number; lat: number }): Point {
  return { lon: lngLat.lng, lat: lngLat.lat };
}

export default function MapLocation({ onUnavailable }: { onUnavailable(): void }) {
  const router = useRouter();
  const { draft, setLocation } = useReportDraft();
  const configured = isSupabaseConfigured();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const requestRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const gpsRef = useRef<Gps | null>(null);
  // Sem gesto da pessoa (ou ponto já confirmado), não há ponto escolhido.
  const touchedRef = useRef(Boolean(draft.position));

  const [center, setCenter] = useState<Point | null>(null);
  const [moving, setMoving] = useState(false);
  const [touched, setTouched] = useState(Boolean(draft.position));
  const [resolution, setResolution] = useState<Resolution>({ kind: "idle" });
  const [gps, setGps] = useState<Gps | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "locating">("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);
  // Componente só de cliente (ssr: false): navigator existe.
  const [offline, setOffline] = useState(() => !navigator.onLine);

  const markTouched = useCallback(() => {
    touchedRef.current = true;
    setTouched(true);
  }, []);

  /** Mapa parado num ponto: decide área no cliente e resolve o município. */
  const settle = useCallback((point: Point) => {
    setCenter(point);
    setMoving(false);
    clearTimeout(timerRef.current);
    if (!touchedRef.current) return;
    if (!isInServiceArea(point)) {
      requestRef.current++;
      setResolution({ kind: "resolved", point, municipality: null });
      return;
    }
    setResolution({ kind: "pending" });
    timerRef.current = setTimeout(async () => {
      const id = ++requestRef.current;
      const result = await resolveMunicipality(point.lon, point.lat);
      if (id !== requestRef.current) return; // centro mudou: resposta velha
      setResolution(
        result.ok
          ? { kind: "resolved", point, municipality: result.municipality }
          : { kind: "error", message: result.error.message },
      );
    }, RESOLVE_DEBOUNCE_MS);
  }, []);

  const moveTo = useCallback((point: Point, zoom?: number) => {
    const map = mapRef.current;
    if (!map) return;
    const current = toPoint(map.getCenter());
    if (samePoint(current, point) && (zoom === undefined || map.getZoom() === zoom)) {
      settle(point); // não haverá moveend
      return;
    }
    const target = { center: [point.lon, point.lat] as [number, number], zoom };
    if (prefersReducedMotion()) map.jumpTo(target);
    else map.easeTo({ ...target, duration: 250 });
  }, [settle]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let map: MapLibreMap;
    let theme: "light" | "dark" = "light";
    try {
      registerPmtiles(maplibregl);
      const start = draft.position;
      theme = prefersDark() ? "dark" : "light";
      map = new maplibregl.Map({
        container,
        style: buildStyle(theme, window.location.origin),
        center: start ? [start.lon, start.lat] : INITIAL_CENTER,
        zoom: start ? POINT_ZOOM : INITIAL_ZOOM,
        minZoom: 10,
        maxZoom: 19,
        maxBounds: MAP_MAX_BOUNDS,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        attributionControl: { compact: false },
        locale: { "Map.Title": "Mapa: arraste ou toque para posicionar o pin" },
      });
    } catch {
      onUnavailable();
      return;
    }
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();

    // --agua do tema (spec §5.2): o círculo de precisão segue a cor de marca.
    const agua = theme === "dark" ? "#7cc4d2" : "#0f4c5c";
    map.on("load", () => {
      map.addSource(ACCURACY_SOURCE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: `${ACCURACY_SOURCE}-fill`,
        type: "fill",
        source: ACCURACY_SOURCE,
        paint: { "fill-color": agua, "fill-opacity": 0.15 },
      });
      map.addLayer({
        id: `${ACCURACY_SOURCE}-line`,
        type: "line",
        source: ACCURACY_SOURCE,
        paint: { "line-color": agua, "line-width": 1.5 },
      });
      settle(toPoint(map.getCenter()));
    });
    map.on("movestart", (e) => {
      if ((e as { originalEvent?: unknown }).originalEvent) markTouched();
      requestRef.current++; // invalida resposta em voo
      clearTimeout(timerRef.current);
      setMoving(true);
    });
    map.on("moveend", () => settle(toPoint(map.getCenter())));
    map.on("click", (e) => {
      markTouched();
      moveTo(toPoint(e.lngLat));
    });
    map.on("error", (e) => {
      const source = (e as { sourceId?: string }).sourceId;
      // Só erro do basemap indica falta de rede; o resto (ex.: worker) não.
      if (source === BASEMAP_SOURCE) setOffline(true);
    });
    map.on("webglcontextlost", () => onUnavailable());

    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      map.remove();
      mapRef.current = null;
    };
    // Monta uma vez; o ponto inicial vem do rascunho no momento da montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function locate() {
    setGpsError(null);
    setGpsStatus("locating");
    const result = await getPosition();
    setGpsStatus("idle");
    if (!result.ok) {
      setGpsError(GPS_MESSAGES[result.reason]);
      return;
    }
    const point = { lon: result.lon, lat: result.lat };
    if (!isInServiceArea(point)) {
      setGpsError(MESSAGES.outside_area);
      return;
    }
    const fix = { point, accuracy: result.accuracy };
    gpsRef.current = fix;
    setGps(fix);
    const source = mapRef.current?.getSource<GeoJSONSource>(ACCURACY_SOURCE);
    source?.setData(circlePolygon(point, result.accuracy));
    markTouched();
    moveTo(point, Math.max(mapRef.current?.getZoom() ?? POINT_ZOOM, POINT_ZOOM));
  }

  function zoom(delta: 1 | -1) {
    const map = mapRef.current;
    if (!map) return;
    const options = { animate: !prefersReducedMotion() };
    if (delta > 0) map.zoomIn(options);
    else map.zoomOut(options);
  }

  const resolved =
    resolution.kind === "resolved" && center && samePoint(resolution.point, center)
      ? resolution
      : null;
  const canConfirm = configured && touched && !moving && resolved?.municipality != null;
  const atGps = gps && center ? samePoint(gps.point, center) : false;
  const imprecise = atGps && gps!.accuracy > GOOD_ACCURACY_M;

  function confirm() {
    if (!canConfirm || !resolved?.municipality) return;
    const accuracy =
      gpsRef.current && samePoint(gpsRef.current.point, resolved.point)
        ? gpsRef.current.accuracy
        : null;
    setLocation({ ...resolved.point, accuracy }, resolved.municipality);
    router.push("/relatar/tipo");
  }

  const disabledReason = !configured
    ? MESSAGES.not_configured
    : !touched
      ? "Arraste o mapa até o ponto do foco ou use sua localização."
      : null;

  const locating = gpsStatus === "locating";

  return (
    <>
      <div className="relative">
        <div
          ref={containerRef}
          className="h-[55svh] min-h-72 overflow-hidden rounded-[var(--radius-card)] border-[1.5px] border-ink/12 bg-paper"
        />
        {/* Pin fixo: a ponta marca o centro do mapa. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 32 44"
          width="32"
          height="44"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full text-terracota drop-shadow"
        >
          <path
            d="M16 43C16 43 2 26 2 16a14 14 0 0 1 28 0c0 10-14 27-14 27Z"
            fill="currentColor"
            stroke="#fffdf8"
            strokeWidth="2"
          />
          <circle cx="16" cy="16" r="5" fill="#fffdf8" />
        </svg>
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => zoom(1)}
            aria-label="Aproximar"
            className="flex size-12 items-center justify-center rounded-[var(--radius-button)] border-[1.5px] border-ink/12 bg-surface text-ink"
          >
            <PlusIcon />
          </button>
          <button
            type="button"
            onClick={() => zoom(-1)}
            aria-label="Afastar"
            className="flex size-12 items-center justify-center rounded-[var(--radius-button)] border-[1.5px] border-ink/12 bg-surface text-ink"
          >
            <MinusIcon />
          </button>
        </div>
      </div>

      <Button
        variant="secondary"
        onClick={locate}
        disabled={locating}
        aria-busy={locating}
      >
        <CrosshairIcon />
        {locating ? "Localizando…" : "Usar minha localização"}
      </Button>
      <Notice icon={<CrosshairIcon />}>
        Usamos sua localização só para marcar o foco no mapa.
      </Notice>

      {gpsError && <ErrorMessage>{gpsError}</ErrorMessage>}
      {offline && (
        <Notice tone="atencao" icon={<AlertIcon />}>
          {OFFLINE_MESSAGE}
        </Notice>
      )}

      <div aria-live="polite" className="flex flex-col gap-3">
        {touched && (moving || resolution.kind === "pending") && (
          <p className="text-base text-ink-muted">Conferindo o local…</p>
        )}
        {!moving && resolved?.municipality && (
          <Card>
            <p className="text-xl font-bold">📍 {resolved.municipality.name}</p>
            {atGps && gps && (
              <p className="text-base text-ink-muted">
                Precisão do GPS de cerca de {Math.round(gps.accuracy)} m
              </p>
            )}
          </Card>
        )}
        {!moving && resolved && !resolved.municipality && (
          <ErrorMessage>{MESSAGES.outside_area}</ErrorMessage>
        )}
        {!moving && resolution.kind === "error" && (
          <ErrorMessage>{resolution.message}</ErrorMessage>
        )}
        {imprecise && (
          <Notice tone="atencao" icon={<AlertIcon />}>
            A localização está imprecisa. Arraste o mapa até o ponto certo.
          </Notice>
        )}
      </div>

      <Notice icon={<ShieldIcon />}>
        Sua localização exata fica visível só para a equipe de saúde. No mapa público,
        mostramos apenas áreas de ~100 m.
      </Notice>

      <div className="mt-auto flex flex-col gap-3">
        {disabledReason && (
          <p id="confirm-reason" className="text-base text-ink-muted">
            {disabledReason}
          </p>
        )}
        <Button
          onClick={confirm}
          disabled={!canConfirm}
          aria-describedby={disabledReason ? "confirm-reason" : undefined}
        >
          Confirmar local
        </Button>
        <PrivacyLink />
      </div>
    </>
  );
}
