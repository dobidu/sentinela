import { describe, expect, it } from "vitest";

import {
  classifyRpcError,
  classifyStorageError,
  isAlreadyUploaded,
  MESSAGES,
} from "./errors";

// Mensagens fixas de submit_report (migration 20261001185320_report_write_path).
const rpc = (code: string, message: string) => ({ code, message });

describe("erros da RPC submit_report", () => {
  it("PT422 fora da área é distinto de validação e permanente", () => {
    const err = classifyRpcError(
      rpc("PT422", "relato: local fora dos municípios atendidos"),
    );

    expect(err.kind).toBe("outside_area");
    expect(err.retryable).toBe(false);
    expect(err.message).toBe(MESSAGES.outside_area);
  });

  it.each([
    ["relato: token do dispositivo inválido", "código do aparelho"],
    ["relato: coordenada inválida", "local"],
    ["relato: tipo de criadouro obrigatório", "o que você viu"],
    ["relato: caminho da foto inválido", "foto"],
    ["relato: descrição acima de 500 caracteres", "descrição"],
  ])("PT422 %s aponta o campo", (message, field) => {
    const err = classifyRpcError(rpc("PT422", message));

    expect(err.kind).toBe("invalid");
    expect(err.retryable).toBe(false);
    expect(err.message).toContain(field);
  });

  it("PT404 e PT409 são problemas de foto retentáveis", () => {
    expect(classifyRpcError(rpc("PT404", "x")).kind).toBe("photo_missing");
    expect(classifyRpcError(rpc("PT409", "x")).kind).toBe("photo_conflict");
    expect(classifyRpcError(rpc("PT404", "x")).retryable).toBe(true);
  });

  it("PT429 é limite retentável, sem prometer fila", () => {
    const err = classifyRpcError(
      rpc("PT429", "relato: limite de envios deste dispositivo atingido; tente mais tarde"),
    );

    expect(err.kind).toBe("rate_limited");
    expect(err.retryable).toBe(true);
    expect(err.message).not.toMatch(/salvo/);
  });

  it("falha de fetch (status 0) vira erro de rede", () => {
    const err = classifyRpcError(
      { code: "", message: "TypeError: Failed to fetch" },
      0,
    );

    expect(err.kind).toBe("network");
  });

  it("nenhuma mensagem expõe código técnico", () => {
    for (const code of ["PT422", "PT404", "PT409", "PT429", "XX000"]) {
      expect(classifyRpcError(rpc(code, "relato: x")).message).not.toMatch(
        /PT\d|XX|relato:/,
      );
    }
  });
});

describe("erros do Storage", () => {
  it("objeto já existente conta como enviado", () => {
    expect(isAlreadyUploaded({ status: 409, message: "The resource already exists" })).toBe(true);
    expect(isAlreadyUploaded({ status: 400, code: "ResourceAlreadyExists" })).toBe(true);
    // Resposta real do Storage local (2026-10-22).
    expect(isAlreadyUploaded({ status: 400, statusCode: "409", code: "KeyAlreadyExists" })).toBe(true);
    expect(isAlreadyUploaded({ status: 403, message: "new row violates row-level security policy" })).toBe(false);
  });

  it("classifica rede, teto de upload e foto inválida", () => {
    expect(classifyStorageError({ name: "StorageUnknownError", message: "Failed to fetch" }).kind).toBe("network");
    expect(classifyStorageError({ status: 403, message: "rls" }).kind).toBe("rate_limited");
    expect(classifyStorageError({ status: 413, message: "too large" }).kind).toBe("invalid");
    expect(classifyStorageError({ status: 500, message: "boom" }).kind).toBe("unknown");
  });
});
