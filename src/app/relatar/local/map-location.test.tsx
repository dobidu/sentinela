import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PreparedPhoto } from "@/lib/report/photo";

import { ReportDraftProvider, useReportDraft, type ReportDraft } from "../report-draft";
import MapLocation from "./map-location";

// MapLibre falso: guarda o centro e emite os eventos que o componente escuta.
const maps = vi.hoisted(() => ({ instances: [] as FakeMapLike[], failNext: false }));
type Handler = (e?: unknown) => void;
type FakeMapLike = {
  center: { lng: number; lat: number };
  zoom: number;
  handlers: Record<string, Handler[]>;
  emit(name: string, e?: unknown): void;
  drag(lon: number, lat: number): void;
  easeTo: ReturnType<typeof vi.fn>;
  jumpTo: ReturnType<typeof vi.fn>;
  setData: ReturnType<typeof vi.fn>;
};

vi.mock("maplibre-gl", () => {
  class FakeMap implements FakeMapLike {
    center: { lng: number; lat: number };
    zoom: number;
    handlers: Record<string, Handler[]> = {};
    setData = vi.fn();
    touchZoomRotate = { disableRotation: vi.fn() };
    keyboard = { disableRotation: vi.fn() };
    easeTo = vi.fn((o: { center: [number, number]; zoom?: number }) => this.move(o));
    jumpTo = vi.fn((o: { center: [number, number]; zoom?: number }) => this.move(o));
    constructor(opts: { center: [number, number]; zoom: number }) {
      if (maps.failNext) {
        maps.failNext = false;
        throw new Error("WebGL indisponível");
      }
      this.center = { lng: opts.center[0], lat: opts.center[1] };
      this.zoom = opts.zoom;
      maps.instances.push(this);
    }
    private move(o: { center: [number, number]; zoom?: number }) {
      this.emit("movestart", {});
      this.center = { lng: o.center[0], lat: o.center[1] };
      if (o.zoom !== undefined) this.zoom = o.zoom;
      this.emit("moveend");
    }
    on(name: string, h: Handler) {
      (this.handlers[name] ??= []).push(h);
      return this;
    }
    emit(name: string, e?: unknown) {
      for (const h of this.handlers[name] ?? []) h(e);
    }
    drag(lon: number, lat: number) {
      this.emit("movestart", { originalEvent: {} });
      this.center = { lng: lon, lat };
      this.emit("moveend");
    }
    getCenter() {
      return this.center;
    }
    getZoom() {
      return this.zoom;
    }
    zoomIn = vi.fn();
    zoomOut = vi.fn();
    addSource() {}
    addLayer() {}
    getSource() {
      return { setData: this.setData };
    }
    remove() {}
  }
  return { Map: FakeMap, addProtocol: vi.fn(), setWorkerUrl: vi.fn() };
});

const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const location = vi.hoisted(() => ({ getPosition: vi.fn(), resolveMunicipality: vi.fn() }));
vi.mock("@/lib/report/location", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/report/location")>()),
  getPosition: location.getPosition,
  resolveMunicipality: location.resolveMunicipality,
}));

const photo: PreparedPhoto = {
  blob: new Blob(["x"], { type: "image/webp" }),
  ext: "webp",
  contentType: "image/webp",
  width: 1600,
  height: 1200,
};

const JP = { id: "m1", name: "João Pessoa" };
const seen: { draft: ReportDraft | null } = { draft: null };
function Probe() {
  const { draft } = useReportDraft();
  useEffect(() => {
    seen.draft = draft;
  }, [draft]);
  return null;
}

function renderMap(initial: Partial<ReportDraft> = { photo, photoUrl: "blob:test" }) {
  const onUnavailable = vi.fn();
  render(
    <ReportDraftProvider initial={initial}>
      <MapLocation onUnavailable={onUnavailable} />
      <Probe />
    </ReportDraftProvider>,
  );
  const map = maps.instances.at(-1)!;
  act(() => map?.emit("load"));
  return { map, onUnavailable };
}

const confirmButton = () => screen.getByRole("button", { name: "Confirmar local" });

