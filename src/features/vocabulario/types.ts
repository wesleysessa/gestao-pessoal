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
  "termo" | "idioma" | "traducao" | "exemplo" | "classe_gramatical" | "antonimo" | "dificuldade"
>;

export type FotoVocabulario = Database["public"]["Tables"]["vocabulario_fotos"]["Row"];

/** Nível de dificuldade — usado pra sortear com peso no Jogo de Cards. */
export type Dificuldade = "verde" | "amarelo" | "vermelho";

export const DIFICULDADE_INFO: Record<Dificuldade, { label: string; dot: string }> = {
  verde: { label: "Fácil", dot: "bg-green-500" },
  amarelo: { label: "Médio", dot: "bg-amber-400" },
  vermelho: { label: "Difícil", dot: "bg-red-500" },
};

export const DIFICULDADE_ORDEM: Dificuldade[] = ["verde", "amarelo", "vermelho"];

/** Peso no sorteio do Jogo de Cards — quanto mais difícil, mais vezes aparece. */
export const DIFICULDADE_PESO: Record<Dificuldade, number> = {
  verde: 1,
  amarelo: 2,
  vermelho: 4,
};
