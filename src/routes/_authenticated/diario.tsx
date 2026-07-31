import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { IconNotebook, IconTrash } from "@tabler/icons-react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ds";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { fmtData, hoje } from "@/lib/data";
import {
  useCreateEntradaDiario,
  useDeleteEntradaDiario,
  useDiario,
  useUpdateEntradaDiario,
} from "@/features/diario/hooks";
import type { EntradaDiario } from "@/features/diario/types";

export const Route = createFileRoute("/_authenticated/diario")({
  component: Diario,
});

const notaChartConfig = {
  nota: { label: "Nota do dia", color: "var(--color-primary)" },
} satisfies ChartConfig;

/** Dias do mês corrente, do dia 1 até hoje (dias futuros não têm dado). */
function diasDoMesAteHoje(): string[] {
  const hojeDate = new Date();
  const dias: string[] = [];
  for (let d = 1; d <= hojeDate.getDate(); d++) {
    const dt = new Date(hojeDate.getFullYear(), hojeDate.getMonth(), d);
    dias.push(dt.toISOString().slice(0, 10));
  }
  return dias;
}

function Diario() {
  const { data: entradas = [], isLoading } = useDiario();
  const criar = useCreateEntradaDiario();
  const atualizar = useUpdateEntradaDiario();
  const remover = useDeleteEntradaDiario();

  const [editando, setEditando] = useState<EntradaDiario | null>(null);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [nota, setNota] = useState(0);

  function iniciarEdicao(e: EntradaDiario) {
    setEditando(e);
    setTitulo(e.titulo ?? "");
    setTexto(e.texto);
    setNota(e.nota ?? 0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    setEditando(null);
    setTitulo("");
    setTexto("");
    setNota(0);
  }

  function salvar() {
    if (!texto.trim()) return;
    const input = {
      titulo: titulo.trim() || null,
      texto: texto.trim(),
      nota: nota > 0 ? nota : null,
    };
    if (editando) {
      atualizar.mutate(
        { id: editando.id, input },
        {
          onSuccess: cancelarEdicao,
          onError: (e: Error) => toast.error(e.message),
        },
      );
    } else {
      criar.mutate(input, {
        onSuccess: cancelarEdicao,
        onError: (e: Error) => toast.error(e.message),
      });
    }
  }

  function excluir(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (editando?.id === id) cancelarEdicao();
    remover.mutate(id, { onError: (err: Error) => toast.error(err.message) });
  }

  const salvando = criar.isPending || atualizar.isPending;

  const notaPorDia = useMemo(() => {
    const somas = new Map<string, { soma: number; qtd: number }>();
    for (const e of entradas) {
      if (e.nota == null) continue;
      const atual = somas.get(e.data) ?? { soma: 0, qtd: 0 };
      atual.soma += e.nota;
      atual.qtd += 1;
      somas.set(e.data, atual);
    }
    const medias = new Map<string, number>();
    for (const [data, { soma, qtd }] of somas) medias.set(data, soma / qtd);
    return medias;
  }, [entradas]);

  const dadosGrafico = useMemo(
    () => diasDoMesAteHoje().map((data) => ({ data, nota: notaPorDia.get(data) })),
    [notaPorDia],
  );

  const mediaDoMes = useMemo(() => {
    const valores = [...notaPorDia.values()];
    if (valores.length === 0) return null;
    return valores.reduce((a, b) => a + b, 0) / valores.length;
  }, [notaPorDia]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <SectionHeader overline="Gestão Pessoal" title="Diário" />

      <Card className="mb-5">
        <CardContent className="pt-6">
          <div className="mb-3 space-y-1.5">
            <Label>
              {editando
                ? `Editando entrada de ${fmtData(editando.data)}`
                : `Entrada de ${fmtData(hoje())}`}
            </Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título (opcional)"
            />
          </div>
          <div className="mb-3 space-y-1.5">
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="O que marcou o seu dia?"
              className="min-h-[120px]"
            />
          </div>
          <div className="mb-3 space-y-1.5">
            <Label>Nota de produtividade (opcional)</Label>
            <StarRating value={nota} onChange={setNota} size={24} />
          </div>
          <div className="flex gap-2">
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Guardar entrada"}
            </Button>
            {editando && (
              <Button variant="ghost" onClick={cancelarEdicao}>
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {mediaDoMes != null && (
        <Card className="mb-5">
          <CardContent className="pt-6">
            <div className="mb-3.5 flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-foreground">Produtividade — mês atual</div>
              <div className="text-sm font-semibold text-primary">
                Média {mediaDoMes.toFixed(1)}
              </div>
            </div>
            <ChartContainer config={notaChartConfig} className="h-48 w-full">
              <LineChart data={dadosGrafico} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="data"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => v.slice(8, 10)}
                  minTickGap={16}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  width={24}
                  domain={[0, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(v: string) => fmtData(v as string)}
                      indicator="line"
                    />
                  }
                />
                <ReferenceLine
                  y={mediaDoMes}
                  stroke="var(--color-muted-foreground)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
                <Line
                  dataKey="nota"
                  type="monotone"
                  stroke="var(--color-nota)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : entradas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          <IconNotebook className="size-8" stroke={1.5} />
          <p className="text-sm">Seu diário está em branco. Escreva a primeira página.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entradas.map((e) => (
            <Card
              key={e.id}
              onClick={() => iniciarEdicao(e)}
              className={
                editando?.id === e.id
                  ? "cursor-pointer border-primary"
                  : "cursor-pointer transition hover:border-muted-foreground/40"
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs text-muted-foreground">{fmtData(e.data)}</span>
                    {e.titulo && (
                      <div className="text-base font-semibold text-foreground">{e.titulo}</div>
                    )}
                  </div>
                  <button
                    onClick={(ev) => excluir(e.id, ev)}
                    aria-label="Excluir"
                    className="shrink-0 text-muted-foreground transition hover:text-destructive"
                  >
                    <IconTrash className="size-4" />
                  </button>
                </div>
                {e.nota != null && (
                  <div className="mt-1.5">
                    <StarRating value={e.nota} size={14} />
                  </div>
                )}
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {e.texto}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
