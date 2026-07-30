import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLivro, deleteLivro, listLivros } from "./service";
import type { NovoLivro } from "./types";

const KEY = ["livros"];

export function useLivros() {
  return useQuery({ queryKey: KEY, queryFn: listLivros });
}

export function useCreateLivro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NovoLivro) => createLivro(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteLivro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLivro(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
