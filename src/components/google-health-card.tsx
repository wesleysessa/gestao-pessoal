import {
  IconFootsteps,
  IconHeartbeat,
  IconMoon,
  IconPlugConnected,
  IconRefresh,
} from "@tabler/icons-react";
import { toast } from "sonner";
import type { AppIcon } from "@/components/app-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmtData, hoje } from "@/lib/data";
import {
  useDadosGoogleHealth,
  useSincronizarGoogleHealth,
  useStatusGoogleHealth,
} from "@/features/google-health/hooks";
import { montarUrlAutorizacaoGoogleHealth } from "@/features/google-health/service";

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
}: {
  icon: AppIcon;
  valor: string;
  rotulo: string;
  tom: keyof typeof TOM_TILE;
}) {
  const cores = TOM_TILE[tom];
  return (
    <div className={cn("flex flex-col gap-2 rounded-xl border p-3", cores.bg, cores.border)}>
      <Icon className={cn("size-5", cores.accent)} stroke={2} />
      <div>
        <div className="text-lg font-bold leading-tight text-foreground">{valor}</div>
        <div className="text-[11px] leading-tight text-muted-foreground">{rotulo}</div>
      </div>
    </div>
  );
}

/** Card de status/conexão do Google Health — usado na Home (topo). */
export function GoogleHealthCard() {
  const { data: status, isLoading } = useStatusGoogleHealth();
  const { data: dados = [] } = useDadosGoogleHealth();
  const sincronizar = useSincronizarGoogleHealth();
  const hojeDados = dados.find((d) => d.data === hoje()) ?? dados[0];

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
            <div className="grid grid-cols-3 gap-2">
              {hojeDados.passos != null && (
                <TileMetrica
                  icon={IconFootsteps}
                  valor={hojeDados.passos.toLocaleString("pt-BR")}
                  rotulo="passos"
                  tom="teal"
                />
              )}
              {hojeDados.frequencia_repouso != null && (
                <TileMetrica
                  icon={IconHeartbeat}
                  valor={`${hojeDados.frequencia_repouso} bpm`}
                  rotulo="freq. de repouso"
                  tom="rose"
                />
              )}
              {hojeDados.sono_minutos != null && (
                <TileMetrica
                  icon={IconMoon}
                  valor={fmtMinutos(hojeDados.sono_minutos)}
                  rotulo="de sono"
                  tom="violet"
                />
              )}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">({fmtData(hojeDados.data)})</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
