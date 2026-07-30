import { supabase } from "@/integrations/supabase/client";
import type { NovoVocabulario } from "./types";

export async function listVocabulario() {
  const { data, error } = await supabase
    .from("vocabulario")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createVocabulario(input: NovoVocabulario) {
  const { error } = await supabase.from("vocabulario").insert(input);
  if (error) throw error;
}

export async function deleteVocabulario(id: string) {
  const { error } = await supabase.from("vocabulario").delete().eq("id", id);
  if (error) throw error;
}
