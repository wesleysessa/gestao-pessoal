import { createFileRoute, Link } from "@tanstack/react-router";
import { IconCalendar, IconChevronRight } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { FraseDoDia } from "@/components/frase-do-dia";
import { useVocabulario } from "@/features/vocabulario/hooks";
import { useDiario } from "@/features/diario/hooks";
import { useLivros } from "@/features/livros/hooks";
import { useCheckins } from "@/features/saude/hooks";
import { useHidratacaoHoje } from "@/features/agua/hooks";
import { useStreakResumo } from "@/features/streak/hooks";

export const Route = createFileRoute("/_authenticated/")({
  component: Home,
});

function Home() {
  const { data: vocab = [] } = useVocabulario();
  const { data: diario = [] } = useDiario();
  const { data: livros = [] } = useLivros();
  const { data: checkins = [] } = useCheckins();
  const { progresso: hidratacaoProgresso } = useHidratacaoHoje();
  const { tarefas } = useStreakResumo();

  const stats = [
    {
      rotulo: "Vocabulário",
      valor: vocab.length,
      to: "/vocabulario",
      bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
      border: "border-fuchsia-200 dark:border-fuchsia-900",
      numero: "text-fuchsia-600 dark:text-fuchsia-400",
    },
    {
      rotulo: "Diário",
      valor: diario.length,
      to: "/diario",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-200 dark:border-amber-900",
      numero: "text-amber-600 dark:text-amber-400",
    },
    {
      rotulo: "Livros",
      valor: livros.length,
      to: "/livros",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      border: "border-rose-200 dark:border-rose-900",
      numero: "text-rose-600 dark:text-rose-400",
    },
    {
      rotulo: "Hidratação",
      valor: hidratacaoProgresso != null ? `${hidratacaoProgresso}%` : "—",
      to: "/agua",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-200 dark:border-blue-900",
      numero: "text-blue-600 dark:text-blue-400",
    },
    {
      rotulo: "Check-in Saúde",
      valor: checkins.length,
      to: "/saude",
      bg: "bg-green-50 dark:bg-green-950/40",
      border: "border-green-200 dark:border-green-900",
      numero: "text-green-600 dark:text-green-400",
    },
    {
      rotulo: "Agenda Pessoal",
      valor: null,
      to: "/agenda",
      bg: "bg-cyan-50 dark:bg-cyan-950/40",
      border: "border-cyan-200 dark:border-cyan-900",
      numero: "text-cyan-600 dark:text-cyan-400",
    },
  ] as const;

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <FraseDoDia />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-6">
        {stats.map((s) => (
          <Link key={s.to} to={s.to}>
            <Card className={`p-4 ${s.bg} ${s.border}`}>
              {s.valor == null ? (
                <IconCalendar className={`size-7 ${s.numero}`} stroke={2} />
              ) : (
                <div className={`text-3xl font-bold ${s.numero}`}>{s.valor}</div>
              )}
              <div className="text-xs text-muted-foreground">{s.rotulo}</div>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-3 text-base font-semibold text-foreground">Rotina de hoje</div>
          <div className="flex flex-col gap-2">
            {tarefas.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                className="flex items-center justify-between rounded-md bg-secondary px-3 py-2.5 transition hover:bg-secondary/70"
              >
                <span className="text-sm text-foreground">
                  {t.feita ? "✓" : "○"} {t.rotulo}
                </span>
                <IconChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
