import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { IconBulb, IconSearch, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ds";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fmtData } from "@/lib/data";
import {
  useCreateMelhoria,
  useDeleteMelhoria,
  useMelhorias,
  useUpdateMelhoria,
  useUpdateStatusMelhoria,
} from "@/features/melhorias/hooks";
import { STATUS_LABEL, type Melhoria, type StatusMelhoria } from "@/features/melhorias/types";

export const Route = createFileRoute("/_authenticated/melhorias")({
  component: Melhorias,
});

function Melhorias() {
  const { data: melhorias = [], isLoading } = useMelhorias();
  const criar = useCreateMelhoria();
  const atualizar = useUpdateMelhoria();
  const alternarStatus = useUpdateStatusMelhoria();
  const remover = useDeleteMelhoria();

  const [editando, setEditando] = useState<Melhoria | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | StatusMelhoria>("todos");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  function iniciarEdicao(m: Melhoria) {
    setEditando(m);
    setTitulo(m.titulo);
    setDescricao(m.descricao ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    setEditando(null);
    setTitulo("");
    setDescricao("");
  }

  function salvar() {
    if (!titulo.trim()) return;
    const input = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      status: editando?.status ?? "sugerido",
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

  function excluir(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (editando?.id === id) cancelarEdicao();
    remover.mutate(id, { onError: (err: Error) => toast.error(err.message) });
  }

  function alternar(m: Melhoria, e: React.MouseEvent) {
    e.stopPropagation();
    const novo: StatusMelhoria = m.status === "sugerido" ? "em_funcionamento" : "sugerido";
    alternarStatus.mutate(
      { id: m.id, status: novo },
      { onError: (err: Error) => toast.error(err.message) },
    );
  }

  const salvando = criar.isPending || atualizar.isPending;

  const filtradasPorBuscaEData = useMemo(() => {
    return melhorias.filter((m) => {
      if (busca.trim()) {
        const q = busca.trim().toLowerCase();
        if (!`${m.titulo} ${m.descricao ?? ""}`.toLowerCase().includes(q)) return false;
      }
      const dia = m.created_at.slice(0, 10);
      if (de && dia < de) return false;
      if (ate && dia > ate) return false;
      return true;
    });
  }, [melhorias, busca, de, ate]);

  const contagem = {
    todos: filtradasPorBuscaEData.length,
    sugerido: filtradasPorBuscaEData.filter((m) => m.status === "sugerido").length,
    em_funcionamento: filtradasPorBuscaEData.filter((m) => m.status === "em_funcionamento").length,
  };

  const visiveis =
    statusFiltro === "todos"
      ? filtradasPorBuscaEData
      : filtradasPorBuscaEData.filter((m) => m.status === statusFiltro);

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <SectionHeader overline="Gestão Pessoal" title="Melhorias" />

      <Card className="mb-5">
        <CardContent className="pt-6">
          <div className="mb-3 space-y-1.5">
            <Label>{editando ? "Editando sugestão" : "Nova sugestão / relatar erro"}</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título"
            />
          </div>
          <div className="mb-3 space-y-1.5">
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva a ideia ou o problema"
              className="min-h-[90px]"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Registrar"}
            </Button>
            {editando && (
              <Button variant="ghost" onClick={cancelarEdicao}>
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mb-3 flex items-center gap-2 rounded-md border border-input bg-background px-3">
        <IconSearch className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar palavra-chave..."
          className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">De</Label>
          <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Até</Label>
          <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["todos", "Todos", contagem.todos],
            ["sugerido", "Sugerido", contagem.sugerido],
            ["em_funcionamento", "Em Funcionamento", contagem.em_funcionamento],
          ] as [typeof statusFiltro, string, number][]
        ).map(([valor, rotulo, n]) => (
          <button
            key={valor}
            onClick={() => setStatusFiltro(valor)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              statusFiltro === valor
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-transparent text-foreground",
            )}
          >
            {rotulo} {n}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : visiveis.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          <IconBulb className="size-8" stroke={1.5} />
          <p className="text-sm">Nenhuma sugestão por aqui ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visiveis.map((m) => (
            <Card
              key={m.id}
              onClick={() => iniciarEdicao(m)}
              className={
                editando?.id === m.id
                  ? "cursor-pointer border-primary"
                  : "cursor-pointer transition hover:border-muted-foreground/40"
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <IconBulb className="size-4 shrink-0 text-primary" />
                    <div className="truncate text-base font-semibold text-foreground">
                      {m.titulo}
                    </div>
                  </div>
                  <button
                    onClick={(e) => excluir(m.id, e)}
                    aria-label="Excluir"
                    className="shrink-0 text-muted-foreground transition hover:text-destructive"
                  >
                    <IconTrash className="size-4" />
                  </button>
                </div>

                <div className="mt-1.5 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      m.status === "em_funcionamento"
                        ? "border-green-300 text-green-700 dark:border-green-800 dark:text-green-400"
                        : "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400"
                    }
                  >
                    {STATUS_LABEL[m.status as StatusMelhoria]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {fmtData(m.created_at.slice(0, 10))}
                  </span>
                </div>

                {m.descricao && (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {m.descricao}
                  </p>
                )}

                <button
                  onClick={(e) => alternar(m, e)}
                  className="mt-2.5 text-xs font-semibold text-primary hover:underline"
                >
                  {m.status === "sugerido" ? "Marcar em funcionamento" : "Voltar a sugerido"}
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
