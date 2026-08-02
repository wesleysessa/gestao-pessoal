import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEvento, deleteEvento, listEventos, updateEvento } from "./service";
import type { NovoEvento } from "./types";

const KEY = ["agenda-eventos"];

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
