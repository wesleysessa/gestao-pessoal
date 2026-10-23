import type { Database } from "@/integrations/supabase/types";

export type CartaoKanban = Database["public"]["Tables"]["kanban_cartoes"]["Row"];

export type NovoCartaoKanban = Pick<
  Database["public"]["Tables"]["kanban_cartoes"]["Insert"],
  "titulo" | "descricao" | "coluna" | "prioridade" | "prazo" | "escopo"
>;

export type ColunaKanban =
  "backlog" | "a_fazer" | "em_processamento" | "aguardando_aprovacao" | "revisao" | "concluido";

/** Ordem do fluxo, da esquerda pra direita. */
export const COLUNAS_KANBAN: ColunaKanban[] = [
  "backlog",
  "a_fazer",
  "em_processamento",
  "aguardando_aprovacao",
  "revisao",
  "concluido",
];

export const COLUNA_INFO: Record<ColunaKanban, { label: string; dot: string }> = {
  backlog: { label: "Backlog", dot: "bg-slate-400" },
  a_fazer: { label: "A Fazer", dot: "bg-blue-500" },
  em_processamento: { label: "Em Processamento", dot: "bg-amber-500" },
  aguardando_aprovacao: { label: "Aguardando Aprovação", dot: "bg-violet-500" },
  revisao: { label: "Revisão", dot: "bg-orange-500" },
  concluido: { label: "Concluído", dot: "bg-green-500" },
};

export type PrioridadeKanban = "baixa" | "media" | "alta";

export const PRIORIDADE_INFO: Record<PrioridadeKanban, { label: string; dot: string }> = {
  baixa: { label: "Baixa", dot: "bg-green-500" },
  media: { label: "Média", dot: "bg-amber-400" },
  alta: { label: "Alta", dot: "bg-red-500" },
};

export const PRIORIDADES_KANBAN: PrioridadeKanban[] = ["alta", "media", "baixa"];
