import { supabase } from "@/integrations/supabase/client";

/** Mapa rota -> posição salva pelo usuário (módulo sem linha usa a ordem padrão do código). */
export async function listPosicoesHome() {
  const { data, error } = await supabase.from("modulos_home").select("rota, posicao");
  if (error) throw error;
  const map = new Map<string, number>();
  for (const row of data ?? []) map.set(row.rota, row.posicao);
  return map;
}

/** Grava a ordem inteira de uma vez (a lista de rotas já na ordem desejada). */
export async function salvarOrdemHome(rotasEmOrdem: string[]) {
  const linhas = rotasEmOrdem.map((rota, posicao) => ({
    rota,
    posicao,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from("modulos_home")
    .upsert(linhas, { onConflict: "user_id,rota" });
  if (error) throw error;
}
