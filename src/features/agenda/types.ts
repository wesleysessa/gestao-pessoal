import type { Database } from "@/integrations/supabase/types";

export type Evento = Database["public"]["Tables"]["agenda_eventos"]["Row"];

export type NovoEvento = Pick<
  Evento,
  | "titulo"
  | "descricao"
  | "local"
  | "dia_inteiro"
  | "data"
  | "data_fim"
  | "hora_inicio"
  | "hora_fim"
  | "cor"
  | "recorrencia"
  | "recorrencia_fim"
  | "lembrete_minutos"
  | "aniversario"
  | "destaque"
  | "radar"
>;

/** Uma ocorrência materializada de um evento numa data específica (recorrência já expandida). */
export type Ocorrencia = {
  evento: Evento;
  dataOcorrencia: string;
};

export type Conclusao = Database["public"]["Tables"]["agenda_conclusoes"]["Row"];

export type FotoEvento = Database["public"]["Tables"]["agenda_fotos"]["Row"];

export type CorEvento =
  | "tomato"
  | "flamingo"
  | "tangerine"
  | "banana"
  | "sage"
  | "basil"
  | "peacock"
  | "blueberry"
  | "lavender"
  | "grape"
  | "graphite";

export const CORES_EVENTO: Record<CorEvento, { label: string; dot: string; ring: string }> = {
  tomato: { label: "Tomate", dot: "bg-red-500", ring: "ring-red-500" },
  flamingo: { label: "Flamingo", dot: "bg-pink-400", ring: "ring-pink-400" },
  tangerine: { label: "Tangerina", dot: "bg-orange-500", ring: "ring-orange-500" },
  banana: { label: "Banana", dot: "bg-amber-400", ring: "ring-amber-400" },
  sage: { label: "Sálvia", dot: "bg-emerald-400", ring: "ring-emerald-400" },
  basil: { label: "Manjericão", dot: "bg-emerald-700", ring: "ring-emerald-700" },
  peacock: { label: "Pavão", dot: "bg-cyan-600", ring: "ring-cyan-600" },
  blueberry: { label: "Mirtilo", dot: "bg-blue-600", ring: "ring-blue-600" },
  lavender: { label: "Lavanda", dot: "bg-violet-300", ring: "ring-violet-300" },
  grape: { label: "Uva", dot: "bg-purple-600", ring: "ring-purple-600" },
  graphite: { label: "Grafite", dot: "bg-gray-500", ring: "ring-gray-500" },
};

export const CORES_EVENTO_ORDEM: CorEvento[] = [
  "tomato",
  "flamingo",
  "tangerine",
  "banana",
  "sage",
  "basil",
  "peacock",
  "blueberry",
  "lavender",
  "grape",
  "graphite",
];

export type Recorrencia = "nenhuma" | "diaria" | "semanal" | "mensal" | "anual";

export const RECORRENCIA_LABEL: Record<Recorrencia, string> = {
  nenhuma: "Não repete",
  diaria: "Diariamente",
  semanal: "Semanalmente",
  mensal: "Mensalmente",
  anual: "Anualmente",
};

export const RECORRENCIAS: Recorrencia[] = ["nenhuma", "diaria", "semanal", "mensal", "anual"];

/** Minutos antes do evento — por enquanto só uma anotação, sem notificação de fato. */
export const LEMBRETE_OPCOES: { valor: number | null; label: string }[] = [
  { valor: null, label: "Nenhum" },
  { valor: 0, label: "No horário do evento" },
  { valor: 5, label: "5 minutos antes" },
  { valor: 15, label: "15 minutos antes" },
  { valor: 30, label: "30 minutos antes" },
  { valor: 60, label: "1 hora antes" },
  { valor: 1440, label: "1 dia antes" },
];
