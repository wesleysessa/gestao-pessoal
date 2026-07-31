import { supabase } from "@/integrations/supabase/client";

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
