"use client";

import { useRef } from "react";

import { CloseIcon } from "@/app/_components/icons";
import { RecognizeGuide } from "@/app/_components/recognize";

/**
 * "Não sei o tipo?" (P-04 → P-14) como folha sobreposta: navegar para
 * /como-reconhecer sairia de /relatar e perderia a foto do rascunho.
 * `showModal()` prende o foco; ao fechar, o foco volta para o gatilho.
 */
export function RecognizeDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex min-h-12 items-center self-start text-base text-agua underline underline-offset-4"
      >
        Não sei o tipo?
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="reconhecer-titulo"
        onClose={() => triggerRef.current?.focus()}
        onClick={(e) => {
          // Toque no fundo (fora da folha) fecha.
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
        className="m-0 mt-auto max-h-[85svh] w-full max-w-none overflow-y-auto rounded-t-[var(--radius-card)] bg-paper p-0 text-ink shadow-2xl backdrop:bg-ink/40 sm:m-auto sm:max-w-lg sm:rounded-[var(--radius-card)]"
      >
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 id="reconhecer-titulo" className="text-xl font-bold">
              Como reconhecer um foco
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-button)] text-ink"
            >
              <CloseIcon />
              <span className="sr-only">Fechar</span>
            </button>
          </div>
          <RecognizeGuide headingLevel={3} />
        </div>
      </dialog>
    </>
  );
}
