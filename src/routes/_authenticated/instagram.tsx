import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { IconBrandInstagram, IconCheck, IconPencil, IconX } from "@tabler/icons-react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from "recharts";
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
import { addDias, fmtData, hoje } from "@/lib/data";
import {
  useDeleteUsoRede,
  useMetasRede,
  useSalvarMetaRede,
  useSalvarUsoRede,
  useUsoRede,
} from "@/features/redes/hooks";
import { metaVigenteEm } from "@/features/redes/service";

export const Route = createFileRoute("/_authenticated/instagram")({
  component: Instagram,
});

const VERDE = "#22c55e";
const VERMELHO = "#ef4444";

const chartConfig = { minutos: { label: "Minutos", color: VERDE } } satisfies ChartConfig;

function Instagram() {
  const { data: registros = [], isLoading } = useUsoRede();
  const { data: metas = [] } = useMetasRede();
  const salvarUso = useSalvarUsoRede();
  const remover = useDeleteUsoRede();
  const salvarMeta = useSalvarMetaRede();

  const [data, setData] = useState(hoje());
  const [minutos, setMinutos] = useState("");
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [novaMeta, setNovaMeta] = useState("");

  const metaAtual = metaVigenteEm(metas, hoje());
  const porData = useMemo(() => new Map(registros.map((r) => [r.data, r])), [registros]);
  const registroHoje = porData.get(hoje());

  /** Dentro do limite que valia naquele dia (mudar o limite não reescreve o passado). */
  const dentro = (dataISO: string, min: number) => {
    const meta = metaVigenteEm(metas, dataISO);
    return meta == null || min <= meta;
  };

  const stats = useMemo(() => {
    const ultimos = (n: number) =>
      registros.filter((r) => r.data > addDias(hoje(), -n) && r.data <= hoje());
    const media = (lista: typeof registros) =>
      lista.length ? lista.reduce((a, r) => a + r.minutos, 0) / lista.length : null;
    const r30 = ultimos(30);

    // Sequência: dias seguidos dentro do limite, contando de hoje pra trás.
    // Hoje ainda sem registro não quebra (o dia não acabou); qualquer outro
    // dia sem registro, ou acima do limite, encerra a contagem.
    let sequencia = 0;
    let dia = porData.has(hoje()) ? hoje() : addDias(hoje(), -1);
    for (;;) {
      const r = porData.get(dia);
      if (!r || !dentro(dia, r.minutos)) break;
      sequencia++;
      dia = addDias(dia, -1);
    }

    return {
      media7: media(ultimos(7)),
      media30: media(r30),
      dentro30: r30.filter((r) => dentro(r.data, r.minutos)).length,
      registrados30: r30.length,
      sequencia,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registros, metas, porData]);

  const grafico = useMemo(() => {
    const pontos = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDias(hoje(), -i);
      const r = porData.get(d);
      pontos.push({ data: d, minutos: r?.minutos ?? null, meta: metaVigenteEm(metas, d) });
    }
    return pontos;
  }, [porData, metas]);

  function salvar() {
    const min = Number(minutos);
    if (minutos === "" || !Number.isFinite(min) || min < 0 || min > 1440) {
      toast.error("Informe os minutos de uso (0 a 1440)");
      return;
    }
    salvarUso.mutate(
      { data, minutos: Math.round(min) },
      {
        onSuccess: () => {
          setMinutos("");
          setData(hoje());
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  function salvarLimite() {
    const min = Number(novaMeta);
    if (!Number.isFinite(min) || min <= 0) {
      toast.error("Informe o limite em minutos");
      return;
    }
    salvarMeta.mutate(Math.round(min), {
      onSuccess: () => setEditandoMeta(false),
      onError: (e: Error) => toast.error(e.message),
    });
  }

  const usadoHoje = registroHoje?.minutos ?? null;
  const pctHoje = usadoHoje != null && metaAtual ? Math.min(usadoHoje / metaAtual, 1) * 100 : 0;
  const estourouHoje = usadoHoje != null && metaAtual != null && usadoHoje > metaAtual;

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <SectionHeader overline="Gestão Pessoal" title="Instagram" />

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="mb-3 flex items-center gap-2">
            <IconBrandInstagram className="size-5 text-pink-600" />
            <span className="text-sm font-semibold text-foreground">Hoje</span>
            <div className="ml-auto text-xs text-muted-foreground">
              {editandoMeta ? (
                <span className="flex items-center gap-1.5">
                  Limite
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={novaMeta}
                    onChange={(e) => setNovaMeta(e.target.value)}
                    className="h-7 w-16 text-xs"
                    autoFocus
                  />
                  min
                  <button
                    type="button"
                    onClick={salvarLimite}
                    aria-label="Salvar limite"
                    className="text-green-600"
                  >
                    <IconCheck className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditandoMeta(false)}
                    aria-label="Cancelar"
                  >
                    <IconX className="size-4" />
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setNovaMeta(String(metaAtual ?? 15));
                    setEditandoMeta(true);
                  }}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Limite: <strong className="text-foreground">{metaAtual ?? "—"} min/dia</strong>
                  <IconPencil className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {usadoHoje == null ? (
            <p className="mb-1 text-sm text-muted-foreground">Ainda não registrado hoje.</p>
          ) : (
            <>
              <div className="mb-1.5 flex items-baseline gap-1.5">
                <span
                  className={cn(
                    "text-3xl font-bold",
                    estourouHoje ? "text-red-600 dark:text-red-400" : "text-foreground",
                  )}
                >
                  {usadoHoje}
                </span>
                <span className="text-sm text-muted-foreground">
                  de {metaAtual ?? "—"} min{" "}
                  {estourouHoje
                    ? `· passou ${usadoHoje - (metaAtual ?? 0)} min do limite`
                    : "· dentro do limite ✓"}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    estourouHoje ? "bg-red-500" : "bg-green-500",
                  )}
                  style={{ width: `${estourouHoje ? 100 : pctHoje}%` }}
                />
              </div>
            </>
          )}

          <div className="mt-4 grid grid-cols-[auto_1fr_auto] items-end gap-2">
            <div className="space-y-1.5">
              <Label>Dia</Label>
              <Input
                type="date"
                value={data}
                max={hoje()}
                onChange={(e) => setData(e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tempo de uso (min)</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={minutos}
                onChange={(e) => setMinutos(e.target.value)}
                placeholder={porData.get(data) ? String(porData.get(data)!.minutos) : "ex.: 12"}
                onKeyDown={(e) => e.key === "Enter" && salvar()}
              />
            </div>
            <Button onClick={salvar} disabled={salvarUso.isPending}>
              {porData.has(data) ? "Atualizar" : "Registrar"}
            </Button>
          </div>
          <div className="mt-2 flex gap-1.5">
            {[
              { rotulo: "Hoje", valor: hoje() },
              { rotulo: "Ontem", valor: addDias(hoje(), -1) },
            ].map((op) => (
              <button
                key={op.rotulo}
                type="button"
                onClick={() => setData(op.valor)}
                className={cn(
                  "rounded-md border px-2.5 py-0.5 text-xs font-medium transition",
                  data === op.valor
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input text-foreground",
                )}
              >
                {op.rotulo}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Onde ver o tempo: no Instagram, Perfil → ☰ → <strong>Seu tempo</strong>; no Android,
            Configurações → <strong>Bem-estar digital</strong>; no iPhone, Ajustes →{" "}
            <strong>Tempo de Uso</strong>. Registrar de novo o mesmo dia substitui o valor.
          </p>
        </CardContent>
      </Card>

      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        {[
          {
            valor: `${stats.sequencia}`,
            rotulo: stats.sequencia === 1 ? "dia seguido no limite" : "dias seguidos no limite",
          },
          {
            valor: stats.media7 != null ? `${Math.round(stats.media7)} min` : "—",
            rotulo: "média 7 dias",
          },
          {
            valor: stats.registrados30 ? `${stats.dentro30}/${stats.registrados30}` : "—",
            rotulo: "dias no limite (30d)",
          },
        ].map((s) => (
          <div key={s.rotulo} className="rounded-xl border border-border bg-card p-3">
            <div className="text-lg font-bold text-foreground">{s.valor}</div>
            <div className="text-[11px] leading-tight text-muted-foreground">{s.rotulo}</div>
          </div>
        ))}
      </div>

      {registros.length > 0 && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Últimos 30 dias</span>
              {stats.media30 != null && (
                <span className="text-xs text-muted-foreground">
                  média {Math.round(stats.media30)} min
                </span>
              )}
            </div>
            <ChartContainer config={chartConfig} className="h-48 w-full">
              <BarChart data={grafico} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="data"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => `${v.slice(8, 10)}/${v.slice(5, 7)}`}
                  minTickGap={16}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={32} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, p) => fmtData(p?.[0]?.payload?.data ?? "")}
                      formatter={(v) => `${v} min`}
                    />
                  }
                />
                {metaAtual != null && (
                  <ReferenceLine
                    y={metaAtual}
                    stroke="var(--color-muted-foreground)"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                )}
                <Bar dataKey="minutos" radius={[4, 4, 0, 0]}>
                  {grafico.map((p) => (
                    <Cell
                      key={p.data}
                      fill={p.meta != null && (p.minutos ?? 0) > p.meta ? VERMELHO : VERDE}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Linha tracejada = limite. Barra vermelha = passou do limite naquele dia.
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : registros.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          <IconBrandInstagram className="size-8" stroke={1.5} />
          <p className="text-sm">Nenhum dia registrado ainda. Registre o tempo de hoje acima.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {registros.slice(0, 30).map((r) => {
            const ok = dentro(r.data, r.minutos);
            return (
              <div
                key={r.id}
                onClick={() => {
                  setData(r.data);
                  setMinutos(String(r.minutos));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 transition hover:border-muted-foreground/40"
              >
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    ok ? "bg-green-500" : "bg-red-500",
                  )}
                />
                <span className="text-sm text-foreground">{fmtData(r.data)}</span>
                <span
                  className={cn(
                    "ml-auto text-sm font-semibold",
                    ok ? "text-foreground" : "text-red-600 dark:text-red-400",
                  )}
                >
                  {r.minutos} min
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    remover.mutate(r.id, { onError: (err: Error) => toast.error(err.message) });
                  }}
                  aria-label="Excluir registro"
                  className="text-muted-foreground transition hover:text-destructive"
                >
                  <IconX className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
