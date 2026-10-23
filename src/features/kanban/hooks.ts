import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCartao,
  deleteCartao,
  listCartoes,
  moverCartao,
  reordenarColuna,
  updateCartao,
} from "./service";
import type { CartaoKanban, ColunaKanban, NovoCartaoKanban } from "./types";

const KEY = ["kanban"];

export function useCartoesKanban() {
  return useQuery({ queryKey: KEY, queryFn: listCartoes });
}

export function useCreateCartao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, ordem }: { input: NovoCartaoKanban; ordem: number }) =>
      createCartao(input, ordem),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCartao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: NovoCartaoKanban }) => updateCartao(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Mover é otimista: o cartão já aparece na coluna nova antes do servidor responder. */
export function useMoverCartao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, coluna, ordem }: { id: string; coluna: ColunaKanban; ordem: number }) =>
      moverCartao(id, coluna, ordem),
    onMutate: async ({ id, coluna, ordem }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const anterior = qc.getQueryData<CartaoKanban[]>(KEY);
      const agora = new Date().toISOString();
      qc.setQueryData<CartaoKanban[]>(KEY, (lista) =>
        lista?.map((c) =>
          c.id === id
            ? {
                ...c,
                coluna,
                ordem,
                movido_em: agora,
                concluido_em: coluna === "concluido" ? agora : null,
              }
            : c,
        ),
      );
      return { anterior };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.anterior) qc.setQueryData(KEY, ctx.anterior);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useReordenarColuna() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => reordenarColuna(ids),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: KEY });
      const anterior = qc.getQueryData<CartaoKanban[]>(KEY);
      const pos = new Map(ids.map((id, i) => [id, i]));
      qc.setQueryData<CartaoKanban[]>(KEY, (lista) =>
        lista?.map((c) => (pos.has(c.id) ? { ...c, ordem: pos.get(c.id)! } : c)),
      );
      return { anterior };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.anterior) qc.setQueryData(KEY, ctx.anterior);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCartao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCartao(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
