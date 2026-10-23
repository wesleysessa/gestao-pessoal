import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  IconBriefcase,
  IconCalendar,
  IconCalendarEvent,
  IconChevronLeft,
  IconChevronRight,
  IconDotsVertical,
  IconHome,
  IconLayoutKanban,
  IconPlus,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ds";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { addDias, dataLocalDe, fmtData, hoje } from "@/lib/data";
import { useConclusoes, useEventos } from "@/features/agenda/hooks";
import { expandirOcorrencias } from "@/features/agenda/service";
import { EventoDialog } from "@/features/agenda/components/evento-dialog";
import { hhmm } from "@/features/agenda/util";
import type { Evento } from "@/features/agenda/types";
import {
  useCartoesKanban,
  useCreateCartao,
  useDeleteCartao,
  useMoverCartao,
  useReordenarColuna,
  useUpdateCartao,
} from "@/features/kanban/hooks";
import {
  COLUNA_INFO,
  COLUNAS_KANBAN,
  PRIORIDADE_INFO,
  PRIORIDADES_KANBAN,
  type CartaoKanban,
  type ColunaKanban,
  type PrioridadeKanban,
} from "@/features/kanban/types";

export const Route = createFileRoute("/_authenticated/kanban")({
  component: Kanban,
});

type Escopo = "pessoal" | "profissional";

/** Próximo compromisso ainda "ativo" de um cartão: nem concluído, nem vencido. */
type AgendaAtiva = { evento: Evento; data: string };

/** Hora atual "HH:MM" local, pra saber se um compromisso de hoje já passou. */
function agoraHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Dias corridos desde um timestamp (0 = hoje). */
function diasDesde(ts: string): number {
  const [a, m, d] = dataLocalDe(ts).split("-").map(Number);
  const entao = new Date(a, m - 1, d);
  const agora = new Date();
  agora.setHours(0, 0, 0, 0);
  return Math.round((agora.getTime() - entao.getTime()) / 86400000);
}

