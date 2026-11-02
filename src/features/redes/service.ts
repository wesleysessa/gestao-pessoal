import { supabase } from "@/integrations/supabase/client";
import { hoje } from "@/lib/data";
import { REDE_PADRAO, type MetaRede } from "./types";

export async function listUsoRede(rede = REDE_PADRAO) {
  const { data, error } = await supabase
    .from("redes_uso")
    .select("*")
    .eq("rede", rede)
    .order("data", { ascending: false })
    .limit(120);
  if (error) throw error;
  return data;
}

/** Um registro por dia: lançar de novo o mesmo dia substitui o valor. */
export async function salvarUsoRede(data: string, minutos: number, rede = REDE_PADRAO) {
  const { error } = await supabase
    .from("redes_uso")
    .upsert(
      { rede, data, minutos, updated_at: new Date().toISOString() },
      { onConflict: "user_id,rede,data" },
    );
  if (error) throw error;
}

export async function deleteUsoRede(id: string) {
  const { error } = await supabase.from("redes_uso").delete().eq("id", id);
  if (error) throw error;
}

export async function listMetasRede(rede = REDE_PADRAO) {
  const { data, error } = await supabase
    .from("redes_metas")
    .select("*")
    .eq("rede", rede)
    .order("vigente_desde", { ascending: true });
  if (error) throw error;
  return data;
}

/** Novo limite a partir de hoje — dias anteriores mantêm o limite que valia. */
export async function salvarMetaRede(minutos: number, rede = REDE_PADRAO) {
  const { error } = await supabase
    .from("redes_metas")
    .upsert({ rede, minutos, vigente_desde: hoje() }, { onConflict: "user_id,rede,vigente_desde" });
  if (error) throw error;
}

/** Limite em vigor numa data: o mais recente com `vigente_desde` <= a data. */
export function metaVigenteEm(metas: MetaRede[], dataISO: string): number | null {
  let atual: number | null = null;
  for (const m of metas) {
    if (m.vigente_desde > dataISO) break;
    atual = m.minutos;
  }
  return atual;
}
