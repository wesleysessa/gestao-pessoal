import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEntradaDiario,
  deleteEntradaDiario,
  deleteFotoEntrada,
  listDiario,
  listFotosEntrada,
  updateEntradaDiario,
  uploadFotoEntrada,
} from "./service";
import type { NovaEntradaDiario } from "./types";

const KEY = ["diario"];
const fotosKey = (entradaId: string) => ["diario-fotos", entradaId];

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

export function useUpdateEntradaDiario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: NovaEntradaDiario }) =>
      updateEntradaDiario(id, input),
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

export function useFotosEntrada(entradaId: string | undefined) {
  return useQuery({
    queryKey: fotosKey(entradaId ?? ""),
    queryFn: () => listFotosEntrada(entradaId as string),
    enabled: !!entradaId,
  });
}

export function useUploadFotoEntrada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entradaId, userId, file }: { entradaId: string; userId: string; file: File }) =>
      uploadFotoEntrada(entradaId, userId, file),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: fotosKey(vars.entradaId) }),
  });
}

export function useDeleteFotoEntrada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, storagePath }: { id: string; storagePath: string; entradaId: string }) =>
      deleteFotoEntrada(id, storagePath),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: fotosKey(vars.entradaId) }),
  });
}
