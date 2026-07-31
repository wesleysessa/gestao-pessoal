import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { IconNotebook, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ds";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { fmtData, hoje } from "@/lib/data";
import {
  useCreateEntradaDiario,
  useDeleteEntradaDiario,
  useDiario,
  useUpdateEntradaDiario,
} from "@/features/diario/hooks";
import type { EntradaDiario } from "@/features/diario/types";

export const Route = createFileRoute("/_authenticated/diario")({
  component: Diario,
});

function Diario() {
  const { data: entradas = [], isLoading } = useDiario();
  const criar = useCreateEntradaDiario();
  const atualizar = useUpdateEntradaDiario();
  const remover = useDeleteEntradaDiario();

  const [editando, setEditando] = useState<EntradaDiario | null>(null);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");

  function iniciarEdicao(e: EntradaDiario) {
    setEditando(e);
    setTitulo(e.titulo ?? "");
    setTexto(e.texto);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    setEditando(null);
    setTitulo("");
    setTexto("");
  }

  function salvar() {
    if (!texto.trim()) return;
    const input = { titulo: titulo.trim() || null, texto: texto.trim() };
    if (editando) {
      atualizar.mutate(
        { id: editando.id, input },
        {
          onSuccess: cancelarEdicao,
          onError: (e: Error) => toast.error(e.message),
        },
      );
    } else {
      criar.mutate(input, {
        onSuccess: () => {
          setTitulo("");
          setTexto("");
        },
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
      <SectionHeader overline="Gestão Pessoal" title="Diário" />

      <Card className="mb-5">
        <CardContent className="pt-6">
          <div className="mb-3 space-y-1.5">
            <Label>
              {editando
                ? `Editando entrada de ${fmtData(editando.data)}`
                : `Entrada de ${fmtData(hoje())}`}
            </Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título (opcional)"
            />
          </div>
          <div className="mb-3 space-y-1.5">
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="O que marcou o seu dia?"
              className="min-h-[120px]"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Guardar entrada"}
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
      ) : entradas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          <IconNotebook className="size-8" stroke={1.5} />
          <p className="text-sm">Seu diário está em branco. Escreva a primeira página.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entradas.map((e) => (
            <Card
              key={e.id}
              onClick={() => iniciarEdicao(e)}
              className={
                editando?.id === e.id
                  ? "cursor-pointer border-primary"
                  : "cursor-pointer transition hover:border-muted-foreground/40"
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs text-muted-foreground">{fmtData(e.data)}</span>
                    {e.titulo && (
                      <div className="text-base font-semibold text-foreground">{e.titulo}</div>
                    )}
                  </div>
                  <button
                    onClick={(ev) => excluir(e.id, ev)}
                    aria-label="Excluir"
                    className="shrink-0 text-muted-foreground transition hover:text-destructive"
                  >
                    <IconTrash className="size-4" />
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {e.texto}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
