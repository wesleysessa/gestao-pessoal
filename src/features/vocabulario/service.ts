import { supabase } from "@/integrations/supabase/client";
import { hoje } from "@/lib/data";
import type { NovoVocabulario } from "./types";

export const FOTOS_BUCKET = "vocabulario-fotos";

export async function listVocabulario() {
  const { data, error } = await supabase
    .from("vocabulario")
    .select("*")
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Retorna a linha criada — precisamos do id pra poder anexar fotos em
 * seguida. `data` é sempre o dia local de hoje — não deixamos o Postgres
 * decidir (fuso UTC).
 */
export async function createVocabulario(input: NovoVocabulario) {
  const { data, error } = await supabase
    .from("vocabulario")
    .insert({ ...input, data: hoje() })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateVocabulario(id: string, input: NovoVocabulario) {
  const { error } = await supabase.from("vocabulario").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteVocabulario(id: string) {
  const { error } = await supabase.from("vocabulario").delete().eq("id", id);
  if (error) throw error;
}

export async function listFotosVocabulario(vocabularioId: string) {
  const { data, error } = await supabase
    .from("vocabulario_fotos")
    .select("*")
    .eq("vocabulario_id", vocabularioId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function uploadFotoVocabulario(vocabularioId: string, userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${vocabularioId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from(FOTOS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (uploadError) throw uploadError;
  const { error } = await supabase
    .from("vocabulario_fotos")
    .insert({ vocabulario_id: vocabularioId, storage_path: path });
  if (error) throw error;
}

export async function deleteFotoVocabulario(id: string, storagePath: string) {
  await supabase.storage.from(FOTOS_BUCKET).remove([storagePath]);
  const { error } = await supabase.from("vocabulario_fotos").delete().eq("id", id);
  if (error) throw error;
}
