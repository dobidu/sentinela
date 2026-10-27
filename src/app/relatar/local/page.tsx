"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AlertIcon, CrosshairIcon, ShieldIcon } from "@/app/_components/icons";
import { Button, Card, ErrorMessage, Notice, PrivacyLink } from "@/app/_components/ui";
import { MESSAGES } from "@/lib/report/errors";
import {
  getPosition,
  GOOD_ACCURACY_M,
  resolveMunicipality,
  type Municipality,
  type PositionFailure,
} from "@/lib/report/location";
import { isSupabaseConfigured } from "@/lib/supabase/client";

import { useReportDraft, type DraftPosition } from "../report-draft";

const POSITION_MESSAGES: Record<PositionFailure, string> = {
  denied:
    "Sem permissão de localização. Libere a localização para este site nas configurações do navegador e toque de novo. Em breve dará para marcar o ponto no mapa.",
  unavailable:
    "Não conseguimos achar sua localização. Ligue o GPS do celular e tente de novo.",
  timeout:
    "A localização demorou demais. Tente de novo, de preferência ao ar livre.",
  unsupported:
    "Este navegador não informa a localização. Em breve dará para marcar o ponto no mapa.",
};

type Status =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "resolving"; position: DraftPosition }
  | { kind: "located"; position: DraftPosition; municipality: Municipality | null }
  | { kind: "error"; message: string };

// Passo 2 de 3 (spec §6.4 / P-03), sem mapa: o pin fixo chega no 02-03.
export default function LocationStep() {
  const router = useRouter();
  const { draft, setLocation } = useReportDraft();
  const configured = isSupabaseConfigured();
  const [status, setStatus] = useState<Status>(() =>
    draft.position && draft.municipality
      ? { kind: "located", position: draft.position, municipality: draft.municipality }
      : { kind: "idle" },
  );

  useEffect(() => {
    if (!draft.photo) router.replace("/relatar/foto");
  }, [draft.photo, router]);

  async function locate() {
    setStatus({ kind: "locating" });
    const result = await getPosition();
    if (!result.ok) {
      setStatus({ kind: "error", message: POSITION_MESSAGES[result.reason] });
      return;
    }
    const position = { lon: result.lon, lat: result.lat, accuracy: result.accuracy };
    setStatus({ kind: "resolving", position });
    const resolved = await resolveMunicipality(position.lon, position.lat);
    if (!resolved.ok) {
      setStatus({ kind: "error", message: resolved.error.message });
      return;
    }
    setStatus({ kind: "located", position, municipality: resolved.municipality });
  }

  function confirm() {
    if (status.kind !== "located" || !status.municipality) return;
    setLocation(status.position, status.municipality);
    router.push("/relatar/tipo");
  }

  const busy = status.kind === "locating" || status.kind === "resolving";
  const located = status.kind === "located" ? status : null;
  const imprecise = located !== null && located.position.accuracy > GOOD_ACCURACY_M;
  const canConfirm = configured && located?.municipality != null;
  const disabledReason = !configured
    ? MESSAGES.not_configured
    : located && !located.municipality
      ? null // a mensagem de fora da área já aparece acima
      : !located
        ? "Use sua localização para continuar."
        : null;

  return (
    <>
      <h1 className="text-[1.75rem] leading-tight font-bold">Onde está o foco?</h1>

      <Notice icon={<CrosshairIcon />}>
        Usamos sua localização só para marcar o foco no mapa.
      </Notice>

      <Button
        variant={located ? "secondary" : "primary"}
        onClick={locate}
        disabled={!configured || busy}
        aria-busy={busy}
      >
        <CrosshairIcon />
        {busy ? "Localizando…" : located ? "Atualizar localização" : "Usar minha localização"}
      </Button>

      {status.kind === "error" && <ErrorMessage>{status.message}</ErrorMessage>}

      {located && (
        <div aria-live="polite" className="flex flex-col gap-3">
          {located.municipality ? (
            <Card>
              <p className="text-xl font-bold">📍 {located.municipality.name}</p>
              <p className="text-base text-ink-muted">
                Precisão de cerca de {Math.round(located.position.accuracy)} m
              </p>
            </Card>
          ) : (
            <ErrorMessage>{MESSAGES.outside_area}</ErrorMessage>
          )}
          {imprecise && (
            <Notice tone="atencao" icon={<AlertIcon />}>
              A localização está imprecisa. Se puder, vá para um lugar aberto e toque em
              Atualizar localização.
            </Notice>
          )}
        </div>
      )}

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
