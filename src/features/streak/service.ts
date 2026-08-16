import { supabase } from "@/integrations/supabase/client";

/**
 * Processa os dias pendentes (desde o último processado até ontem) e devolve
 * o estado atualizado da streak. Idempotente — seguro chamar toda vez que a
 * Home carrega.
 *
 * Manda o fuso atual do celular (não um fixo) — assim viajar não quebra a
 * chama por causa de um dia fechado no fuso errado.
 */
export async function syncStreak() {
  const fuso = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { data, error } = await supabase.rpc("sync_streak", { fuso });
  if (error) throw error;
  return data;
}
