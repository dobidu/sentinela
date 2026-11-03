import { getClient, type SentinelaClient } from "@/lib/supabase/client";

import { classifyRpcError, MESSAGES, ReportError } from "./errors";

/** Acima disso (metros) a tela pede para tentar de novo ao ar livre. */
export const GOOD_ACCURACY_M = 50;

export type PositionFailure = "denied" | "unavailable" | "timeout" | "unsupported";

export type PositionResult =
  | { ok: true; lon: number; lat: number; accuracy: number }
  | { ok: false; reason: PositionFailure };

/** Só chamar depois de um toque do usuário (spec §6.4: nunca ao carregar). */
export function getPosition(
  geolocation: Geolocation | undefined = typeof navigator === "undefined"
    ? undefined
    : navigator.geolocation,
): Promise<PositionResult> {
  if (!geolocation) return Promise.resolve({ ok: false, reason: "unsupported" });
  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          ok: true,
          lon: pos.coords.longitude,
          lat: pos.coords.latitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) =>
        resolve({
          ok: false,
          reason:
            err.code === err.PERMISSION_DENIED
              ? "denied"
              : err.code === err.TIMEOUT
                ? "timeout"
                : "unavailable",
        }),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  });
}

export type Municipality = { id: string; name: string };

export type MunicipalityResult =
  | { ok: true; municipality: Municipality | null }
  | { ok: false; error: ReportError };

export async function resolveMunicipality(
  lon: number,
  lat: number,
  client: SentinelaClient | null = getClient(),
): Promise<MunicipalityResult> {
  if (!client) {
    return {
      ok: false,
      error: new ReportError("not_configured", MESSAGES.not_configured, false),
    };
  }
  const { data, error, status } = await client.rpc("resolve_municipality", {
    p_lon: lon,
    p_lat: lat,
  });
  if (error) return { ok: false, error: classifyRpcError(error, status) };
  return { ok: true, municipality: data?.[0] ?? null };
}
