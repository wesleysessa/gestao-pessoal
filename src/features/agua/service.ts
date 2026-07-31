import { supabase } from "@/integrations/supabase/client";
import { hoje } from "@/lib/data";
import type { MetaAgua } from "./types";

const DIAS_HISTORICO = 30;

export async function listAgua() {
  const desde = new Date();
  desde.setDate(desde.getDate() - DIAS_HISTORICO);
  const { data, error } = await supabase
    .from("agua_registros")
    .select("*")
    .gte("registrado_em", desde.toISOString())
    .order("registrado_em", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createRegistroAgua(quantidadeMl: number) {
  const { error } = await supabase.from("agua_registros").insert({ quantidade_ml: quantidadeMl });
  if (error) throw error;
}

export async function deleteRegistroAgua(id: string) {
  const { error } = await supabase.from("agua_registros").delete().eq("id", id);
  if (error) throw error;
}

export async function listMetasAgua() {
  const { data, error } = await supabase
    .from("agua_metas")
    .select("*")
    .order("vigente_desde", { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Registra uma nova meta a partir de hoje. Se já existir uma meta cadastrada
 * hoje, ela é substituída (upsert) — dias anteriores mantêm a meta antiga.
 */
export async function upsertMetaAgua(quantidadeMl: number) {
  const { error } = await supabase
    .from("agua_metas")
    .upsert(
      { quantidade_ml: quantidadeMl, vigente_desde: hoje() },
      { onConflict: "user_id,vigente_desde" },
    );
  if (error) throw error;
}

/** Meta em vigor numa data: a mais recente cujo `vigente_desde` seja <= a data. */
export function metaVigenteEm(metas: MetaAgua[], dataISO: string): number | null {
  let atual: number | null = null;
  for (const m of metas) {
    if (m.vigente_desde > dataISO) break;
    atual = m.quantidade_ml;
  }
  return atual;
}
