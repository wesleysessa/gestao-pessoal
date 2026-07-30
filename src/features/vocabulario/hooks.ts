import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createVocabulario, deleteVocabulario, listVocabulario } from "./service";
import type { NovoVocabulario } from "./types";

const KEY = ["vocabulario"];

export function useVocabulario() {
  return useQuery({ queryKey: KEY, queryFn: listVocabulario });
}

export function useCreateVocabulario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NovoVocabulario) => createVocabulario(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteVocabulario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVocabulario(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
