import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { IconArrowsShuffle, IconTimeline } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { hoje } from "@/lib/data";
import { useEventosLinha, usePeriodos } from "@/features/linha-do-tempo/hooks";
import { corInfo } from "@/features/linha-do-tempo/types";
import { caminhoDoAno, fatoDoDia, fmtAno } from "@/features/linha-do-tempo/util";

/** Card da Home: um fato por dia, com o que veio antes e depois dele. */
export function LinhaDoTempoCard() {
  const navigate = useNavigate();
  const { data: eventos = [] } = useEventosLinha();
  const { data: periodos = [] } = usePeriodos();
  const [idManual, setIdManual] = useState<string | null>(null);

  const doDia = useMemo(() => fatoDoDia(eventos, hoje()), [eventos]);
  const evento = (idManual && eventos.find((e) => e.id === idManual)) || doDia;
  // A lista já vem em ordem cronológica.
  const i = evento ? eventos.findIndex((e) => e.id === evento.id) : -1;
  const antes = i > 0 ? eventos[i - 1] : null;
  const depois = i >= 0 && i < eventos.length - 1 ? eventos[i + 1] : null;
  const caminho = evento ? caminhoDoAno(evento.ano, periodos) : [];
  const fase = caminho[caminho.length - 1];

  function proxima() {
    const opcoes = eventos.filter((e) => e.id !== evento?.id);
    if (opcoes.length === 0) return;
    setIdManual(opcoes[Math.floor(Math.random() * opcoes.length)].id);
  }

  return (
    <Card className="mb-5 cursor-pointer" onClick={() => navigate({ to: "/linha-do-tempo" })}>
      <CardContent className="pt-6">
        <div className="mb-2 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <IconTimeline className="size-3.5" />
            Linha do Tempo
          </div>
          {eventos.length > 0 && (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <span
                title={`${eventos.length} fato${eventos.length === 1 ? "" : "s"} na linha do tempo`}
                className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-secondary-foreground"
              >
                ({String(eventos.length).padStart(2, "0")})
              </span>
              {eventos.length > 1 && (
                <button
                  type="button"
                  onClick={proxima}
                  aria-label="Próximo fato"
                  title="Próximo fato"
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <IconArrowsShuffle className="size-3.5" />
                  Próxima
                </button>
              )}
            </div>
          )}
        </div>
        {evento ? (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-primary">
                {fmtAno(evento.ano, evento.unidade)}
              </span>
              {fase && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    corInfo(fase.cor).chip,
                  )}
                >
                  {fase.nome}
                </span>
              )}
            </div>
            <p className="mt-1 text-[15px] font-light italic leading-relaxed text-foreground">
              {evento.titulo}
            </p>
            {(antes || depois) && (
              <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                {antes && (
                  <p className="truncate">
                    ↑ Antes: {antes.titulo} ({fmtAno(antes.ano, antes.unidade)})
                  </p>
                )}
                {depois && (
                  <p className="truncate">
                    ↓ Depois: {depois.titulo} ({fmtAno(depois.ano, depois.unidade)})
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            Nenhum fato ainda. Toque aqui para começar sua linha do tempo da História.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
