// Classifica erros do Storage e da RPC submit_report (contrato do 02-01, tabela
// no README) em mensagens para o cidadão (spec de UI/UX §6.8 e §11). Nenhum
// código técnico chega à mensagem.

export type ReportErrorKind =
  | "outside_area"
  | "invalid"
  | "photo_missing"
  | "photo_conflict"
  | "rate_limited"
  | "network"
  | "not_configured"
  | "unknown";

export class ReportError extends Error {
  constructor(
    readonly kind: ReportErrorKind,
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "ReportError";
  }
}

export const MESSAGES = {
  outside_area:
    "Ainda não atendemos esse local. O Sentinela funciona em João Pessoa e Cabedelo.",
  photo:
    "Não conseguimos enviar a foto. Tente de novo.",
  // Sem fila offline neste plano (02-04): não prometer que o relato ficou salvo.
  rate_limited:
    "Você já enviou muitos relatos agora. Tente de novo mais tarde.",
  network:
    "Sem conexão com a internet. Confira a rede e toque em Tentar de novo.",
  not_configured: "Envio desativado neste ambiente de teste.",
  unknown: "Algo deu errado do nosso lado. Tente de novo em instantes.",
} as const;

// Trechos fixos das mensagens PT422 de submit_report → campo para o cidadão.
const INVALID_FIELDS: ReadonlyArray<[string, string]> = [
  ["token", "código do aparelho"],
  ["coordenada", "local"],
  ["tipo", "o que você viu"],
  ["foto", "foto"],
  ["descrição", "descrição"],
];

export function invalidMessage(field: string): string {
  return `Algo no relato não está certo: ${field}. Corrija e envie de novo.`;
}

type RpcErrorLike = { code?: string | null; message?: string | null };

export function classifyRpcError(
  error: RpcErrorLike,
  status?: number,
): ReportError {
  const code = error.code ?? "";
  const message = error.message ?? "";

  switch (code) {
    case "PT422": {
      if (message.includes("fora dos municípios")) {
        return new ReportError("outside_area", MESSAGES.outside_area, false);
      }
      const field =
        INVALID_FIELDS.find(([needle]) => message.includes(needle))?.[1] ??
        "algum campo";
      return new ReportError("invalid", invalidMessage(field), false);
    }
    case "PT404":
      return new ReportError("photo_missing", MESSAGES.photo, true);
    case "PT409":
      return new ReportError("photo_conflict", MESSAGES.photo, true);
    case "PT429":
      return new ReportError("rate_limited", MESSAGES.rate_limited, true);
  }

  if (status === 0 || (!code && /fetch|network|abort/i.test(message))) {
    return new ReportError("network", MESSAGES.network, true);
  }
  return new ReportError("unknown", MESSAGES.unknown, true);
}

type StorageErrorLike = {
  status?: number;
  statusCode?: string;
  code?: string;
  message?: string;
  name?: string;
};

/** O objeto já existe: é o nosso upload anterior (nome UUID aleatório). */
export function isAlreadyUploaded(error: StorageErrorLike): boolean {
  return (
    error.status === 409 ||
    error.statusCode === "409" ||
    error.code === "ResourceAlreadyExists" ||
    error.code === "KeyAlreadyExists" ||
    /already exists|duplicate/i.test(error.message ?? "")
  );
}

export function classifyStorageError(error: StorageErrorLike): ReportError {
  if (error.status === undefined || error.name === "StorageUnknownError") {
    return new ReportError("network", MESSAGES.network, true);
  }
  // 403: a policy recusou; com nome válido, só sobra o teto de upload por hora.
  if (error.status === 403) {
    return new ReportError("rate_limited", MESSAGES.rate_limited, true);
  }
  if (error.status === 413 || error.status === 415 || error.status === 400) {
    return new ReportError("invalid", invalidMessage("foto"), false);
  }
  return new ReportError("unknown", MESSAGES.unknown, true);
}
