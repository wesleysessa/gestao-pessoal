import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { syncStreak } from "./service";
import { hoje } from "@/lib/data";
import { useVocabulario } from "@/features/vocabulario/hooks";
import { useDiario } from "@/features/diario/hooks";
import { useLivros } from "@/features/livros/hooks";
import { useCheckins } from "@/features/saude/hooks";

const META_DIARIA = 3;

export function useStreak() {
  return useQuery({ queryKey: ["streak"], queryFn: syncStreak, staleTime: 5 * 60 * 1000 });
}

/**
 * Combina o estado gravado da streak com as 4 fontes de tarefa pra saber o
 * que já foi feito hoje (a função no banco só fecha a conta de dias
 * passados) e pra poder marcar qualquer dia do calendário como "cumprido".
 */
export function useStreakResumo() {
  const { data: streak } = useStreak();
  const { data: vocab = [] } = useVocabulario();
  const { data: diario = [] } = useDiario();
  const { data: livros = [] } = useLivros();
  const { data: checkins = [] } = useCheckins();

  const tarefas = [
    {
      rotulo: "Vocabulário",
      feita: vocab.some((v) => v.data === hoje()),
      to: "/vocabulario",
      acao: "Adicionar palavra",
    },
    {
      rotulo: "Diário",
      feita: diario.some((e) => e.data === hoje()),
      to: "/diario",
      acao: "Escrever",
    },
    {
      rotulo: "Livros",
      feita: livros.some((l) => l.data === hoje()),
      to: "/livros",
      acao: "Registrar",
    },
    {
      rotulo: "Check-in Saúde",
      feita: checkins.some((c) => c.data === hoje()),
      to: "/saude",
      acao: "Fazer check-in",
    },
  ] as const;
  const feitasHoje = tarefas.filter((t) => t.feita).length;
  // A função no banco só fecha a conta de dias passados (hoje ainda pode
  // mudar). Se a meta de hoje já foi batida, mostra a chama acesa na hora,
  // sem esperar virar o dia — o valor oficial só é gravado amanhã.
  const metaBatidaHoje = feitasHoje >= META_DIARIA;
  const streakExibido = (streak?.streak_atual ?? 0) + (metaBatidaHoje ? 1 : 0);

  /** Um dia "cumpriu a meta" se ao menos 3 das 4 tarefas têm registro nele. */
  const diaCumpriuMeta = useMemo(() => {
    return (dataISO: string) => {
      let n = 0;
      if (vocab.some((v) => v.data === dataISO)) n++;
      if (diario.some((e) => e.data === dataISO)) n++;
      if (livros.some((l) => l.data === dataISO)) n++;
      if (checkins.some((c) => c.data === dataISO)) n++;
      return n >= META_DIARIA;
    };
  }, [vocab, diario, livros, checkins]);

  return { streak, tarefas, feitasHoje, streakExibido, diaCumpriuMeta, META_DIARIA };
}
