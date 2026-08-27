import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  IconBriefcase,
  IconCalendar,
  IconCalendarPlus,
  IconChevronDown,
  IconChevronUp,
  IconFlag,
  IconHome,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ds";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { hoje } from "@/lib/data";
import {
  useAtualizarOrdemPrioridade,
  useCreatePrioridade,
  useDeletePrioridade,
  usePrioridades,
  useUpdatePrioridade,
} from "@/features/prioridades/hooks";
import {
  CORES_PRIORIDADE,
  CORES_PRIORIDADE_ORDEM,
  type CorPrioridade,
  type EscopoPrioridade,
  type Prioridade,
} from "@/features/prioridades/types";
import { useCreateEvento } from "@/features/agenda/hooks";
import type { NovoEvento } from "@/features/agenda/types";

export const Route = createFileRoute("/_authenticated/prioridades")({
  component: Prioridades,
});

/** Cor de Prioridade → cor mais próxima da paleta de 11 cores da Agenda. */
const COR_PRIORIDADE_PARA_AGENDA: Record<CorPrioridade, NovoEvento["cor"]> = {
  vermelho: "tomato",
  amarelo: "banana",
  verde: "sage",
};

function DialogVirarCompromisso({
  prioridade,
  onOpenChange,
}: {
  prioridade: Prioridade | null;
  onOpenChange: (o: boolean) => void;
}) {
  const criarEvento = useCreateEvento();
  const removerPrioridade = useDeletePrioridade();
  const [data, setData] = useState(hoje());

  function confirmar() {
    if (!prioridade) return;
    const input: NovoEvento = {
      titulo: prioridade.titulo,
      descricao: prioridade.descricao,
      local: null,
      dia_inteiro: true,
      data,
      data_fim: null,
      hora_inicio: null,
      hora_fim: null,
      cor: COR_PRIORIDADE_PARA_AGENDA[prioridade.cor as CorPrioridade],
      recorrencia: "nenhuma",
      recorrencia_fim: null,
      lembrete_minutos: null,
      aniversario: false,
      destaque: false,
      radar: false,
      escopo: prioridade.escopo,
    };
    criarEvento.mutate(input, {
      onSuccess: () => {
        removerPrioridade.mutate(prioridade.id, {
          onError: (e: Error) => toast.error(e.message),
        });
        toast.success("Virou compromisso na Agenda");
        onOpenChange(false);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  return (
    <Dialog open={!!prioridade} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Virar compromisso</DialogTitle>
        </DialogHeader>
        <p className="-mt-2 text-sm text-muted-foreground">
          "{prioridade?.titulo}" sai da Lista de Prioridades e vira um evento na Agenda, nessa data:
        </p>
        <div className="space-y-1.5">
          <Label>Data</Label>
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button onClick={confirmar} disabled={criarEvento.isPending} className="flex-1">
            {criarEvento.isPending ? "Movendo…" : "Confirmar"}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ItemCard({
  p,
  emEdicao,
  podeSubir,
  podeDescer,
  onMoverCima,
  onMoverBaixo,
  onAlternarConcluida,
  onVirarCompromisso,
  onEditar,
  onExcluir,
}: {
  p: Prioridade;
  emEdicao: boolean;
  podeSubir?: boolean;
  podeDescer?: boolean;
  onMoverCima?: () => void;
  onMoverBaixo?: () => void;
  onAlternarConcluida: () => void;
  onVirarCompromisso: () => void;
  onEditar: () => void;
  onExcluir: () => void;
}) {
  const mostrarSetas = onMoverCima != null;
  return (
    <Card className={emEdicao ? "border-primary" : undefined}>
      <CardContent className="flex items-start gap-2 p-3.5">
        {mostrarSetas && (
          <div className="flex shrink-0 flex-col">
            <button
              type="button"
              onClick={onMoverCima}
              disabled={!podeSubir}
              aria-label="Mover pra cima"
              title="Mover pra cima (prioridade maior)"
              className="text-muted-foreground transition hover:text-primary disabled:opacity-20"
            >
              <IconChevronUp className="size-4" />
            </button>
            <button
              type="button"
              onClick={onMoverBaixo}
              disabled={!podeDescer}
              aria-label="Mover pra baixo"
              title="Mover pra baixo (prioridade menor)"
              className="text-muted-foreground transition hover:text-primary disabled:opacity-20"
            >
              <IconChevronDown className="size-4" />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={onAlternarConcluida}
          aria-label={p.concluida ? "Reabrir" : "Concluir"}
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition",
            p.concluida ? "border-primary bg-primary" : "border-input",
          )}
        >
          {p.concluida && <span className="text-[10px] text-primary-foreground">✓</span>}
        </button>
        <span
          className={cn(
            "mt-1.5 size-2.5 shrink-0 rounded-full",
            CORES_PRIORIDADE[p.cor as CorPrioridade].dot,
          )}
        />
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "truncate text-sm font-semibold text-foreground",
              p.concluida && "text-muted-foreground line-through",
            )}
          >
            {p.titulo}
          </div>
          {p.descricao && (
            <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">
              {p.descricao}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onVirarCompromisso}
            aria-label="Virar compromisso"
            title="Virar compromisso na Agenda"
            className="text-muted-foreground transition hover:text-primary"
          >
            <IconCalendarPlus className="size-4" />
          </button>
          <button
            onClick={onEditar}
            aria-label="Editar"
            className="text-muted-foreground transition hover:text-primary"
          >
            <IconPencil className="size-4" />
          </button>
          <button
            onClick={onExcluir}
            aria-label="Excluir"
            className="text-muted-foreground transition hover:text-destructive"
          >
            <IconTrash className="size-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function Prioridades() {
  const { data: itens = [], isLoading } = usePrioridades();
  const criar = useCreatePrioridade();
  const atualizar = useUpdatePrioridade();
  const remover = useDeletePrioridade();
  const atualizarOrdem = useAtualizarOrdemPrioridade();

  const [editando, setEditando] = useState<Prioridade | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cor, setCor] = useState<CorPrioridade>("amarelo");
  const [escopo, setEscopo] = useState<EscopoPrioridade>("profissional");
  const [virandoCompromisso, setVirandoCompromisso] = useState<Prioridade | null>(null);
  // Formulário começa fechado — só um botão "+".
  const [formAberto, setFormAberto] = useState(false);
  const [escopoFiltro, setEscopoFiltro] = useState<"todos" | EscopoPrioridade>("todos");

  function iniciarEdicao(p: Prioridade) {
    setEditando(p);
    setTitulo(p.titulo);
    setDescricao(p.descricao ?? "");
    setCor(p.cor as CorPrioridade);
    setEscopo((p.escopo as EscopoPrioridade) ?? "profissional");
    setFormAberto(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    setEditando(null);
    setTitulo("");
    setDescricao("");
    setCor("amarelo");
    setEscopo("profissional");
    setFormAberto(false);
  }

  function salvar() {
    if (!titulo.trim()) {
      toast.error("Dê um título");
      return;
    }
    const input = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      cor,
      escopo,
      concluida: editando?.concluida ?? false,
      // item novo entra no fim do grupo da cor escolhida
      ordem: editando ? editando.ordem : itens.filter((i) => i.cor === cor).length,
    };
    if (editando) {
      atualizar.mutate(
        { id: editando.id, input },
        { onSuccess: cancelarEdicao, onError: (e: Error) => toast.error(e.message) },
      );
    } else {
      criar.mutate(input, {
        onSuccess: cancelarEdicao,
        onError: (e: Error) => toast.error(e.message),
      });
    }
  }

  function excluir(id: string) {
    if (editando?.id === id) cancelarEdicao();
    remover.mutate(id, { onError: (e: Error) => toast.error(e.message) });
  }

  function alternarConcluida(p: Prioridade) {
    atualizar.mutate(
      {
        id: p.id,
        input: {
          titulo: p.titulo,
          descricao: p.descricao,
          cor: p.cor,
          concluida: !p.concluida,
        },
      },
      { onError: (e: Error) => toast.error(e.message) },
    );
  }

  const salvando = criar.isPending || atualizar.isPending;

  const itensFiltrados = useMemo(
    () => (escopoFiltro === "todos" ? itens : itens.filter((i) => i.escopo === escopoFiltro)),
    [itens, escopoFiltro],
  );

  const contagemEscopo = useMemo(
    () => ({
      todos: itens.length,
      pessoal: itens.filter((i) => i.escopo === "pessoal").length,
      profissional: itens.filter((i) => i.escopo === "profissional").length,
    }),
    [itens],
  );

  /** Itens não concluídos de uma cor, na ordem manual — é o que "mover" reorganiza. */
  const grupoDaCor = (c: CorPrioridade) =>
    itensFiltrados.filter((i) => !i.concluida && i.cor === c).sort((a, b) => a.ordem - b.ordem);

  const concluidos = useMemo(
    () => [...itensFiltrados].filter((i) => i.concluida).sort((a, b) => a.ordem - b.ordem),
    [itensFiltrados],
  );

  function mover(p: Prioridade, direcao: "cima" | "baixo") {
    const grupo = grupoDaCor(p.cor as CorPrioridade);
    const idx = grupo.findIndex((i) => i.id === p.id);
    const alvoIdx = direcao === "cima" ? idx - 1 : idx + 1;
    if (idx < 0 || alvoIdx < 0 || alvoIdx >= grupo.length) return;
    const reordenado = [...grupo];
    [reordenado[idx], reordenado[alvoIdx]] = [reordenado[alvoIdx], reordenado[idx]];
    reordenado.forEach((item, i) => {
      if (item.ordem !== i) atualizarOrdem.mutate({ id: item.id, ordem: i });
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <div className="mb-1 flex items-start justify-between gap-2">
        <SectionHeader overline="Gestão Pessoal" title="Lista de Prioridades" />
        <Link
          to="/agenda"
          aria-label="Agenda"
          title="Agenda"
          className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md border border-input text-muted-foreground transition hover:bg-muted hover:text-primary"
        >
          <IconCalendar className="size-4" />
        </Link>
      </div>

      {!formAberto && (
        <Button
          variant="outline"
          size="sm"
          className="mb-5 gap-1.5"
          onClick={() => setFormAberto(true)}
        >
          <IconPlus className="size-4" /> Novo item
        </Button>
      )}

      {formAberto && (
        <Card className="mb-5">
          <CardContent className="pt-6">
            <Label className="mb-3 block">{editando ? "Editando" : "Novo item"}</Label>
            <div className="mb-3 space-y-1.5">
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="ex.: Renovar contrato com fornecedor"
              />
            </div>
            <div className="mb-3 space-y-1.5">
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes (opcional)"
                className="min-h-[70px]"
              />
            </div>
            <div className="mb-3 space-y-1.5">
              <Label>Prioridade</Label>
              <div className="flex gap-2">
                {CORES_PRIORIDADE_ORDEM.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCor(c)}
                    title={CORES_PRIORIDADE[c].label}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition",
                      cor === c
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-foreground",
                    )}
                  >
                    <span className={cn("size-3 rounded-full", CORES_PRIORIDADE[c].dot)} />
                    {CORES_PRIORIDADE[c].label.split(" — ")[0]}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-3 space-y-1.5">
              <Label>Escopo</Label>
              <div className="flex gap-2">
                {(
                  [
                    ["pessoal", "Pessoal", IconHome],
                    ["profissional", "Profissional", IconBriefcase],
                  ] as [EscopoPrioridade, string, typeof IconHome][]
                ).map(([valor, rotulo, Icon]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setEscopo(valor)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition",
                      escopo === valor
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {rotulo}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={salvar} disabled={salvando}>
                {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Adicionar"}
              </Button>
              <Button variant="ghost" onClick={cancelarEdicao}>
                {editando ? "Cancelar" : "Fechar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 flex gap-2">
        {(
          [
            ["todos", "Todos"],
            ["pessoal", "Pessoal"],
            ["profissional", "Profissional"],
          ] as [typeof escopoFiltro, string][]
        ).map(([valor, rotulo]) => (
          <button
            key={valor}
            type="button"
            onClick={() => setEscopoFiltro(valor)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              escopoFiltro === valor
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-transparent text-foreground",
            )}
          >
            {rotulo} ({contagemEscopo[valor]})
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : itensFiltrados.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          <IconFlag className="size-8" stroke={1.5} />
          <p className="text-sm">
            {itens.length === 0
              ? 'Nada por aqui ainda. Toque em "Novo item" pra registrar o primeiro.'
              : "Nenhum item nesse escopo."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {CORES_PRIORIDADE_ORDEM.map((c) => {
            const grupo = grupoDaCor(c);
            if (grupo.length === 0) return null;
            return (
              <div key={c} className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className={cn("size-2.5 rounded-full", CORES_PRIORIDADE[c].dot)} />
                  {CORES_PRIORIDADE[c].label.split(" — ")[0]} · {grupo.length}
                </div>
                {grupo.map((p, i) => (
                  <ItemCard
                    key={p.id}
                    p={p}
                    emEdicao={editando?.id === p.id}
                    podeSubir={i > 0}
                    podeDescer={i < grupo.length - 1}
                    onMoverCima={() => mover(p, "cima")}
                    onMoverBaixo={() => mover(p, "baixo")}
                    onAlternarConcluida={() => alternarConcluida(p)}
                    onVirarCompromisso={() => setVirandoCompromisso(p)}
                    onEditar={() => iniciarEdicao(p)}
                    onExcluir={() => excluir(p.id)}
                  />
                ))}
              </div>
            );
          })}

          {concluidos.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Concluídos · {concluidos.length}
              </div>
              {concluidos.map((p) => (
                <ItemCard
                  key={p.id}
                  p={p}
                  emEdicao={editando?.id === p.id}
                  onAlternarConcluida={() => alternarConcluida(p)}
                  onVirarCompromisso={() => setVirandoCompromisso(p)}
                  onEditar={() => iniciarEdicao(p)}
                  onExcluir={() => excluir(p.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <DialogVirarCompromisso
        prioridade={virandoCompromisso}
        onOpenChange={(o) => !o && setVirandoCompromisso(null)}
      />
    </div>
  );
}
