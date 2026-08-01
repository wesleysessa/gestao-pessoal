import { supabase } from "@/integrations/supabase/client";
import type { NovaMelhoria, StatusMelhoria } from "./types";

export const FOTOS_BUCKET = "melhorias-fotos";

export async function listMelhorias() {
  const { data, error } = await supabase
    .from("melhorias")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createMelhoria(input: NovaMelhoria) {
  const { data, error } = await supabase.from("melhorias").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateMelhoria(id: string, input: NovaMelhoria) {
  const { error } = await supabase
    .from("melhorias")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function voltarParaSugerido(id: string) {
  const { error } = await supabase
    .from("melhorias")
    .update({ status: "sugerido" satisfies StatusMelhoria, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function marcarEmFuncionamento(id: string, retorno: string | null) {
  const { error } = await supabase
    .from("melhorias")
    .update({
      status: "em_funcionamento" satisfies StatusMelhoria,
      retorno,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteMelhoria(id: string) {
  const { error } = await supabase.from("melhorias").delete().eq("id", id);
  if (error) throw error;
}

export async function listFotosMelhoria(melhoriaId: string) {
  const { data, error } = await supabase
    .from("melhorias_fotos")
    .select("*")
    .eq("melhoria_id", melhoriaId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function uploadFotoMelhoria(melhoriaId: string, userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${melhoriaId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from(FOTOS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (uploadError) throw uploadError;
  const { error } = await supabase
    .from("melhorias_fotos")
    .insert({ melhoria_id: melhoriaId, storage_path: path });
  if (error) throw error;
}

export async function deleteFotoMelhoria(id: string, storagePath: string) {
  await supabase.storage.from(FOTOS_BUCKET).remove([storagePath]);
  const { error } = await supabase.from("melhorias_fotos").delete().eq("id", id);
  if (error) throw error;
}
