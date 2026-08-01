import { useState } from "react";
import { IconChevronLeft, IconChevronRight, IconFlame, IconSnowflake } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useStreakResumo } from "@/features/streak/hooks";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function isoDoDia(ano: number, mesIdx0: number, dia: number) {
  return `${ano}-${String(mesIdx0 + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function StreakCalendarDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { streak, streakExibido, diaCumpriuMeta } = useStreakResumo();
  const agora = new Date();
  const [mesExibido, setMesExibido] = useState(
    () => new Date(agora.getFullYear(), agora.getMonth(), 1),
  );

  const ano = mesExibido.getFullYear();
  const mesIdx = mesExibido.getMonth();
  const ehMesAtual = ano === agora.getFullYear() && mesIdx === agora.getMonth();
  const hojeIso = isoDoDia(agora.getFullYear(), agora.getMonth(), agora.getDate());

  const primeiroDiaSemana = new Date(ano, mesIdx, 1).getDay();
  const totalDias = new Date(ano, mesIdx + 1, 0).getDate();
  const celulas: (number | null)[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="sr-only">Calendário da chama</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-1 text-center">
          <IconFlame
            className={cn(
              "size-12",
              streakExibido > 0 ? "fill-orange-500 text-orange-500" : "text-muted-foreground/40",
            )}
          />
          <div className="text-3xl font-bold text-foreground">{streakExibido}</div>
          <div className="text-sm text-muted-foreground">
            {streakExibido === 1 ? "dia de ofensiva" : "dias de ofensiva"}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span>Recorde: {streak?.recorde ?? 0}</span>
            {!!streak?.congelamentos_disponiveis && (
              <span className="flex items-center gap-1">
                <IconSnowflake className="size-3.5" />
                {streak.congelamentos_disponiveis} congelamento
                {streak.congelamentos_disponiveis > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <button
            onClick={() => setMesExibido(new Date(ano, mesIdx - 1, 1))}
            aria-label="Mês anterior"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <IconChevronLeft className="size-4" />
          </button>
          <div className="text-sm font-semibold text-foreground">
            {MESES[mesIdx]} {ano}
          </div>
          <button
            onClick={() => setMesExibido(new Date(ano, mesIdx + 1, 1))}
            disabled={ehMesAtual}
            aria-label="Próximo mês"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
          >
            <IconChevronRight className="size-4" />
          </button>
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1 text-center">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="text-[10px] font-medium uppercase text-muted-foreground">
              {d}
            </div>
          ))}
          {celulas.map((dia, i) => {
            if (dia == null) return <div key={`vazio-${i}`} />;
            const iso = isoDoDia(ano, mesIdx, dia);
            const cumpriu = iso <= hojeIso && diaCumpriuMeta(iso);
            const ehHoje = iso === hojeIso;
            return (
              <div key={iso} className="flex items-center justify-center py-0.5">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-xs font-medium",
                    cumpriu ? "bg-orange-500 text-white" : "text-muted-foreground",
                    ehHoje && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                  )}
                >
                  {dia}
                </span>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
