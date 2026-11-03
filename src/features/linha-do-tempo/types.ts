import type { Database } from "@/integrations/supabase/types";

export type Periodo = Database["public"]["Tables"]["linha_periodos"]["Row"];
export type EventoLinha = Database["public"]["Tables"]["linha_eventos"]["Row"];

export type NovoPeriodo = Pick<Periodo, "nome" | "pai_id" | "inicio" | "fim" | "cor">;
export type NovoEventoLinha = Pick<EventoLinha, "titulo" | "descricao" | "ano" | "unidade">;

/** Jeito de digitar uma data: tempo geológico ("anos atrás") ou calendário. */
export type Unidade = "milhoes" | "mil" | "ac" | "dc";

export const UNIDADES: Unidade[] = ["milhoes", "mil", "ac", "dc"];

export const UNIDADE_LABEL: Record<Unidade, string> = {
  milhoes: "milhões de anos atrás",
  mil: "mil anos atrás",
  ac: "a.C.",
  dc: "d.C.",
};

export type CorPeriodo =
  "slate" | "amber" | "orange" | "rose" | "emerald" | "teal" | "sky" | "violet";

export const CORES_PERIODO: CorPeriodo[] = [
  "amber",
  "orange",
  "rose",
  "emerald",
  "teal",
  "sky",
  "violet",
  "slate",
];

export const COR_INFO: Record<CorPeriodo, { dot: string; chip: string }> = {
  slate: {
    dot: "bg-slate-500",
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  amber: {
    dot: "bg-amber-500",
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  orange: {
    dot: "bg-orange-500",
    chip: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  },
  rose: {
    dot: "bg-rose-500",
    chip: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  },
  emerald: {
    dot: "bg-emerald-500",
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  teal: {
    dot: "bg-teal-500",
    chip: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  },
  sky: {
    dot: "bg-sky-500",
    chip: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  },
  violet: {
    dot: "bg-violet-500",
    chip: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  },
};

export function corInfo(cor: string) {
  return COR_INFO[(cor as CorPeriodo) in COR_INFO ? (cor as CorPeriodo) : "slate"];
}
