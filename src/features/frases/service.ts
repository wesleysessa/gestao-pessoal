import { supabase } from "@/integrations/supabase/client";
import type { Frase, NovaFrase } from "./types";

export async function listFrases() {
  const { data, error } = await supabase
    .from("frases")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createFrase(input: NovaFrase) {
  const { error } = await supabase.from("frases").insert(input);
  if (error) throw error;
}

export async function updateFrase(id: string, input: NovaFrase) {
  const { error } = await supabase.from("frases").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteFrase(id: string) {
  const { error } = await supabase.from("frases").delete().eq("id", id);
  if (error) throw error;
}

/** Escolhe uma frase "aleatória", mas estável ao longo do dia (mesma semente = mesma frase até virar o dia). */
export function fraseDoDia(frases: Frase[], dataISO: string): Frase | null {
  if (frases.length === 0) return null;
  const seed = Number(dataISO.replaceAll("-", ""));
  const indice = seed % frases.length;
  return frases[indice];
}
