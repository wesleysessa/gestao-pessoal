import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { hoje } from "@/lib/data";
import { useVocabulario } from "@/features/vocabulario/hooks";
import { useDiario } from "@/features/diario/hooks";
import { useLivros } from "@/features/livros/hooks";
import { useCheckins } from "@/features/saude/hooks";

export const Route = createFileRoute("/_authenticated/")({
  component: Home,
});

function Home() {
  const { data: vocab = [] } = useVocabulario();
  const { data: diario = [] } = useDiario();
  const { data: livros = [] } = useLivros();
  const { data: checkins = [] } = useCheckins();

  const checkinFeito = checkins.some((c) => c.data === hoje());
  const diarioHoje = diario.some((e) => e.data === hoje());

  const stats = [
    { rotulo: "Palavras no vocabulário", valor: vocab.length, to: "/vocabulario" },
    { rotulo: "Entradas no diário", valor: diario.length, to: "/diario" },
    { rotulo: "Livros lidos", valor: livros.length, to: "/livros" },
    { rotulo: "Check-ins de saúde", valor: checkins.length, to: "/saude" },
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
            <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2.5">
              <span className="text-sm text-foreground">
                {checkinFeito ? "✓ Check-in de saúde feito" : "○ Check-in de saúde pendente"}
              </span>
              {!checkinFeito && (
                <Button asChild size="sm">
                  <Link to="/saude">Fazer agora</Link>
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2.5">
              <span className="text-sm text-foreground">
                {diarioHoje ? "✓ Diário escrito hoje" : "○ Diário ainda em branco hoje"}
              </span>
              {!diarioHoje && (
                <Button asChild size="sm">
                  <Link to="/diario">Escrever</Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
