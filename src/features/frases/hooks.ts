import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFrase, deleteFrase, fraseDoDia, listFrases, updateFrase } from "./service";
import type { NovaFrase } from "./types";
import { hoje } from "@/lib/data";

const KEY = ["frases"];

export function useFrases() {
  return useQuery({ queryKey: KEY, queryFn: listFrases });
}

export function useFraseDoDia() {
  const { data: frases = [], isLoading } = useFrases();
  const frase = useMemo(() => fraseDoDia(frases, hoje()), [frases]);
  return { frase, temFrases: frases.length > 0, isLoading };
}

export function useCreateFrase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NovaFrase) => createFrase(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateFrase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: NovaFrase }) => updateFrase(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteFrase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFrase(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
