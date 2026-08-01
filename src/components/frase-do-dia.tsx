import { useState } from "react";
import { IconQuote, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { dataLocalDe, fmtData } from "@/lib/data";
import {
  useCreateFrase,
  useDeleteFrase,
  useFraseDoDia,
  useFrases,
  useUpdateFrase,
} from "@/features/frases/hooks";
import type { Frase } from "@/features/frases/types";

function GestaoFrases() {
  const { data: frases = [], isLoading } = useFrases();
  const criar = useCreateFrase();
  const atualizar = useUpdateFrase();
  const remover = useDeleteFrase();

  const [editando, setEditando] = useState<Frase | null>(null);
  const [texto, setTexto] = useState("");
  const [autor, setAutor] = useState("");

  function iniciarEdicao(f: Frase) {
    setEditando(f);
    setTexto(f.texto);
    setAutor(f.autor ?? "");
  }

  function cancelarEdicao() {
    setEditando(null);
    setTexto("");
    setAutor("");
  }

  function salvar() {
    if (!texto.trim()) return;
    const input = { texto: texto.trim(), autor: autor.trim() || null };
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

  const salvando = criar.isPending || atualizar.isPending;

  return (
    <div>
      <div className="mb-4 space-y-2">
        <Label>{editando ? "Editando frase" : "Nova frase"}</Label>
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Digite a frase"
          className="min-h-[70px]"
        />
        <Input
          value={autor}
          onChange={(e) => setAutor(e.target.value)}
          placeholder="Autor (opcional)"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Adicionar"}
          </Button>
          {editando && (
            <Button size="sm" variant="ghost" onClick={cancelarEdicao}>
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : frases.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma frase cadastrada ainda.</p>
      ) : (
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {frases.map((f) => (
            <div
              key={f.id}
              onClick={() => iniciarEdicao(f)}
              className={
                editando?.id === f.id
                  ? "cursor-pointer rounded-md border border-primary p-2.5"
                  : "cursor-pointer rounded-md border border-border p-2.5 transition hover:border-muted-foreground/40"
              }
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm italic text-foreground">"{f.texto}"</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    excluir(f.id);
                  }}
                  aria-label="Excluir"
                  className="shrink-0 text-muted-foreground transition hover:text-destructive"
                >
                  <IconTrash className="size-3.5" />
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {[f.autor ? `— ${f.autor}` : null, fmtData(dataLocalDe(f.created_at))]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FraseDoDia() {
  const { frase, temFrases } = useFraseDoDia();
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Card
        className="mb-5 cursor-pointer transition hover:border-muted-foreground/40"
        onClick={() => setAberto(true)}
      >
        <CardContent className="pt-6">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <IconQuote className="size-3.5" />
            Frase do dia
          </div>
          {temFrases && frase ? (
            <>
              <p className="text-[15px] font-light italic leading-relaxed text-foreground">
                "{frase.texto}"
              </p>
              {frase.autor && (
                <p className="mt-1.5 text-xs text-muted-foreground">— {frase.autor}</p>
              )}
            </>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              Toque aqui para cadastrar suas frases favoritas.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Banco de frases</DialogTitle>
          </DialogHeader>
          <GestaoFrases />
        </DialogContent>
      </Dialog>
    </>
  );
}
