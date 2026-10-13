import {
  IconChevronLeft,
  IconChevronRight,
  IconFootsteps,
  IconHeartbeat,
  IconMoon,
  IconPlugConnected,
  IconRefresh,
} from "@tabler/icons-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { AppIcon } from "@/components/app-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addDias, fmtData, hoje } from "@/lib/data";
import {
  useDadosGoogleHealth,
  useSincronizarGoogleHealth,
  useStatusGoogleHealth,
} from "@/features/google-health/hooks";
import { montarUrlAutorizacaoGoogleHealth } from "@/features/google-health/service";
import { GoogleHealthHistorico, type MetricaSaude } from "@/components/google-health-historico";

function fmtMinutos(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

const TOM_TILE = {
  teal: {
    bg: "bg-teal-50 dark:bg-teal-950/40",
    border: "border-teal-200 dark:border-teal-900",
    accent: "text-teal-600 dark:text-teal-400",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-900",
    accent: "text-rose-600 dark:text-rose-400",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-900",
    accent: "text-violet-600 dark:text-violet-400",
  },
} as const;

function TileMetrica({
  icon: Icon,
  valor,
  rotulo,
  tom,
  onClick,
  comparacao,
}: {
  icon: AppIcon;
  valor: string;
  rotulo: string;
  tom: keyof typeof TOM_TILE;
  onClick: () => void;
  comparacao: Comparacao | null;
}) {
  const cores = TOM_TILE[tom];
  return (
    <button
      type="button"
      onClick={onClick}
      title="Ver evolução"
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-3 text-left transition hover:brightness-95",
        cores.bg,
        cores.border,
      )}
    >
      <Icon className={cn("size-5", cores.accent)} stroke={2} />
      <div>
        <div className="text-lg font-bold leading-tight text-foreground">{valor}</div>
        <div className="text-[11px] leading-tight text-muted-foreground">{rotulo}</div>
      </div>
      {comparacao && (
        <div className="border-t border-black/5 pt-1.5 text-[11px] leading-tight dark:border-white/10">
          <div className="text-muted-foreground">média 30d: {comparacao.media}</div>
          <div
            className={cn(
              "font-semibold",
              comparacao.bom === null
                ? "text-muted-foreground"
                : comparacao.bom
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400",
            )}
          >
            {comparacao.texto}
          </div>
        </div>
      )}
    </button>
  );
}

type Comparacao = { media: string; texto: string; bom: boolean | null };

/**
 * Compara o valor do dia com a média dos 30 dias anteriores (o próprio dia
 * fica fora da média). `maiorEhMelhor` define a cor: passos e sono, quanto
 * mais melhor; frequência de repouso, quanto menos melhor.
 */
function comparar(
  dados: { data: string; valor: number | null }[],
  dia: string,
  valorDia: number,
  maiorEhMelhor: boolean,
  fmt: (v: number) => string,
  diaEmAndamento = false,
): Comparacao | null {
  const inicio = addDias(dia, -30);
  const valores = dados
    .filter((d) => d.data < dia && d.data >= inicio && d.valor != null)
    .map((d) => d.valor as number);
  if (valores.length < 3) return null;
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  // Dia ainda em andamento (passos de hoje): mostra o progresso, sem julgar.
  if (diaEmAndamento) {
    return {
      media: fmt(media),
      texto: `${Math.round((valorDia / media) * 100)}% da média até agora`,
      bom: null,
    };
  }
  const pct = ((valorDia - media) / media) * 100;
  if (Math.abs(pct) < 3) return { media: fmt(media), texto: "= na média", bom: null };
  const acima = pct > 0;
  return {
    media: fmt(media),
    texto: `${acima ? "▲" : "▼"} ${Math.abs(pct).toFixed(0)}% ${acima ? "acima" : "abaixo"}`,
    bom: acima === maiorEhMelhor,
  };
}

const DIAS_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/** "Hoje", "Ontem", "Anteontem" ou o dia da semana — sempre com a data. */
function rotuloDia(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number);
  const relativo =
    iso === hoje()
      ? "Hoje"
      : iso === addDias(hoje(), -1)
        ? "Ontem"
        : iso === addDias(hoje(), -2)
          ? "Anteontem"
          : DIAS_SEMANA[new Date(a, m - 1, d).getDay()];
  return `${relativo.charAt(0).toUpperCase()}${relativo.slice(1)} · ${fmtData(iso)}`;
}

