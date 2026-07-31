import { createFileRoute, Link } from "@tanstack/react-router";
import { IconFlame, IconSnowflake, IconChevronRight } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { hoje } from "@/lib/data";
import { useVocabulario } from "@/features/vocabulario/hooks";
import { useDiario } from "@/features/diario/hooks";
import { useLivros } from "@/features/livros/hooks";
import { useCheckins } from "@/features/saude/hooks";
import { useStreak } from "@/features/streak/hooks";

export const Route = createFileRoute("/_authenticated/")({
  component: Home,
});

const META_DIARIA = 3;

function Home() {
  const { data: vocab = [] } = useVocabulario();
  const { data: diario = [] } = useDiario();
  const { data: livros = [] } = useLivros();
  const { data: checkins = [] } = useCheckins();
  const { data: streak } = useStreak();

  const tarefas = [
    {
      rotulo: "Vocabulário",
      feita: vocab.some((v) => v.created_at.slice(0, 10) === hoje()),
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
      rotulo: "Saúde",
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

  const stats = [
    { rotulo: "Palavras no vocabulário", valor: vocab.length, to: "/vocabulario" },
    { rotulo: "Entradas no diário", valor: diario.length, to: "/diario" },
    { rotulo: "Livros lidos", valor: livros.length, to: "/livros" },
    { rotulo: "Check-ins de saúde", valor: checkins.length, to: "/saude" },
  ] as const;

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <Card className="mb-5">
        <CardContent className="flex items-center gap-4 pt-6">
          <IconFlame
            className={cn(
              "size-10 shrink-0",
              streakExibido > 0 ? "fill-orange-500 text-orange-500" : "text-muted-foreground/40",
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="text-2xl font-bold text-foreground">
              {streakExibido} {streakExibido === 1 ? "dia" : "dias"} seguidos
            </div>
            <div className="text-xs text-muted-foreground">
              Recorde: {streak?.recorde ?? 0} · hoje: {feitasHoje} de {tarefas.length} (precisa de{" "}
              {META_DIARIA})
            </div>
          </div>
          {!!streak?.congelamentos_disponiveis && (
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
              <IconSnowflake className="size-3.5" />
              {streak.congelamentos_disponiveis}
            </div>
          )}
        </CardContent>
      </Card>

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
