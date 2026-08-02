import { supabase } from "@/integrations/supabase/client";
import { hoje } from "@/lib/data";
import type { NovoVocabulario } from "./types";

export async function listVocabulario() {
  const { data, error } = await supabase
    .from("vocabulario")
    .select("*")
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** `data` é sempre o dia local de hoje — não deixamos o Postgres decidir (fuso UTC). */
export async function createVocabulario(input: NovoVocabulario) {
  const { error } = await supabase.from("vocabulario").insert({ ...input, data: hoje() });
  if (error) throw error;
}

export async function updateVocabulario(id: string, input: NovoVocabulario) {
  const { error } = await supabase.from("vocabulario").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteVocabulario(id: string) {
  const { error } = await supabase.from("vocabulario").delete().eq("id", id);
  if (error) throw error;
}
