import { supabase } from "@/integrations/supabase/client";

/**
 * Processa os dias pendentes (desde o último processado até ontem) e devolve
 * o estado atualizado da streak. Idempotente — seguro chamar toda vez que a
 * Home carrega.
 */
export async function syncStreak() {
  const { data, error } = await supabase.rpc("sync_streak");
  if (error) throw error;
  return data;
}
