"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { BreedingSiteType } from "@/lib/report/breeding-sites";
import type { Municipality } from "@/lib/report/location";
import type { PreparedPhoto } from "@/lib/report/photo";
import type { SubmitAttempt } from "@/lib/report/submit";

export type DraftPosition = { lon: number; lat: number; accuracy: number };

/**
 * Rascunho do relato só em memória (nada de foto em localStorage). Some num
 * reload; cada passo redireciona para a foto se faltar o pré-requisito.
 */
export type ReportDraft = {
  photo: PreparedPhoto | null;
  photoUrl: string | null;
  position: DraftPosition | null;
  municipality: Municipality | null;
  type: BreedingSiteType | null;
  description: string;
  /** Tentativa anterior que falhou por rede: reusada para não duplicar. */
  attempt: SubmitAttempt | null;
  /** Preenchido só depois da confirmação do servidor. */
  reportId: string | null;
};

const EMPTY: ReportDraft = {
  photo: null,
  photoUrl: null,
  position: null,
  municipality: null,
  type: null,
  description: "",
  attempt: null,
  reportId: null,
};

type DraftContext = {
  draft: ReportDraft;
  setPhoto(photo: PreparedPhoto): void;
  setLocation(position: DraftPosition, municipality: Municipality): void;
  setType(type: BreedingSiteType): void;
  setDescription(description: string): void;
  setAttempt(attempt: SubmitAttempt | null): void;
  complete(reportId: string): void;
  reset(): void;
};

const Context = createContext<DraftContext | null>(null);

export function ReportDraftProvider({
  children,
  initial,
}: {
  children: ReactNode;
  /** Só para testes. */
  initial?: Partial<ReportDraft>;
}) {
  const [draft, setDraft] = useState<ReportDraft>({ ...EMPTY, ...initial });
  const urlRef = useRef<string | null>(draft.photoUrl);

  const replaceUrl = useCallback((next: string | null) => {
    if (urlRef.current && urlRef.current !== next) URL.revokeObjectURL(urlRef.current);
    urlRef.current = next;
  }, []);

  // Libera o object URL da foto ao sair do fluxo.
  useEffect(() => () => replaceUrl(null), [replaceUrl]);

  const value = useMemo<DraftContext>(
    () => ({
      draft,
      setPhoto(photo) {
        const url = URL.createObjectURL(photo.blob);
        replaceUrl(url);
        // Foto nova = tentativa nova (nome de arquivo novo).
        setDraft((d) => ({ ...d, photo, photoUrl: url, attempt: null, reportId: null }));
      },
      setLocation(position, municipality) {
        setDraft((d) => ({ ...d, position, municipality }));
      },
      setType(type) {
        setDraft((d) => ({ ...d, type }));
      },
      setDescription(description) {
        setDraft((d) => ({ ...d, description }));
      },
      setAttempt(attempt) {
        setDraft((d) => ({ ...d, attempt }));
      },
      complete(reportId) {
        replaceUrl(null);
        setDraft({ ...EMPTY, reportId });
      },
      reset() {
        replaceUrl(null);
        setDraft(EMPTY);
      },
    }),
    [draft, replaceUrl],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useReportDraft(): DraftContext {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useReportDraft fora de ReportDraftProvider");
  return ctx;
}
