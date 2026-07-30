import type { Database } from "@/integrations/supabase/types";

export type Vocabulario = Database["public"]["Tables"]["vocabulario"]["Row"];

export type NovoVocabulario = Pick<
  Database["public"]["Tables"]["vocabulario"]["Insert"],
  "termo" | "idioma" | "traducao" | "exemplo"
>;
