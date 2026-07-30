import type { Database } from "@/integrations/supabase/types";

export type EntradaDiario = Database["public"]["Tables"]["diario"]["Row"];

export type NovaEntradaDiario = Pick<
  Database["public"]["Tables"]["diario"]["Insert"],
  "titulo" | "texto"
>;
