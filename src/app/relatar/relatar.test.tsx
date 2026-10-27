import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PreparedPhoto } from "@/lib/report/photo";

import LocationStep from "./local/page";
import { ReportDraftProvider, type ReportDraft } from "./report-draft";
import TypeStep from "./tipo/page";

const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/relatar/tipo",
}));

const submitReport = vi.fn();
vi.mock("@/lib/report/submit", () => ({
  submitReport: (...args: unknown[]) => submitReport(...args),
}));

const location = vi.hoisted(() => ({
  getPosition: vi.fn(),
  resolveMunicipality: vi.fn(),
}));
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

const ready: Partial<ReportDraft> = {
  photo,
  photoUrl: "blob:test",
  position: { lon: -34.8641, lat: -7.1195, accuracy: 10 },
  municipality: { id: "m1", name: "João Pessoa" },
};

function renderWith(ui: ReactNode, initial: Partial<ReportDraft>) {
  return render(<ReportDraftProvider initial={initial}>{ui}</ReportDraftProvider>);
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  globalThis.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("passo 3: tipo + enviar", () => {
  it("mostra os 8 tipos como grupo de rádio e bloqueia o envio sem tipo", () => {
    renderWith(<TypeStep />, ready);

    expect(screen.getByRole("heading", { level: 1, name: "O que você viu?" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(8);
    expect(screen.getByRole("button", { name: "Enviar relato" })).toBeDisabled();
    expect(screen.getByText("Escolha o que você viu")).toBeInTheDocument();
  });

  it("duplo toque em Enviar chama o envio uma vez só", async () => {
    let resolve!: (value: unknown) => void;
    submitReport.mockReturnValue(new Promise((r) => (resolve = r)));
    renderWith(<TypeStep />, ready);

    fireEvent.click(screen.getByRole("radio", { name: /pneu/i }));
    const button = screen.getByRole("button", { name: "Enviar relato" });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(submitReport).toHaveBeenCalledTimes(1);
    await act(async () => resolve({ ok: true, reportId: "r1" }));
    expect(router.push).toHaveBeenCalledWith("/relatar/pronto");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("erro de rede guarda a tentativa e oferece Tentar de novo com ela", async () => {
    const attempt = { photoPath: "aaaaaaaa-aaaa-4aaa-8aaa-000000000001.webp", uploaded: true };
    submitReport.mockResolvedValueOnce({
      ok: false,
      error: { kind: "network", retryable: true, message: "Sem conexão com a internet." },
      attempt,
    });
    renderWith(<TypeStep />, { ...ready, type: "pneu" });

    fireEvent.click(screen.getByRole("button", { name: "Enviar relato" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sem conexão");

    submitReport.mockResolvedValueOnce({ ok: true, reportId: "r1" });
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    await waitFor(() => expect(submitReport).toHaveBeenCalledTimes(2));
    expect(submitReport.mock.calls[1][1]).toEqual({ attempt });
  });

  it("sem Supabase configurado avisa e não envia", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    renderWith(<TypeStep />, { ...ready, type: "pneu" });

    expect(screen.getByText("Envio desativado neste ambiente de teste.")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Enviar relato" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(submitReport).not.toHaveBeenCalled();
  });

  it("sem foto no rascunho volta para o passo 1", () => {
    renderWith(<TypeStep />, {});

    expect(router.replace).toHaveBeenCalledWith("/relatar/foto");
  });
});

describe("passo 2: local", () => {
  it("fora da área mostra a mensagem e desabilita Confirmar local", async () => {
    location.getPosition.mockResolvedValue({ ok: true, lon: -34.9, lat: -8.05, accuracy: 12 });
    location.resolveMunicipality.mockResolvedValue({ ok: true, municipality: null });
    renderWith(<LocationStep />, { photo, photoUrl: "blob:test" });

    fireEvent.click(screen.getByRole("button", { name: "Usar minha localização" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ainda não atendemos esse local. O Sentinela funciona em João Pessoa e Cabedelo.",
    );
    expect(screen.getByRole("button", { name: "Confirmar local" })).toBeDisabled();
  });

  it("GPS negado explica como liberar", async () => {
    location.getPosition.mockResolvedValue({ ok: false, reason: "denied" });
    renderWith(<LocationStep />, { photo, photoUrl: "blob:test" });

    fireEvent.click(screen.getByRole("button", { name: "Usar minha localização" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Libere a localização");
    expect(location.resolveMunicipality).not.toHaveBeenCalled();
  });

  it("precisão ruim avisa, mas deixa confirmar em João Pessoa", async () => {
    location.getPosition.mockResolvedValue({ ok: true, lon: -34.86, lat: -7.11, accuracy: 120 });
    location.resolveMunicipality.mockResolvedValue({
      ok: true,
      municipality: { id: "m1", name: "João Pessoa" },
    });
    renderWith(<LocationStep />, { photo, photoUrl: "blob:test" });

    fireEvent.click(screen.getByRole("button", { name: "Usar minha localização" }));

    expect(await screen.findByText(/está imprecisa/)).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Confirmar local" });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(router.push).toHaveBeenCalledWith("/relatar/tipo");
  });
});
