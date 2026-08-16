import { supabase } from "@/integrations/supabase/client";
import { hoje } from "@/lib/data";
import type { NovoCheckinSaude } from "./types";

export async function listCheckins() {
  const { data, error } = await supabase
    .from("saude_checkins")
    .select("*")
    .order("data", { ascending: false })
    .limit(90);
  if (error) throw error;
  return data;
}

/** Cria ou atualiza (upsert) o check-in de hoje — um registro por dia. */
export async function upsertCheckinHoje(input: NovoCheckinSaude) {
  const { error } = await supabase
    .from("saude_checkins")
    .upsert({ ...input, data: hoje() }, { onConflict: "user_id,data" });
  if (error) throw error;
}

/** Edita um check-in de um dia passado (o de hoje passa por upsertCheckinHoje). */
export async function updateCheckin(id: string, input: NovoCheckinSaude) {
  const { error } = await supabase.from("saude_checkins").update(input).eq("id", id);
  if (error) throw error;
}
