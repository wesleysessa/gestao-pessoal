import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createVocabulario,
  deleteFotoVocabulario,
  deleteVocabulario,
  listFotosVocabulario,
  listVocabulario,
  updateVocabulario,
  uploadFotoVocabulario,
} from "./service";
import type { NovoVocabulario } from "./types";

const KEY = ["vocabulario"];
const fotosKey = (vocabularioId: string) => ["vocabulario-fotos", vocabularioId];

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

export function useUpdateVocabulario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: NovoVocabulario }) =>
      updateVocabulario(id, input),
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

export function useFotosVocabulario(vocabularioId: string | undefined) {
  return useQuery({
    queryKey: fotosKey(vocabularioId ?? ""),
    queryFn: () => listFotosVocabulario(vocabularioId as string),
    enabled: !!vocabularioId,
  });
}

export function useUploadFotoVocabulario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      vocabularioId,
      userId,
      file,
    }: {
      vocabularioId: string;
      userId: string;
      file: File;
    }) => uploadFotoVocabulario(vocabularioId, userId, file),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: fotosKey(vars.vocabularioId) }),
  });
}

export function useDeleteFotoVocabulario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, storagePath }: { id: string; storagePath: string; vocabularioId: string }) =>
      deleteFotoVocabulario(id, storagePath),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: fotosKey(vars.vocabularioId) }),
  });
}
