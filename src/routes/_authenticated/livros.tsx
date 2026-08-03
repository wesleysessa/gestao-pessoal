import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { IconBooks, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ds";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { fmtData } from "@/lib/data";
import { useCreateLivro, useDeleteLivro, useLivros, useUpdateLivro } from "@/features/livros/hooks";
import type { Livro } from "@/features/livros/types";

export const Route = createFileRoute("/_authenticated/livros")({
  component: Livros,
});

function Livros() {
  const { data: livros = [], isLoading } = useLivros();
  const criar = useCreateLivro();
  const atualizar = useUpdateLivro();
  const remover = useDeleteLivro();

  const [editando, setEditando] = useState<Livro | null>(null);
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");

  function iniciarEdicao(l: Livro) {
    setEditando(l);
    setTitulo(l.titulo);
    setAutor(l.autor ?? "");
    setNota(l.nota);
    setComentario(l.comentario ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    setEditando(null);
    setTitulo("");
    setAutor("");
    setNota(0);
    setComentario("");
  }

  function salvar() {
    if (!titulo.trim()) return;
    const input = {
      titulo: titulo.trim(),
      autor: autor.trim() || null,
      nota,
      comentario: comentario.trim() || null,
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

  const salvando = criar.isPending || atualizar.isPending;

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <SectionHeader overline="Gestão Pessoal" title="Livros" />

      {livros.length > 0 && (
        <div className="mb-4 text-xs text-muted-foreground">
          <strong className="text-foreground">{livros.length}</strong>{" "}
          {livros.length === 1 ? "livro lido" : "livros lidos"}
        </div>
      )}

      <Card className="mb-5">
        <CardContent className="pt-6">
          {editando && (
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              Editando “{editando.titulo}”
            </p>
          )}
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <div className="mb-3 space-y-1.5">
              <Label>Título</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="ex.: O Nome da Rosa"
              />
            </div>
            <div className="mb-3 space-y-1.5">
              <Label>Autor</Label>
              <Input
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                placeholder="ex.: Umberto Eco"
              />
            </div>
          </div>
          <div className="mb-3 space-y-1.5">
            <Label>Sua avaliação</Label>
            <StarRating value={nota} onChange={setNota} size={26} />
          </div>
          <div className="mb-3 space-y-1.5">
            <Label>Notas e reflexões</Label>
            <Textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="O que este livro deixou em você?"
              className="min-h-[90px]"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Registrar leitura"}
            </Button>
            {editando && (
              <Button variant="ghost" onClick={cancelarEdicao}>
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : livros.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          <IconBooks className="size-8" stroke={1.5} />
          <p className="text-sm">Sua estante está vazia. Registre o último livro que terminou.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {livros.map((l) => (
            <Card
              key={l.id}
              onClick={() => iniciarEdicao(l)}
              className={
                editando?.id === l.id
                  ? "cursor-pointer border-primary"
                  : "cursor-pointer transition hover:border-muted-foreground/40"
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-foreground">{l.titulo}</div>
                    {l.autor && <div className="text-sm text-muted-foreground">{l.autor}</div>}
                  </div>
                  <button
                    onClick={(e) => excluir(l.id, e)}
                    aria-label="Excluir"
                    className="shrink-0 text-muted-foreground transition hover:text-destructive"
                  >
                    <IconTrash className="size-4" />
                  </button>
                </div>
                <div className="mt-1.5">
                  <StarRating value={l.nota} size={16} />
                </div>
                {l.comentario && (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {l.comentario}
                  </p>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  Concluído em {fmtData(l.data)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
