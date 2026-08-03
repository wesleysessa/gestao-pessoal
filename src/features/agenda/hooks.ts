import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEvento,
  deleteEvento,
  desmarcarConcluido,
  listConclusoes,
  listEventos,
  marcarConcluido,
  updateEvento,
} from "./service";
import type { NovoEvento } from "./types";

const KEY = ["agenda-eventos"];
const CONCLUSOES_KEY = ["agenda-conclusoes"];

export function useEventos() {
  return useQuery({ queryKey: KEY, queryFn: listEventos });
}

export function useCreateEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NovoEvento) => createEvento(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: NovoEvento }) => updateEvento(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEvento(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useConclusoes() {
  return useQuery({ queryKey: CONCLUSOES_KEY, queryFn: listConclusoes });
}

export function useMarcarConcluido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventoId, data }: { eventoId: string; data: string }) =>
      marcarConcluido(eventoId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONCLUSOES_KEY }),
  });
}

export function useDesmarcarConcluido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => desmarcarConcluido(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONCLUSOES_KEY }),
  });
}
