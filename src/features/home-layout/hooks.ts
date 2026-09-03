import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listPosicoesHome, salvarOrdemHome } from "./service";

const KEY = ["modulos-home"];

export function usePosicoesHome() {
  return useQuery({ queryKey: KEY, queryFn: listPosicoesHome });
}

export function useSalvarOrdemHome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rotasEmOrdem: string[]) => salvarOrdemHome(rotasEmOrdem),
    onMutate: async (rotasEmOrdem: string[]) => {
      await qc.cancelQueries({ queryKey: KEY });
      const anterior = qc.getQueryData<Map<string, number>>(KEY);
      qc.setQueryData(KEY, new Map(rotasEmOrdem.map((rota, i) => [rota, i])));
      return { anterior };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.anterior) qc.setQueryData(KEY, ctx.anterior);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
