import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRegistroAgua, deleteRegistroAgua, listAgua } from "./service";

const KEY = ["agua"];

export function useAgua() {
  return useQuery({ queryKey: KEY, queryFn: listAgua });
}

export function useCreateRegistroAgua() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quantidadeMl: number) => createRegistroAgua(quantidadeMl),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteRegistroAgua() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRegistroAgua(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
