import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

export type SentinelaClient = SupabaseClient<Database>;

let client: SentinelaClient | null = null;

// Acesso direto a process.env.NEXT_PUBLIC_*: o Next só inlina essa forma.
function readEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

/**
 * Sem as variáveis (CI, previews da Vercel) o app abre, mas não fala com o
 * Supabase: a UI mostra "Envio desativado neste ambiente de teste".
 */
export function isSupabaseConfigured(): boolean {
  const { url, key } = readEnv();
  return Boolean(url && key);
}

/**
 * Cliente anônimo, criado na primeira chamada (nunca no import, para o build
 * passar sem variáveis). Devolve null se o ambiente não estiver configurado.
 */
export function getClient(): SentinelaClient | null {
  if (client) return client;
  const { url, key } = readEnv();
  if (!url || !key) return null;
  client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
