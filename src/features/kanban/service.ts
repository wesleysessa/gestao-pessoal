import { supabase } from "@/integrations/supabase/client";
import type { ColunaKanban, NovoCartaoKanban } from "./types";

export async function listCartoes() {
  const { data, error } = await supabase
    .from("kanban_cartoes")
    .select("*")
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

/** Cartão novo entra no fim da coluna escolhida. */
export async function createCartao(input: NovoCartaoKanban, ordem: number) {
  const agora = new Date().toISOString();
  const { error } = await supabase.from("kanban_cartoes").insert({
    ...input,
    ordem,
    movido_em: agora,
    concluido_em: input.coluna === "concluido" ? agora : null,
  });
  if (error) throw error;
}

export async function updateCartao(id: string, input: NovoCartaoKanban) {
  const { error } = await supabase
    .from("kanban_cartoes")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Leva o cartão pra outra coluna (no fim dela). Marca/desmarca a data de
 * conclusão conforme entra ou sai de "Concluído".
 */
export async function moverCartao(id: string, coluna: ColunaKanban, ordem: number) {
  const agora = new Date().toISOString();
  const { error } = await supabase
    .from("kanban_cartoes")
    .update({
      coluna,
      ordem,
      movido_em: agora,
      concluido_em: coluna === "concluido" ? agora : null,
      updated_at: agora,
    })
    .eq("id", id);
  if (error) throw error;
}

/** Regrava a ordem de uma coluna inteira (lista de ids já na ordem desejada). */
export async function reordenarColuna(ids: string[]) {
  await Promise.all(
    ids.map(async (id, ordem) => {
      const { error } = await supabase.from("kanban_cartoes").update({ ordem }).eq("id", id);
      if (error) throw error;
    }),
  );
}

export async function deleteCartao(id: string) {
  const { error } = await supabase.from("kanban_cartoes").delete().eq("id", id);
  if (error) throw error;
}
