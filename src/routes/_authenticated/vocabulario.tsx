import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { IconLanguage, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ds";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateVocabulario,
  useDeleteVocabulario,
  useVocabulario,
} from "@/features/vocabulario/hooks";

export const Route = createFileRoute("/_authenticated/vocabulario")({
  component: Vocabulario,
});

function Vocabulario() {
  const { data: itens = [], isLoading } = useVocabulario();
  const criar = useCreateVocabulario();
  const remover = useDeleteVocabulario();

  const [termo, setTermo] = useState("");
  const [idioma, setIdioma] = useState("");
  const [traducao, setTraducao] = useState("");
  const [exemplo, setExemplo] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [revisao, setRevisao] = useState(false);
  const [revelados, setRevelados] = useState<Record<string, boolean>>({});

  const idiomas = useMemo(() => [...new Set(itens.map((i) => i.idioma))], [itens]);
  const visiveis = filtro === "todos" ? itens : itens.filter((i) => i.idioma === filtro);

  function adicionar() {
    if (!termo.trim() || !traducao.trim()) return;
    criar.mutate(
      {
        termo: termo.trim(),
        idioma: idioma.trim() || "Geral",
        traducao: traducao.trim(),
        exemplo: exemplo.trim() || null,
      },
      {
        onSuccess: () => {
          setTermo("");
          setTraducao("");
          setExemplo("");
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
      <SectionHeader overline="Gestão Pessoal" title="Vocabulário" />

      <Card className="mb-5">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <div className="mb-3 space-y-1.5">
              <Label>Palavra ou expressão</Label>
              <Input
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="ex.: serendipity"
              />
            </div>
            <div className="mb-3 space-y-1.5">
              <Label>Idioma</Label>
              <Input
                value={idioma}
                onChange={(e) => setIdioma(e.target.value)}
                placeholder="ex.: Inglês"
                list="idiomas"
              />
              <datalist id="idiomas">
                {idiomas.map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="mb-3 space-y-1.5">
            <Label>Tradução ou significado</Label>
            <Input
              value={traducao}
              onChange={(e) => setTraducao(e.target.value)}
              placeholder="ex.: descoberta feliz por acaso"
            />
          </div>
          <div className="mb-3 space-y-1.5">
            <Label>Frase de exemplo (opcional)</Label>
            <Input
              value={exemplo}
              onChange={(e) => setExemplo(e.target.value)}
              placeholder="ex.: pure serendipity."
            />
          </div>
          <Button onClick={adicionar} disabled={criar.isPending}>
            {criar.isPending ? "Adicionando…" : "Adicionar palavra"}
          </Button>
        </CardContent>
      </Card>

      {itens.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os idiomas</SelectItem>
              {idiomas.map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRevisao((v) => !v);
              setRevelados({});
            }}
          >
            {revisao ? "Sair do modo revisão" : "Modo revisão"}
          </Button>
          {revisao && (
            <span className="text-xs text-muted-foreground">
              Toque no card para revelar a tradução
            </span>
          )}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : visiveis.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          <IconLanguage className="size-8" stroke={1.5} />
          <p className="text-sm">Nenhuma palavra ainda. Registre a primeira acima.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visiveis.map((i) => (
            <Card key={i.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Badge variant="secondary" className="mb-1">
                      {i.idioma}
                    </Badge>
                    <div className="truncate text-lg font-semibold text-foreground">{i.termo}</div>
                  </div>
                  <button
                    onClick={() => excluir(i.id)}
                    aria-label="Excluir"
                    className="shrink-0 text-muted-foreground transition hover:text-destructive"
                  >
                    <IconTrash className="size-4" />
                  </button>
                </div>
                {revisao && !revelados[i.id] ? (
                  <button
                    onClick={() => setRevelados({ ...revelados, [i.id]: true })}
                    className="mt-2 w-full rounded-md bg-secondary px-3 py-1.5 text-left text-sm font-medium text-secondary-foreground"
                  >
                    Revelar tradução
                  </button>
                ) : (
                  <div className="mt-1.5 text-sm text-foreground">{i.traducao}</div>
                )}
                {i.exemplo && (!revisao || revelados[i.id]) && (
                  <div className="mt-1.5 text-xs italic text-muted-foreground">“{i.exemplo}”</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
