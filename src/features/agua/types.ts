import type { Database } from "@/integrations/supabase/types";

export type RegistroAgua = Database["public"]["Tables"]["agua_registros"]["Row"];
