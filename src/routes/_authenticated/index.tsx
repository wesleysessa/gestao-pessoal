import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  IconLanguage,
  IconNotebook,
  IconBooks,
  IconDroplet,
  IconHeartbeat,
  IconCalendar,
} from "@tabler/icons-react";
import { Card } from "@/components/ui/card";
import { FraseDoDia } from "@/components/frase-do-dia";
import type { AppIcon } from "@/components/app-icon";
import { addDias, dataLocalDe, hoje, segundaDaSemana } from "@/lib/data";
import { useVocabulario } from "@/features/vocabulario/hooks";
import { useDiario } from "@/features/diario/hooks";
import { useLivros } from "@/features/livros/hooks";
import { useCheckins } from "@/features/saude/hooks";
import { useAgua, useHidratacaoHoje } from "@/features/agua/hooks";
import { useStreakResumo } from "@/features/streak/hooks";

export const Route = createFileRoute("/_authenticated/")({
  component: Home,
});

type Metrica = { label: string; valor: string };

type CardStat = {
  rotulo: string;
  to: string;
  icon: AppIcon;
  bg: string;
  border: string;
  accent: string;
  feita?: boolean;
  metricas: Metrica[];
};

function litros(ml: number): string {
  return `${(ml / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L`;
}

/** Média por dia entre duas datas ISO (inclusive), contando dias sem registro como 0. */
function mediaPorDia(porDia: Map<string, number>, de: string, ate: string): number {
  let total = 0;
  let dias = 0;
  let cursor = de;
  while (cursor <= ate) {
    total += porDia.get(cursor) ?? 0;
    dias += 1;
    cursor = addDias(cursor, 1);
  }
  return dias ? total / dias : 0;
}

