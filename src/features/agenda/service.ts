import { supabase } from "@/integrations/supabase/client";
import { dataLocalDe } from "@/lib/data";
import type { Evento, NovoEvento, Ocorrencia } from "./types";

export const FOTOS_BUCKET = "agenda-fotos";

export async function listEventos() {
  const { data, error } = await supabase.from("agenda_eventos").select("*").order("data");
  if (error) throw error;
  return data;
}

/** Retorna a linha criada — precisamos do id pra poder anexar fotos em seguida. */
export async function createEvento(input: NovoEvento) {
  const { data, error } = await supabase.from("agenda_eventos").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateEvento(id: string, input: NovoEvento) {
  const { error } = await supabase.from("agenda_eventos").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteEvento(id: string) {
  const { error } = await supabase.from("agenda_eventos").delete().eq("id", id);
  if (error) throw error;
}

export async function listFotosEvento(eventoId: string) {
  const { data, error } = await supabase
    .from("agenda_fotos")
    .select("*")
    .eq("evento_id", eventoId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function uploadFotoEvento(eventoId: string, userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${eventoId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from(FOTOS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (uploadError) throw uploadError;
  const { error } = await supabase
    .from("agenda_fotos")
    .insert({ evento_id: eventoId, storage_path: path });
  if (error) throw error;
}

export async function deleteFotoEvento(id: string, storagePath: string) {
  await supabase.storage.from(FOTOS_BUCKET).remove([storagePath]);
  const { error } = await supabase.from("agenda_fotos").delete().eq("id", id);
  if (error) throw error;
}

export async function listConclusoes() {
  const { data, error } = await supabase.from("agenda_conclusoes").select("*");
  if (error) throw error;
  return data;
}

export async function marcarConcluido(eventoId: string, data: string) {
  const { error } = await supabase.from("agenda_conclusoes").insert({ evento_id: eventoId, data });
  if (error) throw error;
}

export async function desmarcarConcluido(id: string) {
  const { error } = await supabase.from("agenda_conclusoes").delete().eq("id", id);
  if (error) throw error;
}

function addDias(iso: string, n: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  const dt = new Date(a, m - 1, d + n);
  return dataLocalDe(dt);
}

function addMeses(iso: string, n: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  const dt = new Date(a, m - 1 + n, d);
  return dataLocalDe(dt);
}

function addAnos(iso: string, n: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  const dt = new Date(a + n, m - 1, d);
  return dataLocalDe(dt);
}

/** Duas datas ISO em ordem cronológica. */
function menor(a: string, b: string): string {
  return a < b ? a : b;
}

/**
 * Materializa as ocorrências de uma lista de eventos dentro do intervalo
 * [de, ate] (ambos yyyy-mm-dd, inclusive). Eventos sem recorrência geram uma
 * ocorrência por dia entre `data` e `data_fim` (evento de dia inteiro com
 * mais de um dia); os demais repetem a partir de `data` no passo escolhido,
 * limitados por `recorrencia_fim` (se houver) e sempre pelo próprio `ate`.
 */
export function expandirOcorrencias(eventos: Evento[], de: string, ate: string): Ocorrencia[] {
  const ocorrencias: Ocorrencia[] = [];

  for (const evento of eventos) {
    if (evento.recorrencia === "nenhuma") {
      const fimSpan = evento.data_fim ?? evento.data;
      let cursor = evento.data > de ? evento.data : de;
      const fim = menor(fimSpan, ate);
      while (cursor <= fim) {
        ocorrencias.push({ evento, dataOcorrencia: cursor });
        cursor = addDias(cursor, 1);
      }
      continue;
    }

    const passo =
      evento.recorrencia === "diaria"
        ? (iso: string) => addDias(iso, 1)
        : evento.recorrencia === "semanal"
          ? (iso: string) => addDias(iso, 7)
          : evento.recorrencia === "mensal"
            ? (iso: string) => addMeses(iso, 1)
            : (iso: string) => addAnos(iso, 1);

    const limite = evento.recorrencia_fim ? menor(evento.recorrencia_fim, ate) : ate;
    let cursor = evento.data;
    // avança até entrar no intervalo pedido, sem gerar ocorrências fora dele
    while (cursor < de && cursor <= limite) cursor = passo(cursor);
    while (cursor <= limite) {
      ocorrencias.push({ evento, dataOcorrencia: cursor });
      cursor = passo(cursor);
    }
  }

  return ocorrencias.sort((a, b) => a.dataOcorrencia.localeCompare(b.dataOcorrencia));
}
