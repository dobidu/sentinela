"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BreedingSiteIcon, CheckIcon } from "@/app/_components/icons";
import { Button, Card, ErrorMessage, PrivacyLink } from "@/app/_components/ui";
import { BREEDING_SITES, breedingSiteLabel } from "@/lib/report/breeding-sites";
import { MESSAGES, type ReportError } from "@/lib/report/errors";
import { submitReport } from "@/lib/report/submit";
import { isSupabaseConfigured } from "@/lib/supabase/client";

import { useReportDraft } from "../report-draft";

const MAX_DESCRIPTION = 500;

// Passo 3 de 3 (spec §6.5 / P-04).
export default function TypeStep() {
  const router = useRouter();
  const { draft, setType, setDescription, setAttempt, complete } = useReportDraft();
  const configured = isSupabaseConfigured();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<ReportError | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    // Depois do envio o rascunho é limpo e a navegação vai para /relatar/pronto.
    if (draft.reportId) return;
    if (!draft.photo) router.replace("/relatar/foto");
    else if (!draft.position || !draft.municipality) router.replace("/relatar/local");
  }, [draft.reportId, draft.photo, draft.position, draft.municipality, router]);

  async function send() {
    // Duplo toque: só a primeira chamada passa.
    if (inFlight.current) return;
    if (!draft.photo || !draft.position || !draft.type) return;
    inFlight.current = true;
    setSending(true);
    setError(null);
    try {
      const result = await submitReport(
        {
          photo: draft.photo,
          lon: draft.position.lon,
          lat: draft.position.lat,
          type: draft.type,
          description: draft.description,
        },
        { attempt: draft.attempt ?? undefined },
      );
      if (result.ok) {
        complete(result.reportId);
        router.push("/relatar/pronto");
        return;
      }
      setAttempt(result.attempt);
      setError(result.error);
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  const canSend = configured && Boolean(draft.type) && !sending;
  const hint = !configured ? MESSAGES.not_configured : !draft.type ? "Escolha o que você viu" : null;

  return (
    <>
      <h1 className="text-[1.75rem] leading-tight font-bold">O que você viu?</h1>

      <fieldset disabled={sending} aria-busy={sending} className="flex flex-col gap-5">
        <legend className="sr-only">Tipo de foco</legend>
        <div className="grid grid-cols-2 gap-3">
          {BREEDING_SITES.map((site) => {
            const selected = draft.type === site.value;
            return (
              <label
                key={site.value}
                className={`relative flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] bg-surface p-3 text-center text-base font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-agua ${
                  selected ? "border-[3px] border-agua" : "border-[1.5px] border-ink/12"
                }`}
              >
                <input
                  type="radio"
                  name="breeding_site_type"
                  value={site.value}
                  checked={selected}
                  onChange={() => setType(site.value)}
                  className="sr-only"
                />
                {selected && (
                  <CheckIcon className="absolute top-2 right-2 text-agua" aria-hidden="true" />
                )}
                <BreedingSiteIcon type={site.value} width={32} height={32} />
                {site.label}
              </label>
            );
          })}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-base font-bold">
            Quer contar mais alguma coisa? (opcional)
          </label>
          <p id="description-hint" className="text-base text-ink-muted">
            Não escreva nomes, telefones ou endereço completo.
          </p>
          <textarea
            id="description"
            rows={3}
            maxLength={MAX_DESCRIPTION}
            value={draft.description}
            onChange={(e) => setDescription(e.target.value)}
            aria-describedby="description-hint description-count"
            className="rounded-[var(--radius-card)] border-[1.5px] border-ink/20 bg-surface p-3 text-lg"
          />
          <p id="description-count" className="text-right text-base text-ink-muted">
            {draft.description.length}/{MAX_DESCRIPTION}
          </p>
        </div>

        <Card className="flex items-center gap-3">
          {draft.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- object URL local
            <img
              src={draft.photoUrl}
              alt=""
              className="size-16 shrink-0 rounded-lg object-cover"
            />
          )}
          <ul className="flex-1 text-base" aria-label="Resumo do relato">
            <li className="flex justify-between gap-2">
              <span>Foto</span>
              <Link href="/relatar/foto" className="inline-flex min-h-12 min-w-12 items-center justify-end text-agua underline">
                alterar<span className="sr-only"> foto</span>
              </Link>
            </li>
            <li className="flex justify-between gap-2">
              <span>📍 {draft.municipality?.name}</span>
              <Link href="/relatar/local" className="inline-flex min-h-12 min-w-12 items-center justify-end text-agua underline">
                alterar<span className="sr-only"> local</span>
              </Link>
            </li>
            <li>{draft.type ? breedingSiteLabel(draft.type) : "Tipo ainda não escolhido"}</li>
          </ul>
        </Card>
      </fieldset>

      {error && (
        <ErrorMessage>
          {error.message}
          {error.kind === "outside_area" && (
            <>
              {" "}
              <Link href="/relatar/local" className="underline">
                Voltar ao local
              </Link>
            </>
          )}
        </ErrorMessage>
      )}

      <div className="mt-auto flex flex-col gap-3">
        {hint && (
          <p id="send-hint" className="text-base text-ink-muted">
            {hint}
          </p>
        )}
        <Button
          onClick={send}
          disabled={!canSend}
          aria-describedby={hint ? "send-hint" : undefined}
        >
          {sending ? "Enviando…" : error?.retryable ? "Tentar de novo" : "Enviar relato"}
        </Button>
        <PrivacyLink />
      </div>
    </>
  );
}
