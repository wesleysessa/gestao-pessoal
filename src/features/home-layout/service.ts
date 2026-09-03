import { supabase } from "@/integrations/supabase/client";

/**
 * Objeto rota -> posição salva pelo usuário (módulo sem chave usa a ordem
 * padrão do código). Usa objeto simples (não Map) porque essa query fica
 * no cache persistido em localStorage (ver __root.tsx) — um Map vira "{}"
 * ao passar por JSON.stringify/parse e quebra a tela ao reabrir o app.
 */
export async function listPosicoesHome(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("modulos_home").select("rota, posicao");
  if (error) throw error;
  const posicoes: Record<string, number> = {};
  for (const row of data ?? []) posicoes[row.rota] = row.posicao;
  return posicoes;
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
