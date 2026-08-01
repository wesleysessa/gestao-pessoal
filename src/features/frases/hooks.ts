import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFrase, deleteFrase, fraseDoDia, listFrases, updateFrase } from "./service";
import type { NovaFrase } from "./types";
import { hoje } from "@/lib/data";

const KEY = ["frases"];

export function useFrases() {
  return useQuery({ queryKey: KEY, queryFn: listFrases });
}

/**
 * A frase do dia é sempre a mesma (sorteio estável pela data) até o usuário
 * pedir "próxima" — aí navega manualmente pelo banco; recarregar a página
 * volta pro sorteio oficial do dia.
 */
export function useFraseDoDia() {
  const { data: frases = [], isLoading } = useFrases();
  const fraseDia = useMemo(() => fraseDoDia(frases, hoje()), [frases]);
  const [idManual, setIdManual] = useState<string | null>(null);

  const frase = idManual ? (frases.find((f) => f.id === idManual) ?? fraseDia) : fraseDia;
  const navegandoManualmente = idManual != null && frase?.id !== fraseDia?.id;

  function proxima() {
    if (frases.length <= 1) return;
    const opcoes = frases.filter((f) => f.id !== frase?.id);
    const escolhida = opcoes[Math.floor(Math.random() * opcoes.length)];
    setIdManual(escolhida.id);
  }

  function voltarADoDia() {
    setIdManual(null);
  }

  return {
    frase,
    temFrases: frases.length > 0,
    temMaisDeUma: frases.length > 1,
    isLoading,
    proxima,
    navegandoManualmente,
    voltarADoDia,
  };
}

export function useCreateFrase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NovaFrase) => createFrase(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateFrase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: NovaFrase }) => updateFrase(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteFrase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFrase(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
