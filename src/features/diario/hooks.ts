import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  aprendizadoDoDia,
  createEntradaDiario,
  deleteEntradaDiario,
  deleteFotoEntrada,
  listDiario,
  listFotosEntrada,
  updateEntradaDiario,
  uploadFotoEntrada,
} from "./service";
import type { NovaEntradaDiario } from "./types";
import { hoje } from "@/lib/data";

const KEY = ["diario"];
const fotosKey = (entradaId: string) => ["diario-fotos", entradaId];

export function useDiario() {
  return useQuery({ queryKey: KEY, queryFn: listDiario });
}

/**
 * Mesmo esquema da Frase do Dia: sorteio estável pela data até o usuário
 * pedir "próxima" (navega manualmente pelo banco de aprendizados);
 * recarregar a página volta pro sorteio oficial do dia.
 */
export function useAprendizadoDoDia() {
  const { data: entradas = [], isLoading } = useDiario();
  const comAprendizado = useMemo(() => entradas.filter((e) => e.aprendizado), [entradas]);
  const doDia = useMemo(() => aprendizadoDoDia(entradas, hoje()), [entradas]);
  const [idManual, setIdManual] = useState<string | null>(null);

  const entrada = idManual ? (comAprendizado.find((e) => e.id === idManual) ?? doDia) : doDia;
  const navegandoManualmente = idManual != null && entrada?.id !== doDia?.id;

  function proxima() {
    if (comAprendizado.length <= 1) return;
    const opcoes = comAprendizado.filter((e) => e.id !== entrada?.id);
    const escolhida = opcoes[Math.floor(Math.random() * opcoes.length)];
    setIdManual(escolhida.id);
  }

  function voltarADoDia() {
    setIdManual(null);
  }

  return {
    entrada,
    total: comAprendizado.length,
    temAprendizados: comAprendizado.length > 0,
    temMaisDeUm: comAprendizado.length > 1,
    isLoading,
    proxima,
    navegandoManualmente,
    voltarADoDia,
  };
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
