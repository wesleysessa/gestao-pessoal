import type { Database } from "@/integrations/supabase/types";

export type Melhoria = Database["public"]["Tables"]["melhorias"]["Row"];
export type StatusMelhoria = "sugerido" | "em_funcionamento";

export const STATUS_LABEL: Record<StatusMelhoria, string> = {
  sugerido: "Sugerido",
  em_funcionamento: "Em Funcionamento",
};

export type NovaMelhoria = Pick<
  Database["public"]["Tables"]["melhorias"]["Insert"],
  "titulo" | "descricao" | "status"
>;
