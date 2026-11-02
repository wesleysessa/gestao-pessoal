import type { Database } from "@/integrations/supabase/types";

export type UsoRede = Database["public"]["Tables"]["redes_uso"]["Row"];
export type MetaRede = Database["public"]["Tables"]["redes_metas"]["Row"];

/** Por enquanto só o Instagram — a coluna `rede` já deixa espaço pra outras. */
export const REDE_PADRAO = "instagram";
