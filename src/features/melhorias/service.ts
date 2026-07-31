import { supabase } from "@/integrations/supabase/client";
import type { NovaMelhoria, StatusMelhoria } from "./types";

export async function listMelhorias() {
  const { data, error } = await supabase
    .from("melhorias")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createMelhoria(input: NovaMelhoria) {
  const { error } = await supabase.from("melhorias").insert(input);
  if (error) throw error;
}

export async function updateMelhoria(id: string, input: NovaMelhoria) {
  const { error } = await supabase
    .from("melhorias")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function updateStatusMelhoria(id: string, status: StatusMelhoria) {
  const { error } = await supabase
    .from("melhorias")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteMelhoria(id: string) {
  const { error } = await supabase.from("melhorias").delete().eq("id", id);
  if (error) throw error;
}