function Home() {
  const { data: vocab = [] } = useVocabulario();
  const { data: diario = [] } = useDiario();
  const { data: livros = [] } = useLivros();
  const { data: checkins = [] } = useCheckins();
  const { data: registrosAgua = [] } = useAgua();
  const { totalHoje: aguaHojeMl, progresso: hidratacaoProgresso } = useHidratacaoHoje();
  const { tarefas } = useStreakResumo();

  const feitaPorTo = useMemo(() => new Map(tarefas.map((t) => [t.to, t.feita])), [tarefas]);

  const hojeIso = hoje();
  const segunda = segundaDaSemana(hojeIso);
  const inicioMes = `${hojeIso.slice(0, 7)}-01`;

  const idiomasCount = useMemo(() => new Set(vocab.map((v) => v.idioma)).size, [vocab]);

  const diarioStats = useMemo(() => {
    const porDia = new Map<string, { soma: number; qtd: number }>();
    for (const e of diario) {
      if (e.nota == null) continue;
      const atual = porDia.get(e.data) ?? { soma: 0, qtd: 0 };
      atual.soma += e.nota;
      atual.qtd += 1;
      porDia.set(e.data, atual);
    }
    const medias = [...porDia.values()].map((v) => v.soma / v.qtd);
    const notaMedia = medias.length ? medias.reduce((a, b) => a + b, 0) / medias.length : null;
    const aprendizados = diario.filter((e) => e.aprendizado).length;
    return { notaMedia, aprendizados };
  }, [diario]);

  const aguaPorDia = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of registrosAgua) {
      const dia = dataLocalDe(r.registrado_em);
      map.set(dia, (map.get(dia) ?? 0) + r.quantidade_ml);
    }
    return map;
  }, [registrosAgua]);

  const aguaMediaSemana = useMemo(
    () => mediaPorDia(aguaPorDia, segunda, hojeIso),
    [aguaPorDia, segunda, hojeIso],
  );
  const aguaMediaMes = useMemo(
    () => mediaPorDia(aguaPorDia, inicioMes, hojeIso),
    [aguaPorDia, inicioMes, hojeIso],
  );

  const saudeSemana = useMemo(() => {
    const doSemana = checkins.filter((c) => c.data >= segunda && c.data <= hojeIso);
    const energias = doSemana.filter((c) => c.energia != null).map((c) => c.energia as number);
    const sonos = doSemana.filter((c) => c.sono != null).map((c) => c.sono as number);
    const mediaEnergia = energias.length
      ? energias.reduce((a, b) => a + b, 0) / energias.length
      : null;
    const mediaSono = sonos.length ? sonos.reduce((a, b) => a + b, 0) / sonos.length : null;
    return { mediaEnergia, mediaSono };
  }, [checkins, segunda, hojeIso]);

  const stats: CardStat[] = [
    {
      rotulo: "Vocabulário",
      to: "/vocabulario",
      icon: IconLanguage,
      bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
      border: "border-fuchsia-200 dark:border-fuchsia-900",
      accent: "text-fuchsia-600 dark:text-fuchsia-400",
      feita: feitaPorTo.get("/vocabulario"),
      metricas: [
        { label: "Idiomas", valor: String(idiomasCount) },
        { label: "Palavras", valor: String(vocab.length) },
      ],
    },
    {
      rotulo: "Diário",
      to: "/diario",
      icon: IconNotebook,
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-200 dark:border-amber-900",
      accent: "text-amber-600 dark:text-amber-400",
      feita: feitaPorTo.get("/diario"),
      metricas: [
        { label: "Total", valor: String(diario.length) },
        {
          label: "Nota média",
          valor: diarioStats.notaMedia != null ? diarioStats.notaMedia.toFixed(1) : "—",
        },
        { label: "Aprendizados", valor: String(diarioStats.aprendizados) },
      ],
    },
    {
      rotulo: "Livros",
      to: "/livros",
      icon: IconBooks,
      bg: "bg-rose-50 dark:bg-rose-950/40",
      border: "border-rose-200 dark:border-rose-900",
      accent: "text-rose-600 dark:text-rose-400",
      feita: feitaPorTo.get("/livros"),
      metricas: [{ label: "Total", valor: String(livros.length) }],
    },
    {
      rotulo: "Hidratação",
      to: "/agua",
      icon: IconDroplet,
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-200 dark:border-blue-900",
      accent: "text-blue-600 dark:text-blue-400",
      feita: feitaPorTo.get("/agua"),
      metricas: [
        { label: "Hoje", valor: hidratacaoProgresso != null ? `${hidratacaoProgresso}%` : "—" },
        { label: "Litros hoje", valor: litros(aguaHojeMl) },
        { label: "Média semana", valor: litros(aguaMediaSemana) },
        { label: "Média mês", valor: litros(aguaMediaMes) },
      ],
    },
    {
      rotulo: "Check-in Saúde",
      to: "/saude",
      icon: IconHeartbeat,
      bg: "bg-green-50 dark:bg-green-950/40",
      border: "border-green-200 dark:border-green-900",
      accent: "text-green-600 dark:text-green-400",
      feita: feitaPorTo.get("/saude"),
      metricas: [
        {
          label: "Energia (sem.)",
          valor: saudeSemana.mediaEnergia != null ? saudeSemana.mediaEnergia.toFixed(1) : "—",
        },
        {
          label: "Sono (sem.)",
          valor: saudeSemana.mediaSono != null ? `${saudeSemana.mediaSono.toFixed(1)}h` : "—",
        },
      ],
    },
    {
      rotulo: "Agenda Pessoal",
      to: "/agenda",
      icon: IconCalendar,
      bg: "bg-cyan-50 dark:bg-cyan-950/40",
      border: "border-cyan-200 dark:border-cyan-900",
      accent: "text-cyan-600 dark:text-cyan-400",
      metricas: [],
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <FraseDoDia />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.to} to={s.to}>
            <Card className={`h-full p-3.5 ${s.bg} ${s.border}`}>
              <div className="mb-2 flex items-center justify-between gap-1.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <s.icon className={`size-4 shrink-0 ${s.accent}`} stroke={2} />
                  <span className="truncate text-sm font-semibold text-foreground">{s.rotulo}</span>
                </div>
                {s.feita !== undefined && (
                  <span
                    className={`shrink-0 text-sm ${s.feita ? s.accent : "text-muted-foreground/40"}`}
                  >
                    {s.feita ? "✓" : "○"}
                  </span>
                )}
              </div>
              {s.metricas.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  {s.metricas.map((m) => (
                    <div key={m.label} className="flex items-baseline justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground">{m.label}</span>
                      <span className={`text-sm font-bold ${s.accent}`}>{m.valor}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
