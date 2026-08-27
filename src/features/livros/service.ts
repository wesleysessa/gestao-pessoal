import { supabase } from "@/integrations/supabase/client";
import { hoje } from "@/lib/data";
import type { NovaEntradaLivro, NovoLivro } from "./types";

export const CAPAS_BUCKET = "livros-capas";

export async function listLivros() {
  const { data, error } = await supabase
    .from("livros")
    .select("*")
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** Retorna a linha criada — precisamos do id pra poder anexar capa/entradas em seguida. */
export async function createLivro(input: NovoLivro) {
  const { data, error } = await supabase
    .from("livros")
    .insert({ ...input, data: hoje() })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateLivro(id: string, input: NovoLivro) {
  const { error } = await supabase.from("livros").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteLivro(id: string) {
  const { error } = await supabase.from("livros").delete().eq("id", id);
  if (error) throw error;
}

/** Capa é única por livro — sempre sobrescreve (upsert), não acumula como galeria. */
export async function uploadCapa(livroId: string, userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${livroId}/capa.${ext}`;
  const { error: uploadError } = await supabase.storage.from(CAPAS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });
  if (uploadError) throw uploadError;
  const { error } = await supabase.from("livros").update({ capa_path: path }).eq("id", livroId);
  if (error) throw error;
}

export async function removerCapa(livroId: string, path: string) {
  await supabase.storage.from(CAPAS_BUCKET).remove([path]);
  const { error } = await supabase.from("livros").update({ capa_path: null }).eq("id", livroId);
  if (error) throw error;
}

/** Todas as entradas do usuário (todos os livros) — agrupadas no cliente por livro_id. */
export async function listEntradasLivros() {
  const { data, error } = await supabase
    .from("livros_entradas")
    .select("*")
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createEntradaLivro(livroId: string, input: NovaEntradaLivro) {
  const { error } = await supabase
    .from("livros_entradas")
    .insert({ ...input, livro_id: livroId, data: hoje() });
  if (error) throw error;
}

export async function updateEntradaLivro(id: string, input: NovaEntradaLivro) {
  const { error } = await supabase.from("livros_entradas").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteEntradaLivro(id: string) {
  const { error } = await supabase.from("livros_entradas").delete().eq("id", id);
  if (error) throw error;
}
