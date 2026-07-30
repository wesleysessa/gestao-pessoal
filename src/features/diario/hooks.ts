import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEntradaDiario, deleteEntradaDiario, listDiario } from "./service";
import type { NovaEntradaDiario } from "./types";

const KEY = ["diario"];

export function useDiario() {
  return useQuery({ queryKey: KEY, queryFn: listDiario });
}

export function useCreateEntradaDiario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NovaEntradaDiario) => createEntradaDiario(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteEntradaDiario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEntradaDiario(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
