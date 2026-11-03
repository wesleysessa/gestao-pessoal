import { supabase } from "@/integrations/supabase/client";
import type { NovoEventoLinha, NovoPeriodo } from "./types";

export async function listPeriodos() {
  const { data, error } = await supabase
    .from("linha_periodos")
    .select("*")
    .order("inicio", { ascending: true, nullsFirst: true });
  if (error) throw error;
  return data;
}

export async function createPeriodo(input: NovoPeriodo) {
  const { error } = await supabase.from("linha_periodos").insert(input);
  if (error) throw error;
}

export async function updatePeriodo(id: string, input: NovoPeriodo) {
  const { error } = await supabase.from("linha_periodos").update(input).eq("id", id);
  if (error) throw error;
}

/** Fases que estavam dentro dela sobem um nível (pai_id vira nulo); fatos não são apagados. */
export async function deletePeriodo(id: string) {
  const { error } = await supabase.from("linha_periodos").delete().eq("id", id);
  if (error) throw error;
}

export async function listEventosLinha() {
  const { data, error } = await supabase
    .from("linha_eventos")
    .select("*")
    .order("ano", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createEventoLinha(input: NovoEventoLinha) {
  const { error } = await supabase.from("linha_eventos").insert(input);
  if (error) throw error;
}

export async function updateEventoLinha(id: string, input: NovoEventoLinha) {
  const { error } = await supabase
    .from("linha_eventos")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteEventoLinha(id: string) {
  const { error } = await supabase.from("linha_eventos").delete().eq("id", id);
  if (error) throw error;
}
