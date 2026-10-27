"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { ArrowLeftIcon, CloseIcon } from "@/app/_components/icons";

import { useReportDraft } from "./report-draft";

const STEPS: Record<string, { step: number; back: string }> = {
  "/relatar/foto": { step: 1, back: "/" },
  "/relatar/local": { step: 2, back: "/relatar/foto" },
  "/relatar/tipo": { step: 3, back: "/relatar/local" },
};

export function StepHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { draft, reset } = useReportDraft();
  const current = STEPS[pathname];
  if (!current) return null;

  function close() {
    const hasData = Boolean(draft.photo || draft.position || draft.type);
    if (hasData && !window.confirm("Sair e descartar este relato?")) return;
    reset();
    router.push("/");
  }

  return (
    <header className="flex items-center justify-between gap-2 border-b border-line px-2 py-1">
      <Link
        href={current.back}
        className="inline-flex size-12 items-center justify-center rounded-full text-ink"
        aria-label="Voltar"
      >
        <ArrowLeftIcon />
      </Link>
      <p className="text-base font-bold text-ink-muted" aria-live="polite">
        Passo {current.step} de 3
      </p>
      <button
        type="button"
        onClick={close}
        className="inline-flex size-12 items-center justify-center rounded-full text-ink"
        aria-label="Cancelar relato"
      >
        <CloseIcon />
      </button>
    </header>
  );
}
