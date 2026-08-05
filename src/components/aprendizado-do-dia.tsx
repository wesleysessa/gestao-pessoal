import { IconArrowsShuffle, IconBulb } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { fmtData } from "@/lib/data";
import { useAprendizadoDoDia } from "@/features/diario/hooks";

export function AprendizadoDoDia() {
  const {
    entrada,
    total,
    temAprendizados,
    temMaisDeUm,
    proxima,
    navegandoManualmente,
    voltarADoDia,
  } = useAprendizadoDoDia();

  return (
    <Card className="mb-5">
      <CardContent className="pt-6">
        <div className="mb-2 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <IconBulb className="size-3.5" />
            Aprendizado / Curiosidade
          </div>
          {temAprendizados && (
            <div className="flex items-center gap-1.5">
              <span
                title={`${total} aprendizado${total === 1 ? "" : "s"} no banco`}
                className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-secondary-foreground"
              >
                ({String(total).padStart(2, "0")})
              </span>
              {temMaisDeUm && (
                <button
                  type="button"
                  onClick={proxima}
                  aria-label="Próximo aprendizado"
                  title="Próximo aprendizado"
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <IconArrowsShuffle className="size-3.5" />
                  Próxima
                </button>
              )}
            </div>
          )}
        </div>
        {temAprendizados && entrada ? (
          <>
            <p className="text-[15px] font-light italic leading-relaxed text-foreground">
              {entrada.aprendizado}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {fmtData(entrada.data)}
              {navegandoManualmente && (
                <>
                  {" · "}
                  <button
                    type="button"
                    onClick={voltarADoDia}
                    className="font-medium text-primary hover:underline"
                  >
                    ↺ voltar ao do dia
                  </button>
                </>
              )}
            </p>
          </>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            Nenhum aprendizado registrado ainda. Escreva um no Diário quando aprender algo novo.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
