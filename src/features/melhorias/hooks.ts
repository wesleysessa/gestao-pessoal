import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMelhoria,
  deleteMelhoria,
  listMelhorias,
  updateMelhoria,
  updateStatusMelhoria,
} from "./service";
import type { NovaMelhoria, StatusMelhoria } from "./types";

const KEY = ["melhorias"];

export function useMelhorias() {
  return useQuery({ queryKey: KEY, queryFn: listMelhorias });
}

export function useCreateMelhoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NovaMelhoria) => createMelhoria(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateMelhoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: NovaMelhoria }) => updateMelhoria(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateStatusMelhoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusMelhoria }) =>
      updateStatusMelhoria(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteMelhoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMelhoria(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
