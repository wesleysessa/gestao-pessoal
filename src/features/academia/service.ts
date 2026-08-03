import { supabase } from "@/integrations/supabase/client";
import { dataLocalDe, hoje } from "@/lib/data";

const DIAS_HISTORICO = 60;

export async function listCheckinsAcademia() {
  const desde = new Date();
  desde.setDate(desde.getDate() - DIAS_HISTORICO);
  const { data, error } = await supabase
    .from("academia_checkins")
    .select("*")
    .gte("data", dataLocalDe(desde))
    .order("data", { ascending: false });
  if (error) throw error;
  return data;
}

export async function marcarCheckinAcademiaHoje() {
  const { error } = await supabase.from("academia_checkins").insert({ data: hoje() });
  if (error) throw error;
}

export async function desmarcarCheckinAcademia(id: string) {
  const { error } = await supabase.from("academia_checkins").delete().eq("id", id);
  if (error) throw error;
}

/** Segunda-feira (início da semana) da semana que contém a data informada. */
export function segundaDaSemana(dataISO: string): string {
  const [a, m, d] = dataISO.split("-").map(Number);
  const dt = new Date(a, m - 1, d);
  const diaSemana = dt.getDay(); // 0 = domingo
  const offset = diaSemana === 0 ? 6 : diaSemana - 1;
  dt.setDate(dt.getDate() - offset);
  return dataLocalDe(dt);
}
