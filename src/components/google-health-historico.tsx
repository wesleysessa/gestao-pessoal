import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { addDias, fmtData, hoje } from "@/lib/data";
import { useDadosGoogleHealth } from "@/features/google-health/hooks";

export type MetricaSaude = "passos" | "frequencia_repouso" | "sono_minutos";

function fmtMinutos(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

const INFO: Record<
  MetricaSaude,
  { titulo: string; cor: string; fmt: (v: number) => string; tipo: "barra" | "linha" }
> = {
  passos: {
    titulo: "Passos",
    cor: "#14b8a6",
    fmt: (v) => Math.round(v).toLocaleString("pt-BR"),
    tipo: "barra",
  },
  frequencia_repouso: {
    titulo: "Frequência de repouso",
    cor: "#f43f5e",
    fmt: (v) => `${v.toFixed(0)} bpm`,
    tipo: "linha",
  },
  sono_minutos: {
    titulo: "Sono",
    cor: "#8b5cf6",
    fmt: fmtMinutos,
    tipo: "linha",
  },
};

const PERIODOS = [7, 30, 90] as const;

/** Gráfico de evolução + média de uma métrica do Google Health, aberto ao tocar no tile. */
export function GoogleHealthHistorico({
  metrica,
  onFechar,
}: {
  metrica: MetricaSaude;
  onFechar: () => void;
}) {
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]>(30);
  const { data: dados = [], isLoading } = useDadosGoogleHealth(90);
  const info = INFO[metrica];

  const { pontos, media, minimo, maximo } = useMemo(() => {
    const inicio = addDias(hoje(), -(periodo - 1));
    const pontos = dados
      .filter((d) => d.data >= inicio && d[metrica] != null)
      .map((d) => ({ data: d.data, valor: d[metrica] as number }))
      .sort((a, b) => a.data.localeCompare(b.data));
    // Passos de hoje ainda estão crescendo — não entram na média/mín/máx.
    const base = metrica === "passos" ? pontos.filter((p) => p.data !== hoje()) : pontos;
    const valores = base.map((p) => p.valor);
    return {
      pontos,
      media: valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null,
      minimo: valores.length ? Math.min(...valores) : null,
      maximo: valores.length ? Math.max(...valores) : null,
    };
  }, [dados, metrica, periodo]);

  const config = { valor: { label: info.titulo, color: info.cor } } satisfies ChartConfig;

  const eixoX = (
    <XAxis
      dataKey="data"
      tickLine={false}
      axisLine={false}
      tick={{ fontSize: 11 }}
      tickFormatter={(v: string) => `${v.slice(8, 10)}/${v.slice(5, 7)}`}
      minTickGap={16}
    />
  );
  const eixoY = (
    <YAxis
      tickLine={false}
      axisLine={false}
      tick={{ fontSize: 11 }}
      width={metrica === "passos" ? 44 : 36}
      domain={metrica === "passos" ? [0, "auto"] : ["auto", "auto"]}
      tickFormatter={(v: number) =>
        metrica === "sono_minutos" ? `${Math.round(v / 60)}h` : v.toLocaleString("pt-BR")
      }
    />
  );
  const tooltip = (
    <ChartTooltip
      content={
        <ChartTooltipContent
          labelFormatter={(_, p) => fmtData(p?.[0]?.payload?.data ?? "")}
          formatter={(v) => info.fmt(Number(v))}
        />
      }
    />
  );
  const linhaMedia = media != null && (
    <ReferenceLine
      y={media}
      stroke="var(--color-muted-foreground)"
      strokeWidth={1.5}
      strokeDasharray="4 4"
    />
  );

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{info.titulo}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1.5">
          {PERIODOS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriodo(p)}
              className={cn(
                "rounded-md border px-3 py-1 text-xs font-medium transition",
                periodo === p
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input text-foreground",
              )}
            >
              {p} dias
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { rotulo: "Média", valor: media },
            { rotulo: "Mínimo", valor: minimo },
            { rotulo: "Máximo", valor: maximo },
          ].map((s) => (
            <div key={s.rotulo} className="rounded-lg border border-border p-2">
              <div className="text-base font-bold text-foreground">
                {s.valor != null ? info.fmt(s.valor) : "—"}
              </div>
              <div className="text-[11px] text-muted-foreground">{s.rotulo}</div>
            </div>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : pontos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados nesse período.</p>
        ) : (
          <ChartContainer config={config} className="h-56 w-full">
            {info.tipo === "barra" ? (
              <BarChart data={pontos} margin={{ left: -8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                {eixoX}
                {eixoY}
                {tooltip}
                {linhaMedia}
                <Bar dataKey="valor" fill="var(--color-valor)" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={pontos} margin={{ left: -8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                {eixoX}
                {eixoY}
                {tooltip}
                {linhaMedia}
                <Line
                  dataKey="valor"
                  type="monotone"
                  stroke="var(--color-valor)"
                  strokeWidth={2}
                  dot={periodo <= 30 ? { r: 3 } : false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            )}
          </ChartContainer>
        )}

        <p className="text-[11px] text-muted-foreground">
          Linha tracejada = média do período.
          {metrica === "passos" && " Hoje fica fora da média (o dia ainda não terminou)."}
        </p>
      </DialogContent>
    </Dialog>
  );
}
