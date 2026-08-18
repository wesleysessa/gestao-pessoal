import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRegistroAgua,
  deleteRegistroAgua,
  listAgua,
  listMetasAgua,
  metaVigenteEm,
  upsertMetaAgua,
} from "./service";
import { dataLocalDe, hoje } from "@/lib/data";

const KEY = ["agua"];
const METAS_KEY = ["agua-metas"];

export function useAgua() {
  return useQuery({ queryKey: KEY, queryFn: listAgua });
}

/** Total consumido hoje, meta em vigor e % de progresso (0-100) — usado no cabeçalho. */
export function useHidratacaoHoje() {
  const { data: registros = [] } = useAgua();
  const { data: metas = [] } = useMetasAgua();

  const totalHoje = useMemo(
    () =>
      registros
        .filter((r) => dataLocalDe(r.registrado_em) === hoje())
        .reduce((soma, r) => soma + r.quantidade_ml, 0),
    [registros],
  );
  const metaHoje = metaVigenteEm(metas, hoje());
  const progresso = metaHoje ? Math.min(100, Math.round((totalHoje / metaHoje) * 100)) : null;

  return { totalHoje, metaHoje, progresso };
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
