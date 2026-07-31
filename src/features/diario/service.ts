import { supabase } from "@/integrations/supabase/client";
import type { NovaEntradaDiario } from "./types";

export async function listDiario() {
  const { data, error } = await supabase
    .from("diario")
    .select("*")
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createEntradaDiario(input: NovaEntradaDiario) {
  const { error } = await supabase.from("diario").insert(input);
  if (error) throw error;
}

export async function updateEntradaDiario(id: string, input: NovaEntradaDiario) {
  const { error } = await supabase.from("diario").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteEntradaDiario(id: string) {
  const { error } = await supabase.from("diario").delete().eq("id", id);
  if (error) throw error;
}
