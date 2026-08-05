import { supabase } from "@/integrations/supabase/client";
import { hoje } from "@/lib/data";
import type { EntradaDiario, NovaEntradaDiario } from "./types";

export const FOTOS_BUCKET = "diario-fotos";

export async function listDiario() {
  const { data, error } = await supabase
    .from("diario")
    .select("*")
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Retorna a linha criada — precisamos do id pra poder anexar fotos em
 * seguida. `data` é sempre o dia local de hoje (não deixamos o Postgres
 * decidir — o `current_date` dele é em UTC).
 */
export async function createEntradaDiario(input: NovaEntradaDiario) {
  const { data, error } = await supabase
    .from("diario")
    .insert({ ...input, data: hoje() })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateEntradaDiario(id: string, input: NovaEntradaDiario) {
  const { error } = await supabase.from("diario").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteEntradaDiario(id: string) {
  const { error } = await supabase.from("diario").delete().eq("id", id);
  if (error) throw error;
}

export async function listFotosEntrada(entradaId: string) {
  const { data, error } = await supabase
    .from("diario_fotos")
    .select("*")
    .eq("entrada_id", entradaId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function uploadFotoEntrada(entradaId: string, userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${entradaId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from(FOTOS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (uploadError) throw uploadError;
  const { error } = await supabase
    .from("diario_fotos")
    .insert({ entrada_id: entradaId, storage_path: path });
  if (error) throw error;
}

export async function deleteFotoEntrada(id: string, storagePath: string) {
  await supabase.storage.from(FOTOS_BUCKET).remove([storagePath]);
  const { error } = await supabase.from("diario_fotos").delete().eq("id", id);
  if (error) throw error;
}

/** Escolhe um aprendizado "aleatório", mas estável ao longo do dia (mesma semente = mesmo item até virar o dia). */
export function aprendizadoDoDia(entradas: EntradaDiario[], dataISO: string): EntradaDiario | null {
  const comAprendizado = entradas.filter((e) => e.aprendizado);
  if (comAprendizado.length === 0) return null;
  const seed = Number(dataISO.replaceAll("-", ""));
  const indice = seed % comAprendizado.length;
  return comAprendizado[indice];
}
