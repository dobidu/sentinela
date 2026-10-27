"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ButtonLink } from "@/app/_components/ui";

import { useReportDraft } from "../report-draft";

// Tela Pronto online (spec §6.6 / P-05). Só aparece depois da confirmação do
// servidor. Sem protocolo (v0.2) e sem convite de instalação (02-04).
export default function DoneStep() {
  const router = useRouter();
  const { draft } = useReportDraft();

  useEffect(() => {
    if (!draft.reportId) router.replace("/");
  }, [draft.reportId, router]);

  if (!draft.reportId) return null;

  return (
    <>
      <div className="flex justify-center pt-6">
        <span
          className="carimbo rounded-lg border-[3px] border-ok px-5 py-2 font-display text-3xl font-extrabold tracking-widest text-ok"
          aria-hidden="true"
        >
          RECEBIDO
        </span>
      </div>
      <h1 className="text-center text-[2.25rem] leading-tight font-bold">
        Obrigado! Seu relato chegou à vigilância.
      </h1>
      <p className="text-center">
        Se for seguro, vire o recipiente, tampe ou jogue a água fora. Isso já elimina o
        foco.
      </p>
      <div className="mt-auto flex flex-col gap-3">
        <ButtonLink href="/relatar/foto">Relatar outro foco</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Voltar ao início
        </ButtonLink>
      </div>
    </>
  );
}
