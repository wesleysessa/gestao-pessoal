import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getStatusGoogleHealth,
  listDadosGoogleHealth,
  sincronizarGoogleHealth,
  trocarCodigoPorTokenGoogleHealth,
} from "./service";

const STATUS_KEY = ["google-health-status"];
const DADOS_KEY = ["google-health-dados"];

export function useStatusGoogleHealth() {
  return useQuery({ queryKey: STATUS_KEY, queryFn: getStatusGoogleHealth });
}

export function useDadosGoogleHealth(limite = 14) {
  return useQuery({
    queryKey: [...DADOS_KEY, limite],
    queryFn: () => listDadosGoogleHealth(limite),
  });
}

export function useTrocarCodigoPorTokenGoogleHealth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => trocarCodigoPorTokenGoogleHealth(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STATUS_KEY });
      qc.invalidateQueries({ queryKey: DADOS_KEY });
    },
  });
}

export function useSincronizarGoogleHealth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sincronizarGoogleHealth,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: STATUS_KEY });
      qc.invalidateQueries({ queryKey: DADOS_KEY });
    },
  });
}
