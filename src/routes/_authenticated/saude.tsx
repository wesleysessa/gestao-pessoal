import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { IconHeartbeat, IconDroplet, IconX } from "@tabler/icons-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ds";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { fmtData, hoje } from "@/lib/data";
import { useCheckins, useUpsertCheckinHoje } from "@/features/saude/hooks";
import { useAgua, useCreateRegistroAgua, useDeleteRegistroAgua } from "@/features/agua/hooks";

export const Route = createFileRoute("/_authenticated/saude")({
  component: Saude,
});

const HUMORES = ["Péssimo", "Ruim", "Neutro", "Bom", "Ótimo"];

function Escala({
  valor,
  onEscolher,
  rotulos,
}: {
  valor: number;
  onEscolher: (n: number) => void;
  rotulos?: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onEscolher(n)}
          className={cn(
            "rounded-md border px-3 py-2 text-xs font-semibold transition",
            n === valor
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-transparent text-foreground",
          )}
        >
          {rotulos ? rotulos[n - 1] : n}
        </button>
      ))}
    </div>
  );
}

function ultimosNDias(n: number): string[] {
  const dias: string[] = [];
  const base = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(base);
    dt.setDate(base.getDate() - i);
    dias.push(dt.toISOString().slice(0, 10));
  }
  return dias;
}

const aguaChartConfig = {
  ml: { label: "Água (ml)", color: "var(--color-primary)" },
} satisfies ChartConfig;

const QUANTIDADES_RAPIDAS = [200, 300, 500];

