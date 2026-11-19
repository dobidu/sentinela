"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { hasWebGL } from "@/lib/map/protocol";

import { useReportDraft } from "../report-draft";
import GpsLocation from "./gps-location";

// MapLibre (~250 KB gz) só baixa aqui, no passo 2 (spec §12).
const MapLocation = dynamic(() => import("./map-location"), {
  ssr: false,
  loading: () => (
    <div
      className="h-[55svh] min-h-72 animate-pulse rounded-[var(--radius-card)] border-[1.5px] border-ink/12 bg-surface"
      aria-hidden
    />
  ),
});

const noop = () => () => {};

// Passo 2 de 3 (spec §6.4 / P-03): mapa com pin fixo; sem WebGL, só GPS.
export default function LocationStep() {
  const router = useRouter();
  const { draft } = useReportDraft();
  const webgl = useSyncExternalStore(noop, hasWebGL, () => null);
  const [mapFailed, setMapFailed] = useState(false);

  useEffect(() => {
    if (!draft.photo) router.replace("/relatar/foto");
  }, [draft.photo, router]);

  return (
    <>
      <h1 className="text-[1.75rem] leading-tight font-bold">Onde está o foco?</h1>
      {webgl === null ? null : webgl && !mapFailed ? (
        <MapLocation onUnavailable={() => setMapFailed(true)} />
      ) : (
        <GpsLocation />
      )}
    </>
  );
}
