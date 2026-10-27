import { afterEach, describe, expect, it } from "vitest";

import {
  DEVICE_TOKEN_KEY,
  getDeviceToken,
  isUuidV4,
  resetSessionToken,
} from "./device-token";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    data,
  };
}

afterEach(() => resetSessionToken());

describe("token do aparelho", () => {
  it("gera um UUID v4 e persiste", () => {
    const storage = memoryStorage();
    const token = getDeviceToken(storage);

    expect(isUuidV4(token)).toBe(true);
    expect(storage.data.get(DEVICE_TOKEN_KEY)).toBe(token);
  });

  it("reaproveita o token salvo", () => {
    const storage = memoryStorage();
    const first = getDeviceToken(storage);

    expect(getDeviceToken(storage)).toBe(first);
  });

  it("troca um valor salvo que não é UUID v4", () => {
    const storage = memoryStorage({ [DEVICE_TOKEN_KEY]: "nao-e-uuid" });
    const token = getDeviceToken(storage);

    expect(isUuidV4(token)).toBe(true);
    expect(storage.data.get(DEVICE_TOKEN_KEY)).toBe(token);
  });

  it("usa token de sessão estável quando localStorage lança", () => {
    const broken = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("SecurityError");
      },
    };
    const first = getDeviceToken(broken);

    expect(isUuidV4(first)).toBe(true);
    expect(getDeviceToken(broken)).toBe(first);
  });

  it("usa token de sessão sem storage", () => {
    const first = getDeviceToken(null);

    expect(getDeviceToken(null)).toBe(first);
  });
});
