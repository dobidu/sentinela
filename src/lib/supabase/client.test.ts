import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("cliente Supabase", () => {
  it("sem variáveis: importa sem lançar e não cria cliente", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    const mod = await import("./client");

    expect(mod.isSupabaseConfigured()).toBe(false);
    expect(mod.getClient()).toBeNull();
  });

  it("com variáveis: cria um singleton", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    const mod = await import("./client");

    expect(mod.isSupabaseConfigured()).toBe(true);
    const client = mod.getClient();
    expect(client).not.toBeNull();
    expect(mod.getClient()).toBe(client);
  });
});
