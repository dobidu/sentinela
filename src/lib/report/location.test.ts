import { describe, expect, it } from "vitest";

import type { SentinelaClient } from "@/lib/supabase/client";

import { getPosition, resolveMunicipality } from "./location";

const ERR = { PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 };

function geolocationReturning(
  outcome: { coords: { longitude: number; latitude: number; accuracy: number } } | { code: number },
) {
  return {
    getCurrentPosition(ok: PositionCallback, fail: PositionErrorCallback) {
      if ("coords" in outcome) ok(outcome as unknown as GeolocationPosition);
      else fail({ ...ERR, code: outcome.code, message: "" } as GeolocationPositionError);
    },
  } as unknown as Geolocation;
}

describe("getPosition", () => {
  it("devolve lon, lat e precisão", async () => {
    const geo = geolocationReturning({ coords: { longitude: -34.86, latitude: -7.11, accuracy: 12 } });

    expect(await getPosition(geo)).toEqual({ ok: true, lon: -34.86, lat: -7.11, accuracy: 12 });
  });

  it.each([
    [ERR.PERMISSION_DENIED, "denied"],
    [ERR.POSITION_UNAVAILABLE, "unavailable"],
    [ERR.TIMEOUT, "timeout"],
  ])("normaliza o erro %i como %s", async (code, reason) => {
    expect(await getPosition(geolocationReturning({ code }))).toEqual({ ok: false, reason });
  });

  it("sem geolocalização no navegador", async () => {
    expect(await getPosition(undefined)).toEqual({ ok: false, reason: "unsupported" });
  });
});

describe("resolveMunicipality", () => {
  const client = (reply: { data: unknown; error: unknown; status: number }) =>
    ({ rpc: async () => reply }) as unknown as SentinelaClient;

  it("devolve o município do ponto", async () => {
    const result = await resolveMunicipality(-34.86, -7.11, client({ data: [{ id: "m1", name: "João Pessoa" }], error: null, status: 200 }));

    expect(result).toEqual({ ok: true, municipality: { id: "m1", name: "João Pessoa" } });
  });

  it("devolve null fora da área", async () => {
    const result = await resolveMunicipality(-34.9, -8.05, client({ data: [], error: null, status: 200 }));

    expect(result).toEqual({ ok: true, municipality: null });
  });

  it("sem Supabase configurado não faz request", async () => {
    const result = await resolveMunicipality(-34.86, -7.11, null);

    expect(result.ok === false && result.error.kind).toBe("not_configured");
  });

  it("erro de rede vira kind network", async () => {
    const result = await resolveMunicipality(-34.86, -7.11, client({ data: null, error: { code: "", message: "TypeError: Failed to fetch" }, status: 0 }));

    expect(result.ok === false && result.error.kind).toBe("network");
  });
});
