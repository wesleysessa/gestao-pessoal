import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRegistroAgua,
  deleteRegistroAgua,
  listAgua,
  listMetasAgua,
  upsertMetaAgua,
} from "./service";

const KEY = ["agua"];
const METAS_KEY = ["agua-metas"];

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

export function useMetasAgua() {
  return useQuery({ queryKey: METAS_KEY, queryFn: listMetasAgua });
}

export function useUpsertMetaAgua() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quantidadeMl: number) => upsertMetaAgua(quantidadeMl),
    onSuccess: () => qc.invalidateQueries({ queryKey: METAS_KEY }),
  });
}
