import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  IconCalendarEvent,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconMapPin,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { SectionHeader, FAB } from "@/components/ds";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { fmtData, hoje } from "@/lib/data";
import {
  useCreateEvento,
  useDeleteEvento,
  useEventos,
  useUpdateEvento,
} from "@/features/agenda/hooks";
import { expandirOcorrencias } from "@/features/agenda/service";
import {
  CORES_EVENTO,
  CORES_EVENTO_ORDEM,
  LEMBRETE_OPCOES,
  RECORRENCIAS,
  RECORRENCIA_LABEL,
  type CorEvento,
  type Evento,
  type NovoEvento,
  type Ocorrencia,
  type Recorrencia,
} from "@/features/agenda/types";

export const Route = createFileRoute("/_authenticated/agenda")({
  component: Agenda,
});

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

/** Postgres devolve "HH:MM:SS" — input[type=time] quer "HH:MM". */
function hhmm(v: string | null): string {
  return v ? v.slice(0, 5) : "";
}

function horarioOcorrencia(o: Ocorrencia): string {
  if (o.evento.dia_inteiro) return "Dia inteiro";
  const ini = hhmm(o.evento.hora_inicio);
  const fim = hhmm(o.evento.hora_fim);
  return fim ? `${ini} – ${fim}` : ini;
}

type FormValues = {
  titulo: string;
  descricao: string;
  local: string;
  diaInteiro: boolean;
  data: string;
  dataFim: string;
  horaInicio: string;
  horaFim: string;
  cor: CorEvento;
  recorrencia: Recorrencia;
  recorrenciaFim: string;
  lembreteMinutos: number | null;
};

function valoresVazios(dataPadrao: string): FormValues {
  return {
    titulo: "",
    descricao: "",
    local: "",
    diaInteiro: false,
    data: dataPadrao,
    dataFim: "",
    horaInicio: "",
    horaFim: "",
    cor: "blueberry",
    recorrencia: "nenhuma",
    recorrenciaFim: "",
    lembreteMinutos: null,
  };
}

function valoresDoEvento(e: Evento): FormValues {
  return {
    titulo: e.titulo,
    descricao: e.descricao ?? "",
    local: e.local ?? "",
    diaInteiro: e.dia_inteiro,
    data: e.data,
    dataFim: e.data_fim ?? "",
    horaInicio: hhmm(e.hora_inicio),
    horaFim: hhmm(e.hora_fim),
    cor: e.cor as CorEvento,
    recorrencia: e.recorrencia as Recorrencia,
    recorrenciaFim: e.recorrencia_fim ?? "",
    lembreteMinutos: e.lembrete_minutos,
  };
}