/** Card de status/conexão do Google Health — usado na Home (topo). */
export function GoogleHealthCard() {
  const { data: status, isLoading } = useStatusGoogleHealth();
  // 90 dias: mesmo cache do gráfico de evolução, e cobre a média de 30 dias.
  const { data: dados = [] } = useDadosGoogleHealth(90);
  const sincronizar = useSincronizarGoogleHealth();
  const [historico, setHistorico] = useState<MetricaSaude | null>(null);
  // `dados` vem do mais recente pro mais antigo: 0 = último dia sincronizado
  // (hoje, normalmente); avançar o índice = voltar no tempo.
  const [indice, setIndice] = useState(0);
  const indiceValido = Math.min(indice, Math.max(dados.length - 1, 0));
  const hojeDados = dados[indiceValido];
  const podeVoltar = indiceValido < dados.length - 1;
  const podeAvancar = indiceValido > 0;
  const toqueInicioX = useRef<number | null>(null);

  function conectar() {
    try {
      window.location.href = montarUrlAutorizacaoGoogleHealth();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível iniciar a conexão.");
    }
  }

  if (isLoading) return null;

  return (
    <Card className="mb-5">
      <CardContent className="pt-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <IconPlugConnected className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Google Health</span>
          {status?.conectado && (
            <span className="text-xs font-medium text-green-600">conectado ✓</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {status?.conectado ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  sincronizar.mutate(undefined, { onError: (e: Error) => toast.error(e.message) })
                }
                disabled={sincronizar.isPending}
              >
                <IconRefresh className="size-3.5" />
                {sincronizar.isPending ? "Sincronizando…" : "Sincronizar agora"}
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={conectar}>
                {status ? "Reconectar" : "Conectar Google Health"}
              </Button>
            )}
          </div>
        </div>

        {status?.conectado === false && status.ultima_sincronizacao && (
          <p className="mb-2 text-xs text-muted-foreground">
            Sua conexão expirou — reconecte pra continuar sincronizando.
          </p>
        )}

        {status?.conectado && status.ultima_sincronizacao && (
          <p className="mb-2 text-xs text-muted-foreground">
            Última sincronização:{" "}
            {new Date(status.ultima_sincronizacao).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}

        {status?.conectado && hojeDados && (
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIndice(indiceValido + 1)}
                disabled={!podeVoltar}
                aria-label="Dia anterior"
                className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-25"
              >
                <IconChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setIndice(0)}
                disabled={!podeAvancar}
                title={podeAvancar ? "Voltar pro dia mais recente" : undefined}
                className="text-xs font-semibold text-foreground disabled:cursor-default"
              >
                {rotuloDia(hojeDados.data)}
              </button>
              <button
                type="button"
                onClick={() => setIndice(indiceValido - 1)}
                disabled={!podeAvancar}
                aria-label="Dia seguinte"
                className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-25"
              >
                <IconChevronRight className="size-4" />
              </button>
            </div>
            <div
              className="grid grid-cols-3 gap-2"
              // Deslizar o dedo pros lados também troca o dia.
              onTouchStart={(e) => (toqueInicioX.current = e.touches[0].clientX)}
              onTouchEnd={(e) => {
                if (toqueInicioX.current == null) return;
                const dx = e.changedTouches[0].clientX - toqueInicioX.current;
                toqueInicioX.current = null;
                if (dx > 50 && podeVoltar) setIndice(indiceValido + 1);
                else if (dx < -50 && podeAvancar) setIndice(indiceValido - 1);
              }}
            >
              {hojeDados.passos != null && (
                <TileMetrica
                  icon={IconFootsteps}
                  valor={hojeDados.passos.toLocaleString("pt-BR")}
                  rotulo="passos"
                  tom="teal"
                  onClick={() => setHistorico("passos")}
                  comparacao={comparar(
                    dados.map((d) => ({ data: d.data, valor: d.passos })),
                    hojeDados.data,
                    hojeDados.passos,
                    true,
                    (v) => Math.round(v).toLocaleString("pt-BR"),
                    hojeDados.data === hoje(),
                  )}
                />
              )}
              {hojeDados.frequencia_repouso != null && (
                <TileMetrica
                  icon={IconHeartbeat}
                  valor={`${hojeDados.frequencia_repouso} bpm`}
                  rotulo="freq. de repouso"
                  tom="rose"
                  onClick={() => setHistorico("frequencia_repouso")}
                  comparacao={comparar(
                    dados.map((d) => ({ data: d.data, valor: d.frequencia_repouso })),
                    hojeDados.data,
                    hojeDados.frequencia_repouso,
                    false,
                    (v) => `${v.toFixed(0)} bpm`,
                  )}
                />
              )}
              {hojeDados.sono_minutos != null && (
                <TileMetrica
                  icon={IconMoon}
                  valor={fmtMinutos(hojeDados.sono_minutos)}
                  rotulo="de sono"
                  tom="violet"
                  onClick={() => setHistorico("sono_minutos")}
                  comparacao={comparar(
                    dados.map((d) => ({ data: d.data, valor: d.sono_minutos })),
                    hojeDados.data,
                    hojeDados.sono_minutos,
                    true,
                    (v) => fmtMinutos(Math.round(v)),
                  )}
                />
              )}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              ‹ › ou deslize pra ver outros dias · toque num quadro pra ver a evolução
            </p>
          </div>
        )}
        {historico && (
          <GoogleHealthHistorico metrica={historico} onFechar={() => setHistorico(null)} />
        )}
      </CardContent>
    </Card>
  );
}
