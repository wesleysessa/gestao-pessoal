import { supabase } from "@/integrations/supabase/client";
import type { NovoLivro } from "./types";

export async function listLivros() {
  const { data, error } = await supabase
    .from("livros")
    .select("*")
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createLivro(input: NovoLivro) {
  const { error } = await supabase.from("livros").insert(input);
  if (error) throw error;
}

export async function updateLivro(id: string, input: NovoLivro) {
  const { error } = await supabase.from("livros").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteLivro(id: string) {
  const { error } = await supabase.from("livros").delete().eq("id", id);
  if (error) throw error;
}