async function flushDebounce() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  globalThis.URL.revokeObjectURL = vi.fn();
  maps.instances.length = 0;
  seen.draft = null;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("passo 2 com mapa: pin fixo", () => {
  it("não pede GPS ao abrir e exige um gesto antes de confirmar", async () => {
    renderMap();
    await flushDebounce();

    expect(location.getPosition).not.toHaveBeenCalled();
    expect(location.resolveMunicipality).not.toHaveBeenCalled();
    expect(confirmButton()).toBeDisabled();
    expect(
      screen.getByText("Arraste o mapa até o ponto do foco ou use sua localização."),
    ).toBeInTheDocument();
  });

  it("arrastar resolve o município do centro e confirma esse ponto sem precisão", async () => {
    location.resolveMunicipality.mockResolvedValue({ ok: true, municipality: JP });
    const { map } = renderMap();

    act(() => map.drag(-34.87, -7.12));
    expect(confirmButton()).toBeDisabled(); // ainda resolvendo
    await flushDebounce();

    expect(location.resolveMunicipality).toHaveBeenCalledTimes(1);
    expect(location.resolveMunicipality).toHaveBeenCalledWith(-34.87, -7.12);
    expect(screen.getByText(/João Pessoa/)).toBeInTheDocument();
    fireEvent.click(confirmButton());

    expect(seen.draft?.position).toEqual({ lon: -34.87, lat: -7.12, accuracy: null });
    expect(seen.draft?.municipality).toEqual(JP);
    expect(router.push).toHaveBeenCalledWith("/relatar/tipo");
  });

  it("descarta a resposta de um centro antigo", async () => {
    let resolveA!: (v: unknown) => void;
    location.resolveMunicipality
      .mockReturnValueOnce(new Promise((r) => (resolveA = r)))
      .mockResolvedValueOnce({ ok: true, municipality: { id: "m2", name: "Cabedelo" } });
    const { map } = renderMap();

    act(() => map.drag(-34.87, -7.12));
    await flushDebounce(); // pedido A em voo
    act(() => map.drag(-34.83, -6.98)); // pessoa mexe de novo
    await act(async () => resolveA({ ok: true, municipality: JP }));

    expect(screen.queryByText(/João Pessoa/)).not.toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();

    await flushDebounce();
    expect(screen.getByText(/Cabedelo/)).toBeInTheDocument();
    fireEvent.click(confirmButton());
    expect(seen.draft?.position).toMatchObject({ lon: -34.83, lat: -6.98 });
    expect(seen.draft?.municipality?.name).toBe("Cabedelo");
  });

  it("fora da área avisa sem chamar o servidor", async () => {
    const { map } = renderMap();

    act(() => map.drag(-34.77, -7.27));
    await flushDebounce();

    expect(location.resolveMunicipality).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ainda não atendemos esse local. O Sentinela funciona em João Pessoa e Cabedelo.",
    );
    expect(confirmButton()).toBeDisabled();
  });

  it("GPS centraliza o mapa, mostra a precisão e confirma com ela", async () => {
    location.getPosition.mockResolvedValue({ ok: true, lon: -34.86, lat: -7.11, accuracy: 80 });
    location.resolveMunicipality.mockResolvedValue({ ok: true, municipality: JP });
    const { map } = renderMap();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Usar minha localização" }));
    });
    expect(map.easeTo.mock.calls.length + map.jumpTo.mock.calls.length).toBe(1);
    expect(map.setData).toHaveBeenCalledTimes(1);
    await flushDebounce();

    expect(screen.getByText("Precisão do GPS de cerca de 80 m")).toBeInTheDocument();
    expect(
      screen.getByText("A localização está imprecisa. Arraste o mapa até o ponto certo."),
    ).toBeInTheDocument();
    fireEvent.click(confirmButton());
    expect(seen.draft?.position).toEqual({ lon: -34.86, lat: -7.11, accuracy: 80 });
  });

  it("GPS negado orienta a arrastar o mapa", async () => {
    location.getPosition.mockResolvedValue({ ok: false, reason: "denied" });
    renderMap();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Usar minha localização" }));
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Arraste o mapa até o ponto do foco");
  });

  it("um toque no mapa centraliza naquele ponto (alternativa a arrastar)", async () => {
    location.resolveMunicipality.mockResolvedValue({ ok: true, municipality: JP });
    const { map } = renderMap();

    act(() => map.emit("click", { lngLat: { lng: -34.85, lat: -7.13 } }));
    await flushDebounce();

    expect(map.center).toEqual({ lng: -34.85, lat: -7.13 });
    expect(confirmButton()).toBeEnabled();
  });

  it("basemap sem carregar mostra o aviso de sem internet", () => {
    const { map } = renderMap();

    act(() => map.emit("error", { sourceId: "protomaps", error: new Error("Failed to fetch") }));

    expect(screen.getByText(/Sem internet o mapa não carrega/)).toBeInTheDocument();
  });

  it("falha ao criar o mapa cai no fluxo só com GPS", () => {
    maps.failNext = true;
    const onUnavailable = vi.fn();
    render(
      <ReportDraftProvider initial={{ photo, photoUrl: "blob:test" }}>
        <MapLocation onUnavailable={onUnavailable} />
      </ReportDraftProvider>,
    );

    expect(onUnavailable).toHaveBeenCalledTimes(1);
  });

  it("volta do passo 3 com o ponto já confirmado", async () => {
    location.resolveMunicipality.mockResolvedValue({ ok: true, municipality: JP });
    const { map } = renderMap({
      photo,
      photoUrl: "blob:test",
      position: { lon: -34.86, lat: -7.11, accuracy: null },
      municipality: JP,
    });
    await flushDebounce();

    expect(map.center).toEqual({ lng: -34.86, lat: -7.11 });
    expect(confirmButton()).toBeEnabled();
  });
});
