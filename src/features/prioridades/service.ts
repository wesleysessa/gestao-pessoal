import { supabase } from "@/integrations/supabase/client";
import type { NovaPrioridade } from "./types";

export async function listPrioridades() {
  const { data, error } = await supabase
    .from("prioridades")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createPrioridade(input: NovaPrioridade) {
  const { error } = await supabase.from("prioridades").insert(input);
  if (error) throw error;
}

export async function updatePrioridade(id: string, input: NovaPrioridade) {
  const { error } = await supabase.from("prioridades").update(input).eq("id", id);
  if (error) throw error;
}

export async function deletePrioridade(id: string) {
  const { error } = await supabase.from("prioridades").delete().eq("id", id);
  if (error) throw error;
}

export async function atualizarOrdemPrioridade(id: string, ordem: number) {
  const { error } = await supabase.from("prioridades").update({ ordem }).eq("id", id);
  if (error) throw error;
}
