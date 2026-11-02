import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteUsoRede,
  listMetasRede,
  listUsoRede,
  salvarMetaRede,
  salvarUsoRede,
} from "./service";

const USO_KEY = ["redes-uso"];
const META_KEY = ["redes-metas"];

export function useUsoRede() {
  return useQuery({ queryKey: USO_KEY, queryFn: () => listUsoRede() });
}

export function useMetasRede() {
  return useQuery({ queryKey: META_KEY, queryFn: () => listMetasRede() });
}

export function useSalvarUsoRede() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, minutos }: { data: string; minutos: number }) =>
      salvarUsoRede(data, minutos),
    onSuccess: () => qc.invalidateQueries({ queryKey: USO_KEY }),
  });
}

export function useDeleteUsoRede() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUsoRede(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: USO_KEY }),
  });
}

export function useSalvarMetaRede() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (minutos: number) => salvarMetaRede(minutos),
    onSuccess: () => qc.invalidateQueries({ queryKey: META_KEY }),
  });
}
