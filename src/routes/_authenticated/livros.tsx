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
import { useCreateLivro, useDeleteLivro, useLivros } from "@/features/livros/hooks";

export const Route = createFileRoute("/_authenticated/livros")({
  component: Livros,
});

function Livros() {
  const { data: livros = [], isLoading } = useLivros();
  const criar = useCreateLivro();
  const remover = useDeleteLivro();

  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");

  function adicionar() {
    if (!titulo.trim()) return;
    criar.mutate(
      {
        titulo: titulo.trim(),
        autor: autor.trim() || null,
        nota,
        comentario: comentario.trim() || null,
      },
      {
        onSuccess: () => {
          setTitulo("");
          setAutor("");
          setNota(0);
          setComentario("");
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  function excluir(id: string) {
    remover.mutate(id, { onError: (e: Error) => toast.error(e.message) });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <SectionHeader overline="Gestão Pessoal" title="Livros" />

      <Card className="mb-5">
        <CardContent className="pt-6">
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
          <Button onClick={adicionar} disabled={criar.isPending}>
            {criar.isPending ? "Registrando…" : "Registrar leitura"}
          </Button>
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
            <Card key={l.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-foreground">{l.titulo}</div>
                    {l.autor && <div className="text-sm text-muted-foreground">{l.autor}</div>}
                  </div>
                  <button
                    onClick={() => excluir(l.id)}
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
