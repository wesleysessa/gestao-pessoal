import type { Database } from "@/integrations/supabase/types";

export type Prioridade = Database["public"]["Tables"]["prioridades"]["Row"];

export type NovaPrioridade = Pick<
  Database["public"]["Tables"]["prioridades"]["Insert"],
  "titulo" | "descricao" | "cor" | "concluida"
>;

export type CorPrioridade = "vermelho" | "amarelo" | "verde";

export const CORES_PRIORIDADE: Record<CorPrioridade, { label: string; dot: string }> = {
  vermelho: { label: "Vermelho — urgente", dot: "bg-red-500" },
  amarelo: { label: "Amarelo — médio", dot: "bg-amber-400" },
  verde: { label: "Verde — tranquilo", dot: "bg-green-500" },
};

export const CORES_PRIORIDADE_ORDEM: CorPrioridade[] = ["vermelho", "amarelo", "verde"];
