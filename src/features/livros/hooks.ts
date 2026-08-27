import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEntradaLivro,
  createLivro,
  deleteEntradaLivro,
  deleteLivro,
  listEntradasLivros,
  listLivros,
  removerCapa,
  updateEntradaLivro,
  updateLivro,
  uploadCapa,
} from "./service";
import type { NovaEntradaLivro, NovoLivro } from "./types";

const KEY = ["livros"];
const ENTRADAS_KEY = ["livros-entradas"];

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

export function useUpdateLivro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: NovoLivro }) => updateLivro(id, input),
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

export function useUploadCapa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ livroId, userId, file }: { livroId: string; userId: string; file: File }) =>
      uploadCapa(livroId, userId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRemoverCapa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ livroId, path }: { livroId: string; path: string }) =>
      removerCapa(livroId, path),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Todas as entradas de todos os livros — a tela agrupa por livro_id. */
export function useEntradasLivros() {
  return useQuery({ queryKey: ENTRADAS_KEY, queryFn: listEntradasLivros });
}

export function useCreateEntradaLivro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ livroId, input }: { livroId: string; input: NovaEntradaLivro }) =>
      createEntradaLivro(livroId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ENTRADAS_KEY }),
  });
}

export function useUpdateEntradaLivro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: NovaEntradaLivro }) =>
      updateEntradaLivro(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ENTRADAS_KEY }),
  });
}

export function useDeleteEntradaLivro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEntradaLivro(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ENTRADAS_KEY }),
  });
}
