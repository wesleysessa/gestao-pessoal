import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  IconAlertTriangle,
  IconCalendarEvent,
  IconChevronLeft,
  IconChevronRight,
  IconCircle,
  IconCircleCheck,
  IconClock,
  IconDotsVertical,
  IconFlag,
  IconLayoutGrid,
  IconMapPin,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { SectionHeader, FAB } from "@/components/ds";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { addDias, fmtData, hoje, segundaDaSemana } from "@/lib/data";
import {
  useConclusoes,
  useDesmarcarConcluido,
  useEventos,
  useMarcarConcluido,
  useUpdateEvento,
} from "@/features/agenda/hooks";
import { expandirOcorrencias } from "@/features/agenda/service";
import {
  CORES_EVENTO,
  type CorEvento,
  type Evento,
  type NovoEvento,
  type Ocorrencia,
} from "@/features/agenda/types";
import { EventoDialog, FotosDoCard } from "@/features/agenda/components/evento-dialog";
import { hhmm, sincronizarComHT } from "@/features/agenda/util";

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
function chaveOcorrencia(eventoId: string, data: string): string {
  return `${eventoId}|${data}`;
}

function horarioOcorrencia(o: Ocorrencia): string {
  if (o.evento.aniversario) return "Aniversário 🎂";
  if (o.evento.dia_inteiro) return "Dia inteiro";
  const ini = hhmm(o.evento.hora_inicio);
  const fim = hhmm(o.evento.hora_fim);
  return fim ? `${ini} – ${fim}` : ini;
}

const DIAS_SEMANA_QUADRO = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

/** Card de uma ocorrência — reaproveitado na lista do dia (Modo Calendário) e nas colunas do Quadro da Semana. */
function CardOcorrencia({
  o,
  concluido,
  atrasado,
  onClick,
  onToggleConcluido,
  acaoExtra,
  mostrarData,
}: {
  o: Ocorrencia;
  concluido: boolean;
  atrasado: boolean;
  onClick: () => void;
  onToggleConcluido: () => void;
  acaoExtra?: ReactNode;
  /** Mostra a data junto do horário — usado nos resultados de busca, que misturam vários dias. */
  mostrarData?: boolean;
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer transition hover:border-muted-foreground/40",
        o.evento.destaque && "border-primary",
        atrasado && "border-destructive/40",
      )}
    >
      <CardContent className="flex items-start gap-2 p-3">
        {o.evento.aniversario ? (
          <span className="mt-0.5 shrink-0 text-sm leading-none">🎂</span>
        ) : (
          <span
            className={cn(
              "mt-1.5 size-2.5 shrink-0 rounded-full",
              CORES_EVENTO[o.evento.cor as CorEvento].dot,
            )}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 truncate text-sm font-semibold text-foreground">
            {o.evento.destaque && <span className="shrink-0">🔝</span>}
            {o.evento.radar && <span className="shrink-0">👁️</span>}
            {o.evento.escopo === "profissional" && (
              <span className="shrink-0" title="Profissional — replicado no Home & Tech">
                💼
              </span>
            )}
            <span className={cn("truncate", concluido && "text-muted-foreground line-through")}>
              {o.evento.titulo}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <IconClock className="size-3.5" />
            {mostrarData
              ? `${fmtData(o.dataOcorrencia)} · ${horarioOcorrencia(o)}`
              : horarioOcorrencia(o)}
            {atrasado && <span className="ml-1 font-semibold text-destructive">Atrasado</span>}
          </div>
          {o.evento.local && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <IconMapPin className="size-3.5" />
              {o.evento.local}
            </div>
          )}
          <FotosDoCard eventoId={o.evento.id} />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {acaoExtra}
          {!o.evento.aniversario && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleConcluido();
              }}
              aria-label={concluido ? "Desmarcar concluído" : "Marcar concluído"}
              title={concluido ? "Desmarcar concluído" : "Marcar concluído"}
              className="text-muted-foreground transition hover:text-primary"
            >
              {concluido ? (
                <IconCircleCheck className="size-5 text-primary" />
              ) : (
                <IconCircle className="size-5" />
              )}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Menu "⋯" — mover um evento não-recorrente para outro dia da semana em exibição no Quadro. */
