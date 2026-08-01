import type { Database } from "@/integrations/supabase/types";

export type Melhoria = Database["public"]["Tables"]["melhorias"]["Row"];
export type StatusMelhoria = "sugerido" | "em_funcionamento";
export type TipoMelhoria = "sugestao" | "erro";

export const STATUS_LABEL: Record<StatusMelhoria, string> = {
  sugerido: "Sugerido",
  em_funcionamento: "Em Funcionamento",
};

export const TIPO_LABEL: Record<TipoMelhoria, string> = {
  sugestao: "Sugestão",
  erro: "Relatar erro",
};

export type NovaMelhoria = Pick<
  Database["public"]["Tables"]["melhorias"]["Insert"],
  "titulo" | "descricao" | "status" | "tipo" | "retorno"
>;

export type FotoMelhoria = Database["public"]["Tables"]["melhorias_fotos"]["Row"];
