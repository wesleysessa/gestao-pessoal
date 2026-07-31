import type { Database } from "@/integrations/supabase/types";

export type RegistroAgua = Database["public"]["Tables"]["agua_registros"]["Row"];
export type MetaAgua = Database["public"]["Tables"]["agua_metas"]["Row"];
