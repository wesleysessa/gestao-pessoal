import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMelhoria,
  deleteFotoMelhoria,
  deleteMelhoria,
  listFotosMelhoria,
  listMelhorias,
  marcarEmFuncionamento,
  updateMelhoria,
  uploadFotoMelhoria,
  voltarParaSugerido,
} from "./service";
import type { NovaMelhoria } from "./types";

const KEY = ["melhorias"];
const fotosKey = (melhoriaId: string) => ["melhorias-fotos", melhoriaId];

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

export function useVoltarParaSugerido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => voltarParaSugerido(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMarcarEmFuncionamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, retorno }: { id: string; retorno: string | null }) =>
      marcarEmFuncionamento(id, retorno),
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

export function useFotosMelhoria(melhoriaId: string | undefined) {
  return useQuery({
    queryKey: fotosKey(melhoriaId ?? ""),
    queryFn: () => listFotosMelhoria(melhoriaId as string),
    enabled: !!melhoriaId,
  });
}

export function useUploadFotoMelhoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      melhoriaId,
      userId,
      file,
    }: {
      melhoriaId: string;
      userId: string;
      file: File;
    }) => uploadFotoMelhoria(melhoriaId, userId, file),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: fotosKey(vars.melhoriaId) }),
  });
}

export function useDeleteFotoMelhoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, storagePath }: { id: string; storagePath: string; melhoriaId: string }) =>
      deleteFotoMelhoria(id, storagePath),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: fotosKey(vars.melhoriaId) }),
  });
}