function MenuMoverDia({
  evento,
  dataAtual,
  diasDaSemana,
  onMover,
}: {
  evento: Evento;
  dataAtual: string;
  diasDaSemana: { iso: string; label: string }[];
  onMover: (novaData: string) => void;
}) {
  const recorrente = evento.recorrencia !== "nenhuma";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label="Mover para outro dia"
          title="Mover para outro dia"
          className="text-muted-foreground transition hover:text-primary"
        >
          <IconDotsVertical className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {recorrente ? (
          <DropdownMenuItem disabled>
            Evento recorrente — edite a data no Modo Calendário
          </DropdownMenuItem>
        ) : (
          diasDaSemana
            .filter((d) => d.iso !== dataAtual)
            .map((d) => (
              <DropdownMenuItem key={d.iso} onClick={() => onMover(d.iso)}>
                Mover para {d.label}, {fmtData(d.iso)}
              </DropdownMenuItem>
            ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Grupo fixo "Radar" — mesmo componente usado no Modo Calendário e no Quadro da Semana. */
function GrupoRadar({
  ocorrencias,
  conclusaoPorChave,
  hojeIso,
  diasDaSemana,
  abrirEdicao,
  alternarConcluido,
  moverEvento,
}: {
  ocorrencias: Ocorrencia[];
  conclusaoPorChave: Map<string, string>;
  hojeIso: string;
  diasDaSemana: { iso: string; label: string }[];
  abrirEdicao: (evento: Evento) => void;
  alternarConcluido: (o: Ocorrencia) => void;
  moverEvento: (evento: Evento, novaData: string) => void;
}) {
  if (ocorrencias.length === 0) return null;
  return (
    <Card className="mb-4 border-primary/40 bg-primary/5">
      <CardContent className="p-3.5">
        <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-primary">
          👁️ Radar
        </div>
        <div className="flex flex-col gap-2">
          {ocorrencias.map((o) => {
            const concluido = conclusaoPorChave.has(chaveOcorrencia(o.evento.id, o.dataOcorrencia));
            const atrasado = !concluido && !o.evento.aniversario && o.dataOcorrencia < hojeIso;
            return (
              <CardOcorrencia
                key={`radar-${o.evento.id}-${o.dataOcorrencia}`}
                o={o}
                concluido={concluido}
                atrasado={atrasado}
                onClick={() => abrirEdicao(o.evento)}
                onToggleConcluido={() => alternarConcluido(o)}
                acaoExtra={
                  <MenuMoverDia
                    evento={o.evento}
                    dataAtual={o.dataOcorrencia}
                    diasDaSemana={diasDaSemana}
                    onMover={(novaData) => moverEvento(o.evento, novaData)}
                  />
                }
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function Agenda() {
  const { data: eventos = [], isLoading } = useEventos();
  const { data: conclusoes = [] } = useConclusoes();
  const marcarConcluido = useMarcarConcluido();
  const desmarcarConcluido = useDesmarcarConcluido();
  const atualizarEvento = useUpdateEvento();

  const conclusaoPorChave = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of conclusoes) map.set(chaveOcorrencia(c.evento_id, c.data), c.id);
    return map;
  }, [conclusoes]);

  function alternarConcluido(o: Ocorrencia) {
    const idExistente = conclusaoPorChave.get(chaveOcorrencia(o.evento.id, o.dataOcorrencia));
    if (idExistente) {
      desmarcarConcluido.mutate(idExistente, { onError: (e: Error) => toast.error(e.message) });
      sincronizarComHT({ acao: "desconcluir", compromissoHtId: o.evento.compromisso_ht_id });
    } else {
      marcarConcluido.mutate(
        { eventoId: o.evento.id, data: o.dataOcorrencia },
        { onError: (e: Error) => toast.error(e.message) },
      );
      sincronizarComHT({ acao: "concluir", compromissoHtId: o.evento.compromisso_ht_id });
    }
  }

  /** Move um evento não-recorrente pra outro dia (usado só no Quadro da Semana). */
  function moverEvento(evento: Evento, novaData: string) {
    const input: NovoEvento = {
      titulo: evento.titulo,
      descricao: evento.descricao,
      local: evento.local,
      dia_inteiro: evento.dia_inteiro,
      data: novaData,
      data_fim: evento.data_fim,
      hora_inicio: evento.hora_inicio,
      hora_fim: evento.hora_fim,
      cor: evento.cor,
      recorrencia: evento.recorrencia,
      recorrencia_fim: evento.recorrencia_fim,
      lembrete_minutos: evento.lembrete_minutos,
      aniversario: evento.aniversario,
      destaque: evento.destaque,
      radar: evento.radar,
      escopo: evento.escopo,
    };
    atualizarEvento.mutate(
      { id: evento.id, input },
      {
        onSuccess: () => {
          toast.success(`"${evento.titulo}" movido para ${fmtData(novaData)}`);
          sincronizarComHT({ acao: "upsert", eventoId: evento.id });
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  const [modo, setModo] = useState<"calendario" | "quadro">("calendario");
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [busca, setBusca] = useState("");

  const agora = new Date();
  const [mesExibido, setMesExibido] = useState(
    () => new Date(agora.getFullYear(), agora.getMonth(), 1),
  );
  const [diaSelecionado, setDiaSelecionado] = useState(hoje());
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<Evento | null>(null);
  const [weekStart, setWeekStart] = useState(() => segundaDaSemana(hoje()));

  const ano = mesExibido.getFullYear();
  const mesIdx = mesExibido.getMonth();
  const hojeIso = hoje();

  const diasDaSemana = useMemo(
    () => DIAS_SEMANA_QUADRO.map((label, i) => ({ iso: addDias(weekStart, i), label })),
    [weekStart],
  );

  const ocorrenciasDaSemana = useMemo(
    () => expandirOcorrencias(eventos, weekStart, addDias(weekStart, 6)),
    [eventos, weekStart],
  );

  // Concluído vai pro topo (entre concluídos, por horário); os demais seguem
  // destaque → dia inteiro → horário, como antes.
  const ordenarOcorrencias = useCallback(
    (a: Ocorrencia, b: Ocorrencia) => {
      const aConcluido = conclusaoPorChave.has(chaveOcorrencia(a.evento.id, a.dataOcorrencia));
      const bConcluido = conclusaoPorChave.has(chaveOcorrencia(b.evento.id, b.dataOcorrencia));
      if (aConcluido !== bConcluido) return aConcluido ? -1 : 1;
      if (aConcluido && bConcluido) {
        return (a.evento.hora_inicio ?? "").localeCompare(b.evento.hora_inicio ?? "");
      }
      if (a.evento.destaque !== b.evento.destaque) return a.evento.destaque ? -1 : 1;
      if (a.evento.dia_inteiro !== b.evento.dia_inteiro) return a.evento.dia_inteiro ? -1 : 1;
      return (a.evento.hora_inicio ?? "").localeCompare(b.evento.hora_inicio ?? "");
    },
    [conclusaoPorChave],
  );

  // Radar já aparece no grupo fixo — não duplica nas colunas do dia.
  const ocorrenciasPorDiaQuadro = useMemo(() => {
    const map = new Map<string, Ocorrencia[]>();
    for (const o of ocorrenciasDaSemana) {
      if (o.evento.radar) continue;
      const arr = map.get(o.dataOcorrencia) ?? [];
      arr.push(o);
      map.set(o.dataOcorrencia, arr);
    }
    for (const arr of map.values()) arr.sort(ordenarOcorrencias);
    return map;
  }, [ocorrenciasDaSemana, ordenarOcorrencias]);

  const radarDaSemana = useMemo(
    () =>
      ocorrenciasDaSemana
        .filter((o) => o.evento.radar)
        .sort((a, b) => a.dataOcorrencia.localeCompare(b.dataOcorrencia)),
    [ocorrenciasDaSemana],
  );

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

  const marcasPorDia = useMemo(() => {
    const map = new Map<string, { cor: CorEvento; aniversario: boolean }[]>();
    for (const o of ocorrenciasDoMes) {
      const marcas = map.get(o.dataOcorrencia) ?? [];
      marcas.push({ cor: o.evento.cor as CorEvento, aniversario: o.evento.aniversario });
      map.set(o.dataOcorrencia, marcas);
    }
    return map;
  }, [ocorrenciasDoMes]);

  // Radar já aparece no grupo fixo — não duplica na lista do dia.
  const ocorrenciasDoDia = useMemo(
    () =>
      expandirOcorrencias(eventos, diaSelecionado, diaSelecionado)
        .filter((o) => !o.evento.radar)
        .sort(ordenarOcorrencias),
    [eventos, diaSelecionado, ordenarOcorrencias],
  );

  /** Eventos passados (últimos 60 dias) sem conclusão — candidatos a reagendar. Aniversário não entra. */
  const pendencias = useMemo(() => {
    const inicio = addDias(hojeIso, -60);
    const fim = addDias(hojeIso, -1);
    return expandirOcorrencias(eventos, inicio, fim)
      .filter(
        (o) =>
          !o.evento.aniversario &&
          !conclusaoPorChave.has(chaveOcorrencia(o.evento.id, o.dataOcorrencia)),
      )
      .sort((a, b) => a.dataOcorrencia.localeCompare(b.dataOcorrencia));
  }, [eventos, hojeIso, conclusaoPorChave]);

  // Busca por título/descrição/local — vale pra qualquer data, passada ou
  // futura (não só o mês/semana em exibição), pra achar "aquele lançamento
  // que não lembro se fiz".
  const eventosDaBusca = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return [];
    return eventos.filter((e) =>
      [e.titulo, e.descricao, e.local].some((campo) => campo?.toLowerCase().includes(termo)),
    );
  }, [eventos, busca]);

  const resultadosBusca = useMemo(() => {
    if (eventosDaBusca.length === 0) return [];
    const inicio = addDias(hojeIso, -365);
    const fim = addDias(hojeIso, 730);
    return expandirOcorrencias(eventosDaBusca, inicio, fim).sort((a, b) =>
      a.dataOcorrencia.localeCompare(b.dataOcorrencia),
    );
  }, [eventosDaBusca, hojeIso]);

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
      <div className="mb-1 flex items-start justify-between gap-2">
        <SectionHeader overline="Gestão Pessoal" title="Agenda" />
        <div className="mt-1 flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setBuscaAberta((v) => !v);
              if (buscaAberta) setBusca("");
            }}
            aria-label="Buscar evento"
            title="Buscar evento"
            className={cn(
              "flex size-8 items-center justify-center rounded-md border transition",
              buscaAberta
                ? "border-primary bg-primary/10 text-primary"
                : "border-input text-muted-foreground hover:bg-muted hover:text-primary",
            )}
          >
            <IconSearch className="size-4" />
          </button>
          <Link
            to="/prioridades"
            aria-label="Lista de Prioridades"
            title="Lista de Prioridades"
            className="flex size-8 items-center justify-center rounded-md border border-input text-muted-foreground transition hover:bg-muted hover:text-primary"
          >
            <IconFlag className="size-4" />
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setModo((m) => (m === "calendario" ? "quadro" : "calendario"))}
          >
            <IconLayoutGrid className="size-3.5" />
            {modo === "calendario" ? "Quadro da Semana" : "Modo Calendário"}
          </Button>
        </div>
      </div>

      {buscaAberta && (
        <div className="relative mb-4">
          <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, descrição ou local..."
            className="pl-8"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              aria-label="Limpar busca"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <IconX className="size-3.5" />
            </button>
          )}
        </div>
      )}

      {busca.trim() ? (
        <div className="flex flex-col gap-2">
          {resultadosBusca.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
              <IconSearch className="size-8" stroke={1.5} />
              <p className="text-sm">Nenhum evento encontrado com esse termo.</p>
            </div>
          ) : (
            resultadosBusca.map((o) => {
              const concluido = conclusaoPorChave.has(
                chaveOcorrencia(o.evento.id, o.dataOcorrencia),
              );
              const atrasado = !concluido && !o.evento.aniversario && o.dataOcorrencia < hojeIso;
              return (
                <CardOcorrencia
                  key={`busca-${o.evento.id}-${o.dataOcorrencia}`}
                  o={o}
                  concluido={concluido}
                  atrasado={atrasado}
                  onClick={() => abrirEdicao(o.evento)}
                  onToggleConcluido={() => alternarConcluido(o)}
                  mostrarData
                />
              );
            })
          )}
        </div>
      ) : (
        <>
          {modo === "calendario" && (
            <>
              {pendencias.length > 0 && (
                <Card className="mb-4 border-destructive/40 bg-destructive/5">
                  <CardContent className="p-3.5">
                    <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-destructive">
                      <IconAlertTriangle className="size-4" />
                      Pendências ({pendencias.length})
                    </div>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Passaram sem conclusão — toque pra editar, mudar a data ou virar prioridade.
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {pendencias.map((o) => (
                        <button
                          key={chaveOcorrencia(o.evento.id, o.dataOcorrencia)}
                          type="button"
                          onClick={() => abrirEdicao(o.evento)}
                          className="flex items-center justify-between gap-2 rounded-md bg-card px-2.5 py-1.5 text-left text-xs transition hover:bg-muted"
                        >
                          <span className="truncate font-medium text-foreground">
                            {o.evento.titulo}
                          </span>
                          <span className="shrink-0 text-muted-foreground">
                            {fmtData(o.dataOcorrencia)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

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
                      <div
                        key={d}
                        className="text-[10px] font-medium uppercase text-muted-foreground"
                      >
                        {d}
                      </div>
                    ))}
                    {celulas.map((dia, i) => {
                      if (dia == null) return <div key={`vazio-${i}`} />;
                      const iso = isoDoDia(ano, mesIdx, dia);
                      const ehHoje = iso === hojeIso;
                      const ehSelecionado = iso === diaSelecionado;
                      const marcas = marcasPorDia.get(iso) ?? [];
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
                          <span className="flex h-2.5 items-center gap-0.5">
                            {marcas.slice(0, 3).map((m, idx) =>
                              m.aniversario ? (
                                <span key={idx} className="text-[10px] leading-none">
                                  🎂
                                </span>
                              ) : (
                                <span
                                  key={idx}
                                  className={cn("size-1.5 rounded-full", CORES_EVENTO[m.cor].dot)}
                                />
                              ),
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <GrupoRadar
                ocorrencias={radarDaSemana}
                conclusaoPorChave={conclusaoPorChave}
                hojeIso={hojeIso}
                diasDaSemana={diasDaSemana}
                abrirEdicao={abrirEdicao}
                alternarConcluido={alternarConcluido}
                moverEvento={moverEvento}
              />

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
                  {ocorrenciasDoDia.map((o) => {
                    const concluido = conclusaoPorChave.has(
                      chaveOcorrencia(o.evento.id, o.dataOcorrencia),
                    );
                    const atrasado =
                      !concluido && !o.evento.aniversario && o.dataOcorrencia < hojeIso;
                    return (
                      <CardOcorrencia
                        key={`${o.evento.id}-${o.dataOcorrencia}`}
                        o={o}
                        concluido={concluido}
                        atrasado={atrasado}
                        onClick={() => abrirEdicao(o.evento)}
                        onToggleConcluido={() => alternarConcluido(o)}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}

          {modo === "quadro" && (
            <>
              <div className="mb-4 flex items-center justify-between rounded-md border border-border bg-card p-2">
                <button
                  onClick={() => setWeekStart((d) => addDias(d, -7))}
                  aria-label="Semana anterior"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <IconChevronLeft className="size-4" />
                </button>
                <span className="text-xs font-semibold text-foreground sm:text-sm">
                  {fmtData(weekStart)} a {fmtData(addDias(weekStart, 6))}
                </span>
                <button
                  onClick={() => setWeekStart((d) => addDias(d, 7))}
                  aria-label="Próxima semana"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <IconChevronRight className="size-4" />
                </button>
              </div>

              <GrupoRadar
                ocorrencias={radarDaSemana}
                conclusaoPorChave={conclusaoPorChave}
                hojeIso={hojeIso}
                diasDaSemana={diasDaSemana}
                abrirEdicao={abrirEdicao}
                alternarConcluido={alternarConcluido}
                moverEvento={moverEvento}
              />

              {isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              ) : (
                <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
                  {diasDaSemana.map((d) => {
                    const doDia = ocorrenciasPorDiaQuadro.get(d.iso) ?? [];
                    return (
                      <div
                        key={d.iso}
                        className={cn(
                          "flex w-[78vw] shrink-0 flex-col gap-2 rounded-md border border-t-4 border-border bg-secondary/40 p-2.5 sm:w-64",
                          d.iso === hojeIso && "border-t-primary",
                        )}
                      >
                        <div className="px-0.5 text-xs font-semibold text-foreground">
                          {d.label}{" "}
                          <span className="font-normal text-muted-foreground">
                            — {fmtData(d.iso)}
                          </span>
                        </div>
                        {doDia.length === 0 ? (
                          <p className="px-0.5 text-xs text-muted-foreground">Nada por aqui.</p>
                        ) : (
                          doDia.map((o) => {
                            const concluido = conclusaoPorChave.has(
                              chaveOcorrencia(o.evento.id, o.dataOcorrencia),
                            );
                            const atrasado =
                              !concluido && !o.evento.aniversario && o.dataOcorrencia < hojeIso;
                            return (
                              <CardOcorrencia
                                key={`${o.evento.id}-${o.dataOcorrencia}`}
                                o={o}
                                concluido={concluido}
                                atrasado={atrasado}
                                onClick={() => abrirEdicao(o.evento)}
                                onToggleConcluido={() => alternarConcluido(o)}
                                acaoExtra={
                                  <MenuMoverDia
                                    evento={o.evento}
                                    dataAtual={o.dataOcorrencia}
                                    diasDaSemana={diasDaSemana}
                                    onMover={(novaData) => moverEvento(o.evento, novaData)}
                                  />
                                }
                              />
                            );
                          })
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
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
