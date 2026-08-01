import type { Database } from "@/integrations/supabase/types";

export type Frase = Database["public"]["Tables"]["frases"]["Row"];

export type NovaFrase = Pick<Database["public"]["Tables"]["frases"]["Insert"], "texto" | "autor">;
