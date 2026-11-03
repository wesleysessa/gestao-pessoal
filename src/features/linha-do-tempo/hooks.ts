import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEventoLinha,
  createPeriodo,
  deleteEventoLinha,
  deletePeriodo,
  listEventosLinha,
  listPeriodos,
  updateEventoLinha,
  updatePeriodo,
} from "./service";
import type { NovoEventoLinha, NovoPeriodo } from "./types";

const KEY_PERIODOS = ["linha-do-tempo", "periodos"];
const KEY_EVENTOS = ["linha-do-tempo", "eventos"];

export function usePeriodos() {
  return useQuery({ queryKey: KEY_PERIODOS, queryFn: listPeriodos });
}

export function useEventosLinha() {
  return useQuery({ queryKey: KEY_EVENTOS, queryFn: listEventosLinha });
}

export function useSalvarPeriodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: NovoPeriodo }) =>
      id ? updatePeriodo(id, input) : createPeriodo(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_PERIODOS }),
  });
}

export function useDeletePeriodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePeriodo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_PERIODOS }),
  });
}

export function useSalvarEventoLinha() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: NovoEventoLinha }) =>
      id ? updateEventoLinha(id, input) : createEventoLinha(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_EVENTOS }),
  });
}

export function useDeleteEventoLinha() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEventoLinha(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_EVENTOS }),
  });
}
