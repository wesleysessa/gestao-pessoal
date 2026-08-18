import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEvento,
  deleteEvento,
  deleteFotoEvento,
  desmarcarConcluido,
  listConclusoes,
  listEventos,
  listFotosEvento,
  marcarConcluido,
  updateEvento,
  uploadFotoEvento,
} from "./service";
import type { NovoEvento } from "./types";

const KEY = ["agenda-eventos"];
const CONCLUSOES_KEY = ["agenda-conclusoes"];
const fotosKey = (eventoId: string) => ["agenda-fotos", eventoId];

export function useEventos() {
  return useQuery({ queryKey: KEY, queryFn: listEventos });
}

export function useCreateEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NovoEvento) => createEvento(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: NovoEvento }) => updateEvento(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEvento(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useConclusoes() {
  return useQuery({ queryKey: CONCLUSOES_KEY, queryFn: listConclusoes });
}

export function useMarcarConcluido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventoId, data }: { eventoId: string; data: string }) =>
      marcarConcluido(eventoId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONCLUSOES_KEY }),
  });
}

export function useDesmarcarConcluido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => desmarcarConcluido(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CONCLUSOES_KEY }),
  });
}

export function useFotosEvento(eventoId: string | undefined) {
  return useQuery({
    queryKey: fotosKey(eventoId ?? ""),
    queryFn: () => listFotosEvento(eventoId as string),
    enabled: !!eventoId,
  });
}

export function useUploadFotoEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventoId, userId, file }: { eventoId: string; userId: string; file: File }) =>
      uploadFotoEvento(eventoId, userId, file),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: fotosKey(vars.eventoId) }),
  });
}

export function useDeleteFotoEvento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, storagePath }: { id: string; storagePath: string; eventoId: string }) =>
      deleteFotoEvento(id, storagePath),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: fotosKey(vars.eventoId) }),
  });
}
