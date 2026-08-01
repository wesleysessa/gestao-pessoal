import { createFileRoute, Link } from "@tanstack/react-router";
import { IconChevronRight } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { useVocabulario } from "@/features/vocabulario/hooks";
import { useDiario } from "@/features/diario/hooks";
import { useLivros } from "@/features/livros/hooks";
import { useCheckins } from "@/features/saude/hooks";
import { useStreakResumo } from "@/features/streak/hooks";

export const Route = createFileRoute("/_authenticated/")({
  component: Home,
});

function Home() {
  const { data: vocab = [] } = useVocabulario();
  const { data: diario = [] } = useDiario();
  const { data: livros = [] } = useLivros();
  const { data: checkins = [] } = useCheckins();
  const { tarefas } = useStreakResumo();

  const stats = [
    { rotulo: "Vocabulário", valor: vocab.length, to: "/vocabulario" },
    { rotulo: "Diário", valor: diario.length, to: "/diario" },
    { rotulo: "Livros", valor: livros.length, to: "/livros" },
    { rotulo: "Check-in Saúde", valor: checkins.length, to: "/saude" },
  ] as const;

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.to} to={s.to}>
            <Card className="p-4">
              <div className="text-3xl font-bold text-primary">{s.valor}</div>
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
                  {t.feita ? `✓ ${t.rotulo} feito` : `○ ${t.rotulo} pendente — ${t.acao}`}
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
