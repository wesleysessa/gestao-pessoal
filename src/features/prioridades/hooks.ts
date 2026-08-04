import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  atualizarOrdemPrioridade,
  createPrioridade,
  deletePrioridade,
  listPrioridades,
  updatePrioridade,
} from "./service";
import type { NovaPrioridade } from "./types";

const KEY = ["prioridades"];

export function usePrioridades() {
  return useQuery({ queryKey: KEY, queryFn: listPrioridades });
}

export function useCreatePrioridade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NovaPrioridade) => createPrioridade(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdatePrioridade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: NovaPrioridade }) =>
      updatePrioridade(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeletePrioridade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePrioridade(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAtualizarOrdemPrioridade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ordem }: { id: string; ordem: number }) =>
      atualizarOrdemPrioridade(id, ordem),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