function SecaoAgua() {
  const { data: registros = [] } = useAgua();
  const adicionar = useCreateRegistroAgua();
  const remover = useDeleteRegistroAgua();
  const [quantidadeCustom, setQuantidadeCustom] = useState("");

  const totalPorDia = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of registros) {
      const dia = r.registrado_em.slice(0, 10);
      map.set(dia, (map.get(dia) ?? 0) + r.quantidade_ml);
    }
    return map;
  }, [registros]);

  const dadosGrafico = useMemo(
    () => ultimosNDias(14).map((data) => ({ data, ml: totalPorDia.get(data) ?? 0 })),
    [totalPorDia],
  );

  const totalHoje = totalPorDia.get(hoje()) ?? 0;
  const registrosHoje = registros.filter((r) => r.registrado_em.slice(0, 10) === hoje());

  function adicionarQuantidade(ml: number) {
    if (ml <= 0) return;
    adicionar.mutate(ml, { onError: (e: Error) => toast.error(e.message) });
  }

  return (
    <Card className="mb-5">
      <CardContent className="pt-6">
        <div className="mb-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            <IconDroplet className="size-5 text-primary" />
            Água
          </div>
          <div className="text-sm font-semibold text-primary">
            {totalHoje.toLocaleString("pt-BR")} ml hoje
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {QUANTIDADES_RAPIDAS.map((ml) => (
            <Button key={ml} variant="outline" size="sm" onClick={() => adicionarQuantidade(ml)}>
              + {ml} ml
            </Button>
          ))}
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={1}
              value={quantidadeCustom}
              onChange={(e) => setQuantidadeCustom(e.target.value)}
              placeholder="ml"
              className="h-8 w-20"
            />
            <Button
              size="sm"
              disabled={!quantidadeCustom || Number(quantidadeCustom) <= 0}
              onClick={() => {
                adicionarQuantidade(Number(quantidadeCustom));
                setQuantidadeCustom("");
              }}
            >
              Adicionar
            </Button>
          </div>
        </div>

        {registrosHoje.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {registrosHoje.map((r) => (
              <span
                key={r.id}
                className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
              >
                {r.quantidade_ml} ml ·{" "}
                {new Date(r.registrado_em).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                <button
                  onClick={() =>
                    remover.mutate(r.id, { onError: (e: Error) => toast.error(e.message) })
                  }
                  aria-label="Excluir"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <IconX className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <ChartContainer config={aguaChartConfig} className="h-48 w-full">
          <LineChart data={dadosGrafico} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="data"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={(v: string) => v.slice(8, 10) + "/" + v.slice(5, 7)}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              width={36}
              tickFormatter={(v: number) => v.toLocaleString("pt-BR")}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(v: string) => fmtData(v as string)}
                  indicator="line"
                />
              }
            />
            <Line
              dataKey="ml"
              type="monotone"
              stroke="var(--color-ml)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function Saude() {
  const { data: checkins = [], isLoading } = useCheckins();
  const salvar = useUpsertCheckinHoje();

  const registroHoje = checkins.find((c) => c.data === hoje());

  const [humor, setHumor] = useState(0);
  const [energia, setEnergia] = useState(0);
  const [sono, setSono] = useState("");
  const [obs, setObs] = useState("");

  useEffect(() => {
    if (!registroHoje) return;
    setHumor(registroHoje.humor);
    setEnergia(registroHoje.energia ?? 0);
    setSono(registroHoje.sono != null ? String(registroHoje.sono) : "");
    setObs(registroHoje.obs ?? "");
    // roda só quando os dados carregam pela 1ª vez, não a cada digitação
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registroHoje?.data]);

  function salvarCheckin() {
    if (!humor) return;
    salvar.mutate(
      {
        humor,
        energia: energia || null,
        sono: sono === "" ? null : Number(sono),
        obs: obs.trim() || null,
      },
      { onError: (e: Error) => toast.error(e.message) },
    );
  }

  const ultimos14 = useMemo(
    () => [...checkins].sort((a, b) => a.data.localeCompare(b.data)).slice(-14),
    [checkins],
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <SectionHeader overline="Gestão Pessoal" title="Saúde" />

      <Card className="mb-5">
        <CardContent className="pt-6">
          <div className="mb-3.5 flex flex-wrap items-center gap-2 text-base font-semibold text-foreground">
            Como estou me sentindo hoje?
            {registroHoje && (
              <span className="text-xs font-medium text-green-600">registrado — pode ajustar</span>
            )}
          </div>
          <div className="mb-3.5 space-y-1.5">
            <Label>Humor</Label>
            <Escala valor={humor} onEscolher={setHumor} rotulos={HUMORES} />
          </div>
          <div className="mb-3.5 space-y-1.5">
            <Label>Energia (1 = esgotado · 5 = a mil)</Label>
            <Escala valor={energia} onEscolher={setEnergia} />
          </div>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <div className="mb-3 space-y-1.5">
              <Label>Horas de sono</Label>
              <Input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={sono}
                onChange={(e) => setSono(e.target.value)}
                placeholder="ex.: 7.5"
              />
            </div>
            <div className="mb-3 space-y-1.5">
              <Label>Observação (opcional)</Label>
              <Input
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="ex.: caminhei 40 min"
              />
            </div>
          </div>
          <Button onClick={salvarCheckin} disabled={!humor || salvar.isPending}>
            {salvar.isPending
              ? "Salvando…"
              : registroHoje
                ? "Atualizar check-in"
                : "Salvar check-in"}
          </Button>
        </CardContent>
      </Card>

      <SecaoAgua />

      {ultimos14.length > 1 && (
        <Card className="mb-5">
          <CardContent className="pt-6">
            <div className="mb-2.5 text-xs uppercase tracking-wide text-muted-foreground">
              Humor — últimos {ultimos14.length} registros
            </div>
            <div className="flex h-20 items-end gap-1">
              {ultimos14.map((c) => (
                <div
                  key={c.data}
                  title={`${fmtData(c.data)} — ${HUMORES[c.humor - 1]}`}
                  className={cn(
                    "min-w-2 flex-1 rounded-t",
                    c.humor >= 4 ? "bg-green-500" : c.humor === 3 ? "bg-amber-400" : "bg-primary",
                  )}
                  style={{ height: `${(c.humor / 5) * 100}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : checkins.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          <IconHeartbeat className="size-8" stroke={1.5} />
          <p className="text-sm">
            Nenhum check-in ainda. Trinta segundos por dia bastam para enxergar padrões.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {checkins.slice(0, 10).map((c) => (
            <Card key={c.data}>
              <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3.5 text-sm text-foreground">
                <strong className="min-w-[84px]">{fmtData(c.data)}</strong>
                <span>Humor: {HUMORES[c.humor - 1]}</span>
                {!!c.energia && <span>Energia: {c.energia}/5</span>}
                {c.sono != null && <span>Sono: {c.sono}h</span>}
                {c.obs && <span className="w-full text-xs text-muted-foreground">{c.obs}</span>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
