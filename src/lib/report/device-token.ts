// Código aleatório que identifica só o aparelho (anti-spam). O banco guarda
// apenas o hash SHA-256; o token nunca é logado nem mostrado.

export const DEVICE_TOKEN_KEY = "sentinela.device-token";

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

type TokenStorage = Pick<Storage, "getItem" | "setItem">;

// Fallback quando localStorage não existe ou lança (modo privado, cookies bloqueados).
let sessionToken: string | null = null;

function defaultStorage(): TokenStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function isUuidV4(value: string): boolean {
  return UUID_V4.test(value);
}

export function getDeviceToken(
  storage: TokenStorage | null = defaultStorage(),
): string {
  try {
    const stored = storage?.getItem(DEVICE_TOKEN_KEY);
    if (stored && isUuidV4(stored)) return stored;
    const token = crypto.randomUUID();
    storage?.setItem(DEVICE_TOKEN_KEY, token);
    if (storage) return token;
  } catch {
    // cai no token de sessão
  }
  sessionToken ??= crypto.randomUUID();
  return sessionToken;
}

/** Só para testes. */
export function resetSessionToken(): void {
  sessionToken = null;
}