function CartaoView({
  c,
  onAbrir,
  onMoverPara,
  onSubir,
  onDescer,
  podeSubir,
  podeDescer,
  agenda,
  onAbrirAgenda,
  onCriarAgenda,
}: {
  c: CartaoKanban;
  onAbrir: () => void;
  onMoverPara: (coluna: ColunaKanban) => void;
  onSubir: () => void;
  onDescer: () => void;
  podeSubir: boolean;
  podeDescer: boolean;
  agenda: AgendaAtiva | null;
  onAbrirAgenda: () => void;
  onCriarAgenda: () => void;
}) {
  const coluna = c.coluna as ColunaKanban;
  const i = COLUNAS_KANBAN.indexOf(coluna);
  const anterior = COLUNAS_KANBAN[i - 1];
  const proxima = COLUNAS_KANBAN[i + 1];
  const concluido = coluna === "concluido";
  const atrasado = !concluido && c.prazo != null && c.prazo < hoje();
  const parado = diasDesde(c.movido_em);

  return (
    <div
      onClick={onAbrir}
      className="cursor-pointer rounded-lg border border-border bg-card p-2.5 shadow-sm transition hover:border-muted-foreground/40"
    >
      <div className="flex items-start gap-1.5">
        <span
          title={`Prioridade ${PRIORIDADE_INFO[c.prioridade as PrioridadeKanban].label}`}
          className={cn(
            "mt-1.5 size-2 shrink-0 rounded-full",
            PRIORIDADE_INFO[c.prioridade as PrioridadeKanban].dot,
          )}
        />
        <div
          className={cn(
            "min-w-0 flex-1 text-sm font-medium text-foreground",
            concluido && "text-muted-foreground line-through",
          )}
        >
          {c.titulo}
        </div>
        {agenda && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAbrirAgenda();
            }}
            aria-label="Ver compromisso na Agenda"
            title="Ver compromisso na Agenda"
            className="shrink-0 rounded p-0.5 text-primary transition hover:bg-primary/10"
          >
            <IconCalendarEvent className="size-4" />
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              aria-label="Mais ações"
              className="-mr-1 shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <IconDotsVertical className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={onCriarAgenda}>
              <IconCalendarEvent className="mr-2 size-4" />
              {agenda ? "Criar outra agenda" : "Criar agenda"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {COLUNAS_KANBAN.filter((col) => col !== coluna).map((col) => (
              <DropdownMenuItem key={col} onClick={() => onMoverPara(col)}>
                <span
                  className={cn("mr-2 inline-block size-2 rounded-full", COLUNA_INFO[col].dot)}
                />
                Mover para {COLUNA_INFO[col].label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!podeSubir} onClick={onSubir}>
              Subir na coluna
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!podeDescer} onClick={onDescer}>
              Descer na coluna
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {c.descricao && (
        <p className="mt-1 line-clamp-2 pl-3.5 text-xs text-muted-foreground">{c.descricao}</p>
      )}

      {agenda && (
        <div className="mt-1.5 flex items-center gap-1 pl-3.5 text-xs font-medium text-primary">
          <IconCalendarEvent className="size-3.5 shrink-0" />
          {agenda.data === hoje() ? "Hoje" : fmtData(agenda.data)}
          {!agenda.evento.dia_inteiro && agenda.evento.hora_inicio && (
            <> · {hhmm(agenda.evento.hora_inicio)}</>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center gap-2 pl-3.5 text-[11px] text-muted-foreground">
        {c.escopo === "profissional" ? (
          <IconBriefcase className="size-3.5" aria-label="Profissional" />
        ) : (
          <IconHome className="size-3.5" aria-label="Pessoal" />
        )}
        {c.prazo && (
          <span
            className={cn(
              "flex items-center gap-0.5",
              atrasado && "font-semibold text-red-600 dark:text-red-400",
            )}
          >
            <IconCalendar className="size-3" />
            {fmtData(c.prazo).slice(0, 5)}
          </span>
        )}
        {concluido && c.concluido_em ? (
          <span>concluído {fmtData(dataLocalDe(c.concluido_em)).slice(0, 5)}</span>
        ) : (
          parado >= 3 && <span title="Tempo nesta etapa">parado há {parado}d</span>
        )}
        <div className="ml-auto flex items-center" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            disabled={!anterior}
            onClick={() => anterior && onMoverPara(anterior)}
            aria-label={anterior ? `Voltar para ${COLUNA_INFO[anterior].label}` : undefined}
            title={anterior ? `Voltar para ${COLUNA_INFO[anterior].label}` : undefined}
            className="rounded p-0.5 transition hover:text-foreground disabled:opacity-20"
          >
            <IconChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            disabled={!proxima}
            onClick={() => proxima && onMoverPara(proxima)}
            aria-label={proxima ? `Avançar para ${COLUNA_INFO[proxima].label}` : undefined}
            title={proxima ? `Avançar para ${COLUNA_INFO[proxima].label}` : undefined}
            className="rounded p-0.5 transition hover:text-foreground disabled:opacity-20"
          >
            <IconChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DialogCartao({
  cartao,
  colunaInicial,
  proximaOrdem,
  onFechar,
}: {
  cartao: CartaoKanban | null;
  colunaInicial: ColunaKanban;
  proximaOrdem: (coluna: ColunaKanban) => number;
  onFechar: () => void;
}) {
  const criar = useCreateCartao();
  const atualizar = useUpdateCartao();
  const mover = useMoverCartao();
  const remover = useDeleteCartao();

  const [titulo, setTitulo] = useState(cartao?.titulo ?? "");
  const [descricao, setDescricao] = useState(cartao?.descricao ?? "");
  const [coluna, setColuna] = useState<ColunaKanban>(
    (cartao?.coluna as ColunaKanban) ?? colunaInicial,
  );
  const [prioridade, setPrioridade] = useState<PrioridadeKanban>(
    (cartao?.prioridade as PrioridadeKanban) ?? "media",
  );
  const [prazo, setPrazo] = useState(cartao?.prazo ?? "");
  const [escopo, setEscopo] = useState<Escopo>((cartao?.escopo as Escopo) ?? "pessoal");

  const salvando = criar.isPending || atualizar.isPending;

  function salvar() {
    if (!titulo.trim()) {
      toast.error("Dê um título ao cartão");
      return;
    }
    const input = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      coluna,
      prioridade,
      prazo: prazo || null,
      escopo,
    };
    const erro = { onError: (e: Error) => toast.error(e.message) };
    if (cartao) {
      atualizar.mutate(
        { id: cartao.id, input: { ...input, coluna: cartao.coluna } },
        {
          ...erro,
          onSuccess: () => {
            // Trocou a etapa pelo formulário: move pelo caminho normal (fim da
            // coluna nova, atualiza "parado há" e data de conclusão).
            if (coluna !== cartao.coluna)
              mover.mutate({ id: cartao.id, coluna, ordem: proximaOrdem(coluna) }, erro);
            onFechar();
          },
        },
      );
    } else {
      criar.mutate({ input, ordem: proximaOrdem(coluna) }, { ...erro, onSuccess: onFechar });
    }
  }

  function excluir() {
    if (!cartao) return;
    if (!window.confirm(`Excluir o cartão "${cartao.titulo}"?`)) return;
    remover.mutate(cartao.id, {
      onSuccess: onFechar,
      onError: (e: Error) => toast.error(e.message),
    });
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{cartao ? "Editar cartão" : "Novo cartão"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="O que precisa ser feito?"
              autoFocus={!cartao}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição (opcional)</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="min-h-[70px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Etapa</Label>
              <Select value={coluna} onValueChange={(v) => setColuna(v as ColunaKanban)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUNAS_KANBAN.map((col) => (
                    <SelectItem key={col} value={col}>
                      {COLUNA_INFO[col].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prazo (opcional)</Label>
              <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Prioridade</Label>
            <div className="flex gap-2">
              {PRIORIDADES_KANBAN.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrioridade(p)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-sm font-medium transition",
                    prioridade === p
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input text-foreground",
                  )}
                >
                  <span className={cn("size-2.5 rounded-full", PRIORIDADE_INFO[p].dot)} />
                  {PRIORIDADE_INFO[p].label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {(
              [
                { valor: "pessoal", rotulo: "Pessoal", icon: IconHome },
                { valor: "profissional", rotulo: "Profissional", icon: IconBriefcase },
              ] as const
            ).map((op) => (
              <button
                key={op.valor}
                type="button"
                onClick={() => setEscopo(op.valor)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-sm font-medium transition",
                  escopo === op.valor
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input text-foreground",
                )}
              >
                <op.icon className="size-4" /> {op.rotulo}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-row items-center gap-2 sm:justify-between">
          {cartao ? (
            <Button variant="ghost" className="text-destructive" onClick={excluir}>
              Excluir
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onFechar}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Kanban() {
  const { data: cartoes = [], isLoading } = useCartoesKanban();
  const mover = useMoverCartao();
  const reordenar = useReordenarColuna();

  const [escopoFiltro, setEscopoFiltro] = useState<"todos" | Escopo>("todos");
  const [dialog, setDialog] = useState<{
    cartao: CartaoKanban | null;
    coluna: ColunaKanban;
  } | null>(null);
  const colunaRefs = useRef<Partial<Record<ColunaKanban, HTMLDivElement | null>>>({});
  const [agendaDialog, setAgendaDialog] = useState<{
    evento: Evento | null;
    cartao: CartaoKanban;
  } | null>(null);

  const { data: eventos = [] } = useEventos();
  const { data: conclusoes = [] } = useConclusoes();

  /**
   * Por cartão, o próximo compromisso vinculado que ainda vale: a partir de
   * hoje, sem conclusão, e (se for hoje com horário) que ainda não terminou.
   * Vencido ou concluído some do cartão — ícone e data.
   */
  const agendaPorCartao = useMemo(() => {
    const vinculados = eventos.filter((e) => e.kanban_cartao_id);
    const concluidas = new Set(conclusoes.map((c) => `${c.evento_id}|${c.data}`));
    const agora = agoraHHMM();
    const mapa = new Map<string, AgendaAtiva>();
    for (const o of expandirOcorrencias(vinculados, hoje(), addDias(hoje(), 366))) {
      if (concluidas.has(`${o.evento.id}|${o.dataOcorrencia}`)) continue;
      if (o.dataOcorrencia === hoje() && !o.evento.dia_inteiro) {
        const termina = hhmm(o.evento.hora_fim ?? o.evento.hora_inicio);
        if (termina && termina < agora) continue;
      }
      const id = o.evento.kanban_cartao_id as string;
      if (!mapa.has(id)) mapa.set(id, { evento: o.evento, data: o.dataOcorrencia });
    }
    return mapa;
  }, [eventos, conclusoes]);

  const filtrados = useMemo(
    () => (escopoFiltro === "todos" ? cartoes : cartoes.filter((c) => c.escopo === escopoFiltro)),
    [cartoes, escopoFiltro],
  );

  const porColuna = useMemo(() => {
    const mapa = Object.fromEntries(COLUNAS_KANBAN.map((c) => [c, [] as CartaoKanban[]])) as Record<
      ColunaKanban,
      CartaoKanban[]
    >;
    for (const c of filtrados) mapa[c.coluna as ColunaKanban]?.push(c);
    for (const col of COLUNAS_KANBAN) {
      mapa[col].sort((a, b) =>
        col === "concluido"
          ? (b.concluido_em ?? "").localeCompare(a.concluido_em ?? "")
          : a.ordem - b.ordem,
      );
    }
    return mapa;
  }, [filtrados]);

  /** Ordem pra quem entra no fim de uma coluna (considera todos, não só o filtro). */
  function proximaOrdem(coluna: ColunaKanban) {
    const daColuna = cartoes.filter((c) => c.coluna === coluna);
    return daColuna.length ? Math.max(...daColuna.map((c) => c.ordem)) + 1 : 0;
  }

  function moverPara(c: CartaoKanban, coluna: ColunaKanban) {
    mover.mutate(
      { id: c.id, coluna, ordem: proximaOrdem(coluna) },
      { onError: (e: Error) => toast.error(e.message) },
    );
  }

  function trocarOrdem(coluna: ColunaKanban, idx: number, direcao: -1 | 1) {
    const ids = porColuna[coluna].map((c) => c.id);
    const j = idx + direcao;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    reordenar.mutate(ids, { onError: (e: Error) => toast.error(e.message) });
  }

  const contagemEscopo = {
    todos: cartoes.length,
    pessoal: cartoes.filter((c) => c.escopo === "pessoal").length,
    profissional: cartoes.filter((c) => c.escopo === "profissional").length,
  };
  const emAndamento = filtrados.filter(
    (c) => c.coluna !== "backlog" && c.coluna !== "concluido",
  ).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-4">
      <div className="mb-1 flex items-start justify-between gap-2">
        <SectionHeader overline="Gestão Pessoal" title="Kanban" />
        <Button
          size="sm"
          className="mt-1 shrink-0 gap-1.5"
          onClick={() => setDialog({ cartao: null, coluna: "backlog" })}
        >
          <IconPlus className="size-3.5" /> Novo cartão
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span>
          <strong className="text-foreground">{filtrados.length}</strong> cartões
        </span>
        <span>
          <strong className="text-foreground">{emAndamento}</strong> em andamento
        </span>
      </div>

      <div className="mb-3 flex gap-1.5">
        {(
          [
            { valor: "todos", rotulo: "Todos" },
            { valor: "pessoal", rotulo: "Pessoal" },
            { valor: "profissional", rotulo: "Profissional" },
          ] as const
        ).map((op) => (
          <button
            key={op.valor}
            type="button"
            onClick={() => setEscopoFiltro(op.valor)}
            className={cn(
              "rounded-md border px-3 py-1 text-xs font-medium transition",
              escopoFiltro === op.valor
                ? "border-primary bg-primary/10 text-primary"
                : "border-input text-foreground",
            )}
          >
            {op.rotulo} ({contagemEscopo[op.valor]})
          </button>
        ))}
      </div>

      {/* Atalhos: no celular só cabe ~1 coluna por vez — toque pra pular até ela. */}
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {COLUNAS_KANBAN.map((col) => (
          <button
            key={col}
            type="button"
            onClick={() =>
              colunaRefs.current[col]?.scrollIntoView({
                behavior: "smooth",
                inline: "start",
                block: "nearest",
              })
            }
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground"
          >
            <span className={cn("size-2 rounded-full", COLUNA_INFO[col].dot)} />
            {COLUNA_INFO[col].label}
            <span className="text-muted-foreground">{porColuna[col].length}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4">
          {COLUNAS_KANBAN.map((col) => (
            <div
              key={col}
              ref={(el) => {
                colunaRefs.current[col] = el;
              }}
              className="flex w-[82vw] max-w-[290px] shrink-0 snap-start flex-col rounded-xl bg-muted/50 p-2"
            >
              <div className="mb-2 flex items-center gap-1.5 px-1">
                <span className={cn("size-2.5 rounded-full", COLUNA_INFO[col].dot)} />
                <span className="text-sm font-semibold text-foreground">
                  {COLUNA_INFO[col].label}
                </span>
                <span className="text-xs text-muted-foreground">{porColuna[col].length}</span>
                <button
                  type="button"
                  onClick={() => setDialog({ cartao: null, coluna: col })}
                  aria-label={`Novo cartão em ${COLUNA_INFO[col].label}`}
                  className="ml-auto rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                >
                  <IconPlus className="size-4" />
                </button>
              </div>
              <div className="flex min-h-[80px] flex-col gap-2">
                {porColuna[col].length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    <IconLayoutKanban className="mb-1 size-5" stroke={1.5} />
                    Vazio
                  </div>
                ) : (
                  porColuna[col].map((c, idx) => (
                    <CartaoView
                      key={c.id}
                      c={c}
                      onAbrir={() => setDialog({ cartao: c, coluna: col })}
                      onMoverPara={(destino) => moverPara(c, destino)}
                      onSubir={() => trocarOrdem(col, idx, -1)}
                      onDescer={() => trocarOrdem(col, idx, 1)}
                      podeSubir={col !== "concluido" && idx > 0}
                      podeDescer={col !== "concluido" && idx < porColuna[col].length - 1}
                      agenda={agendaPorCartao.get(c.id) ?? null}
                      onAbrirAgenda={() =>
                        setAgendaDialog({
                          evento: agendaPorCartao.get(c.id)?.evento ?? null,
                          cartao: c,
                        })
                      }
                      onCriarAgenda={() => setAgendaDialog({ evento: null, cartao: c })}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {agendaDialog && (
        <EventoDialog
          aberto
          onOpenChange={(aberto) => !aberto && setAgendaDialog(null)}
          evento={agendaDialog.evento}
          dataPadrao={hoje()}
          inicial={{
            titulo: agendaDialog.cartao.titulo,
            descricao: agendaDialog.cartao.descricao ?? "",
            profissional: agendaDialog.cartao.escopo === "profissional",
          }}
          kanbanCartaoId={agendaDialog.cartao.id}
        />
      )}

      {dialog && (
        <DialogCartao
          key={dialog.cartao?.id ?? `novo-${dialog.coluna}`}
          cartao={dialog.cartao}
          colunaInicial={dialog.coluna}
          proximaOrdem={proximaOrdem}
          onFechar={() => setDialog(null)}
        />
      )}
    </div>
  );
}