function EventoDialog({
  aberto,
  onOpenChange,
  evento,
  dataPadrao,
}: {
  aberto: boolean;
  onOpenChange: (o: boolean) => void;
  evento: Evento | null;
  dataPadrao: string;
}) {
  const criar = useCreateEvento();
  const atualizar = useUpdateEvento();
  const remover = useDeleteEvento();
  const [v, setV] = useState<FormValues>(() => valoresVazios(dataPadrao));

  useEffect(() => {
    if (!aberto) return;
    setV(evento ? valoresDoEvento(evento) : valoresVazios(dataPadrao));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, evento]);

  const set = <K extends keyof FormValues>(key: K, val: FormValues[K]) =>
    setV((prev) => ({ ...prev, [key]: val }));

  const salvando = criar.isPending || atualizar.isPending;

  function salvar() {
    if (!v.titulo.trim()) {
      toast.error("Dê um título pro evento");
      return;
    }
    if (!v.diaInteiro && !v.horaInicio) {
      toast.error("Informe o horário de início");
      return;
    }
    const input: NovoEvento = {
      titulo: v.titulo.trim(),
      descricao: v.descricao.trim() || null,
      local: v.local.trim() || null,
      dia_inteiro: v.diaInteiro,
      data: v.data,
      data_fim: v.diaInteiro && v.dataFim ? v.dataFim : null,
      hora_inicio: v.diaInteiro ? null : v.horaInicio,
      hora_fim: v.diaInteiro ? null : v.horaFim || null,
      cor: v.cor,
      recorrencia: v.recorrencia,
      recorrencia_fim: v.recorrencia !== "nenhuma" && v.recorrenciaFim ? v.recorrenciaFim : null,
      lembrete_minutos: v.lembreteMinutos,
    };
    const onOk = () => onOpenChange(false);
    const onErr = (e: Error) => toast.error(e.message);
    if (evento) {
      atualizar.mutate({ id: evento.id, input }, { onSuccess: onOk, onError: onErr });
    } else {
      criar.mutate(input, { onSuccess: onOk, onError: onErr });
    }
  }

  function excluir() {
    if (!evento) return;
    remover.mutate(evento.id, {
      onSuccess: () => onOpenChange(false),
      onError: (e: Error) => toast.error(e.message),
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{evento ? "Agenda - Editar Evento" : "Agenda - Novo Evento"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input
              value={v.titulo}
              onChange={(e) => set("titulo", e.target.value)}
              placeholder="ex.: Reunião com o time"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                [false, "Com horário"],
                [true, "Dia inteiro"],
              ] as [boolean, string][]
            ).map(([val, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => set("diaInteiro", val)}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm font-medium transition",
                  v.diaInteiro === val
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>{v.diaInteiro ? "De" : "Data"}</Label>
              <Input type="date" value={v.data} onChange={(e) => set("data", e.target.value)} />
            </div>
            {v.diaInteiro && (
              <div className="space-y-1.5">
                <Label>Até (opcional)</Label>
                <Input
                  type="date"
                  value={v.dataFim}
                  min={v.data}
                  onChange={(e) => set("dataFim", e.target.value)}
                />
              </div>
            )}
          </div>

          {!v.diaInteiro && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Início</Label>
                <Input
                  type="time"
                  value={v.horaInicio}
                  onChange={(e) => set("horaInicio", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fim (opcional)</Label>
                <Input
                  type="time"
                  value={v.horaFim}
                  onChange={(e) => set("horaFim", e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Local (opcional)</Label>
            <Input
              value={v.local}
              onChange={(e) => set("local", e.target.value)}
              placeholder="ex.: Escritório"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Descrição (opcional)</Label>
            <Textarea
              value={v.descricao}
              onChange={(e) => set("descricao", e.target.value)}
              className="min-h-[70px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {CORES_EVENTO_ORDEM.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("cor", c)}
                  aria-label={CORES_EVENTO[c].label}
                  title={CORES_EVENTO[c].label}
                  className={cn(
                    "size-7 rounded-full transition",
                    CORES_EVENTO[c].dot,
                    v.cor === c &&
                      cn("ring-2 ring-offset-2 ring-offset-card", CORES_EVENTO[c].ring),
                  )}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Repetir</Label>
              <Select
                value={v.recorrencia}
                onValueChange={(val) => set("recorrencia", val as Recorrencia)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECORRENCIAS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {RECORRENCIA_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {v.recorrencia !== "nenhuma" && (
              <div className="space-y-1.5">
                <Label>Repetir até (opcional)</Label>
                <Input
                  type="date"
                  value={v.recorrenciaFim}
                  min={v.data}
                  onChange={(e) => set("recorrenciaFim", e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Lembrete</Label>
            <Select
              value={v.lembreteMinutos == null ? "none" : String(v.lembreteMinutos)}
              onValueChange={(val) => set("lembreteMinutos", val === "none" ? null : Number(val))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEMBRETE_OPCOES.map((o) => (
                  <SelectItem key={o.label} value={o.valor == null ? "none" : String(o.valor)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Por enquanto é só uma anotação — lembrete por notificação é o próximo passo.
            </p>
          </div>

          <div className="mt-1 flex gap-2">
            <Button onClick={salvar} disabled={salvando} className="flex-1">
              {salvando ? "Salvando…" : "Salvar"}
            </Button>
            {evento && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={excluir}
                disabled={remover.isPending}
                aria-label="Excluir evento"
                className="text-destructive hover:text-destructive"
              >
                <IconTrash className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Agenda() {
  const { data: eventos = [], isLoading } = useEventos();

  const agora = new Date();
  const [mesExibido, setMesExibido] = useState(
    () => new Date(agora.getFullYear(), agora.getMonth(), 1),
  );
  const [diaSelecionado, setDiaSelecionado] = useState(hoje());
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<Evento | null>(null);

  const ano = mesExibido.getFullYear();
  const mesIdx = mesExibido.getMonth();
  const hojeIso = hoje();

  const primeiroDiaSemana = new Date(ano, mesIdx, 1).getDay();
  const totalDias = new Date(ano, mesIdx + 1, 0).getDate();
  const celulas: (number | null)[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];

  const ocorrenciasDoMes = useMemo(
    () => expandirOcorrencias(eventos, isoDoDia(ano, mesIdx, 1), isoDoDia(ano, mesIdx, totalDias)),
    [eventos, ano, mesIdx, totalDias],
  );

  const coresPorDia = useMemo(() => {
    const map = new Map<string, CorEvento[]>();
    for (const o of ocorrenciasDoMes) {
      const cores = map.get(o.dataOcorrencia) ?? [];
      cores.push(o.evento.cor as CorEvento);
      map.set(o.dataOcorrencia, cores);
    }
    return map;
  }, [ocorrenciasDoMes]);

  const ocorrenciasDoDia = useMemo(
    () =>
      expandirOcorrencias(eventos, diaSelecionado, diaSelecionado).sort((a, b) => {
        if (a.evento.dia_inteiro !== b.evento.dia_inteiro) return a.evento.dia_inteiro ? -1 : 1;
        return (a.evento.hora_inicio ?? "").localeCompare(b.evento.hora_inicio ?? "");
      }),
    [eventos, diaSelecionado],
  );

  function abrirNovo() {
    setEditando(null);
    setDialogAberto(true);
  }

  function abrirEdicao(evento: Evento) {
    setEditando(evento);
    setDialogAberto(true);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <SectionHeader overline="Gestão Pessoal" title="Agenda" />

      <Card className="mb-4">
        <CardContent className="pt-5">
          <div className="mb-3 flex items-center justify-between">
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
              aria-label="Próximo mês"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            >
              <IconChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="text-[10px] font-medium uppercase text-muted-foreground">
                {d}
              </div>
            ))}
            {celulas.map((dia, i) => {
              if (dia == null) return <div key={`vazio-${i}`} />;
              const iso = isoDoDia(ano, mesIdx, dia);
              const ehHoje = iso === hojeIso;
              const ehSelecionado = iso === diaSelecionado;
              const cores = coresPorDia.get(iso) ?? [];
              return (
                <button
                  key={iso}
                  onClick={() => setDiaSelecionado(iso)}
                  className="flex flex-col items-center gap-0.5 py-0.5"
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full text-xs font-medium transition",
                      ehSelecionado
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted",
                      !ehSelecionado &&
                        ehHoje &&
                        "ring-2 ring-primary ring-offset-2 ring-offset-card",
                    )}
                  >
                    {dia}
                  </span>
                  <span className="flex h-1.5 items-center gap-0.5">
                    {cores.slice(0, 3).map((c, idx) => (
                      <span
                        key={idx}
                        className={cn("size-1.5 rounded-full", CORES_EVENTO[c].dot)}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="mb-3 text-sm font-semibold text-foreground">
        {fmtData(diaSelecionado)}
        {diaSelecionado === hojeIso && (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">hoje</span>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : ocorrenciasDoDia.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          <IconCalendarEvent className="size-8" stroke={1.5} />
          <p className="text-sm">Nenhum evento neste dia.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {ocorrenciasDoDia.map((o) => (
            <Card
              key={`${o.evento.id}-${o.dataOcorrencia}`}
              onClick={() => abrirEdicao(o.evento)}
              className="cursor-pointer transition hover:border-muted-foreground/40"
            >
              <CardContent className="flex items-start gap-3 p-3.5">
                <span
                  className={cn(
                    "mt-1.5 size-2.5 shrink-0 rounded-full",
                    CORES_EVENTO[o.evento.cor as CorEvento].dot,
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {o.evento.titulo}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <IconClock className="size-3.5" />
                    {horarioOcorrencia(o)}
                  </div>
                  {o.evento.local && (
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <IconMapPin className="size-3.5" />
                      {o.evento.local}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FAB label="Novo evento" onClick={abrirNovo} />

      <EventoDialog
        aberto={dialogAberto}
        onOpenChange={setDialogAberto}
        evento={editando}
        dataPadrao={diaSelecionado}
      />
    </div>
  );
}
