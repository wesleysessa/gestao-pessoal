import type { Database } from "@/integrations/supabase/types";

export type Vocabulario = Database["public"]["Tables"]["vocabulario"]["Row"];
export type ClasseGramatical = "adjetivo" | "substantivo" | "verbo" | "outro" | "phrasal_verb";

export const CLASSE_GRAMATICAL_LABEL: Record<ClasseGramatical, string> = {
  adjetivo: "Adjetivo",
  substantivo: "Substantivo",
  verbo: "Verbo",
  outro: "Outro",
  phrasal_verb: "Phrasal Verbs",
};

export type NovoVocabulario = Pick<
  Database["public"]["Tables"]["vocabulario"]["Insert"],
  "termo" | "idioma" | "traducao" | "exemplo" | "classe_gramatical" | "antonimo"
>;

export type FotoVocabulario = Database["public"]["Tables"]["vocabulario_fotos"]["Row"];
