import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { syncStreak } from "./service";
import { dataLocalDe, hoje } from "@/lib/data";
import { useVocabulario } from "@/features/vocabulario/hooks";
import { useDiario } from "@/features/diario/hooks";
import { useEntradasLivros, useLivros } from "@/features/livros/hooks";
import { useMelhorias } from "@/features/melhorias/hooks";
import { useAgua, useMetasAgua } from "@/features/agua/hooks";
import { metaVigenteEm } from "@/features/agua/service";

const META_DIARIA = 3;
/** Melhorias exige duas no mesmo dia — uma só não conta. */
const MELHORIAS_META_DIA = 2;

export function useStreak() {
  return useQuery({ queryKey: ["streak"], queryFn: syncStreak, staleTime: 5 * 60 * 1000 });
}

/**
 * Combina o estado gravado da streak com as 5 fontes de tarefa pra saber o
 * que já foi feito hoje (a função no banco só fecha a conta de dias
 * passados) e pra poder marcar qualquer dia do calendário como "cumprido".
 * Diário e Check-in Saúde são a mesma tarefa desde que se fundiram.
 */
export function useStreakResumo() {
  const { data: streak } = useStreak();
  const { data: vocab = [] } = useVocabulario();
  const { data: diario = [] } = useDiario();
  const { data: livros = [] } = useLivros();
  const { data: entradasLivros = [] } = useEntradasLivros();
  const { data: melhorias = [] } = useMelhorias();
  const { data: registrosAgua = [] } = useAgua();
  const { data: metasAgua = [] } = useMetasAgua();

  /** Quantas melhorias foram criadas num dia específico. */
  const melhoriasNoDia = useMemo(() => {
    return (dataISO: string) =>
      melhorias.filter((m) => dataLocalDe(m.created_at) === dataISO).length;
  }, [melhorias]);

  const totalAguaPorDia = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of registrosAgua) {
      const dia = dataLocalDe(r.registrado_em);
      map.set(dia, (map.get(dia) ?? 0) + r.quantidade_ml);
    }
    return map;
  }, [registrosAgua]);

  /**
   * Bateu a meta de água num dia específico (sem meta definida = não conta).
   * "Bater" aqui é atingir 50% da meta — mais alcançável no dia a dia.
   */
  const metaAguaBatidaEm = useMemo(() => {
    return (dataISO: string) => {
      const meta = metaVigenteEm(metasAgua, dataISO);
      if (!meta) return false;
      return (totalAguaPorDia.get(dataISO) ?? 0) >= meta * 0.5;
    };
  }, [metasAgua, totalAguaPorDia]);

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
      // conta tanto cadastrar um livro novo quanto registrar uma leitura nele.
      feita: livros.some((l) => l.data === hoje()) || entradasLivros.some((e) => e.data === hoje()),
      to: "/livros",
      acao: "Registrar leitura",
    },
    {
      rotulo: "Hidratação",
      feita: metaAguaBatidaEm(hoje()),
      to: "/agua",
      acao: "Registrar água",
    },
    {
      rotulo: "Melhorias",
      feita: melhoriasNoDia(hoje()) >= MELHORIAS_META_DIA,
      to: "/melhorias",
      acao: "Sugerir 2 melhorias",
    },
  ] as const;
  const feitasHoje = tarefas.filter((t) => t.feita).length;
  // A função no banco só fecha a conta de dias passados (hoje ainda pode
  // mudar). Se a meta de hoje já foi batida, mostra a chama acesa na hora,
  // sem esperar virar o dia — o valor oficial só é gravado amanhã.
  const metaBatidaHoje = feitasHoje >= META_DIARIA;
  const streakExibido = (streak?.streak_atual ?? 0) + (metaBatidaHoje ? 1 : 0);

  /** Um dia "cumpriu a meta" se ao menos 3 das 5 tarefas têm registro nele. */
  const diaCumpriuMeta = useMemo(() => {
    return (dataISO: string) => {
      let n = 0;
      if (vocab.some((v) => v.data === dataISO)) n++;
      if (diario.some((e) => e.data === dataISO)) n++;
      if (livros.some((l) => l.data === dataISO) || entradasLivros.some((e) => e.data === dataISO))
        n++;
      if (metaAguaBatidaEm(dataISO)) n++;
      if (melhoriasNoDia(dataISO) >= MELHORIAS_META_DIA) n++;
      return n >= META_DIARIA;
    };
  }, [vocab, diario, livros, entradasLivros, metaAguaBatidaEm, melhoriasNoDia]);

  return { streak, tarefas, feitasHoje, streakExibido, diaCumpriuMeta, META_DIARIA };
}
