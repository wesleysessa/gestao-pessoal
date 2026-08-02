import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { IconLanguage, IconPencil, IconTrash } from "@tabler/icons-react";
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
import { fmtData } from "@/lib/data";
import {
  useCreateVocabulario,
  useDeleteVocabulario,
  useUpdateVocabulario,
  useVocabulario,
} from "@/features/vocabulario/hooks";
import {
  CLASSE_GRAMATICAL_LABEL,
  type ClasseGramatical,
  type Vocabulario as VocabularioItem,
} from "@/features/vocabulario/types";

export const Route = createFileRoute("/_authenticated/vocabulario")({
  component: Vocabulario,
});

const CLASSES_GRAMATICAIS: ClasseGramatical[] = ["substantivo", "verbo", "adjetivo", "outro"];

function Vocabulario() {
  const { data: itens = [], isLoading } = useVocabulario();
  const criar = useCreateVocabulario();
  const atualizar = useUpdateVocabulario();
  const remover = useDeleteVocabulario();

  const [editando, setEditando] = useState<VocabularioItem | null>(null);
  const [termo, setTermo] = useState("");
  const [idioma, setIdioma] = useState("");
  const [traducao, setTraducao] = useState("");
  const [exemplo, setExemplo] = useState("");
  const [classeGramatical, setClasseGramatical] = useState<ClasseGramatical | "">("");
  const [antonimo, setAntonimo] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [revisao, setRevisao] = useState(false);
  const [revelados, setRevelados] = useState<Record<string, boolean>>({});

  const idiomas = useMemo(() => [...new Set(itens.map((i) => i.idioma))], [itens]);
  const visiveis = filtro === "todos" ? itens : itens.filter((i) => i.idioma === filtro);

  const salvando = criar.isPending || atualizar.isPending;

  function iniciarEdicao(i: VocabularioItem) {
    setEditando(i);
    setTermo(i.termo);
    setIdioma(i.idioma);
    setTraducao(i.traducao);
    setExemplo(i.exemplo ?? "");
    setClasseGramatical((i.classe_gramatical as ClasseGramatical) ?? "");
    setAntonimo(i.antonimo ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    setEditando(null);
    setTermo("");
    setIdioma("");
    setTraducao("");
    setExemplo("");
    setClasseGramatical("");
    setAntonimo("");
  }

  function salvar() {
    if (!termo.trim() || !traducao.trim() || !classeGramatical) {
      if (!classeGramatical) toast.error("Escolha a classe gramatical");
      return;
    }
    const input = {
      termo: termo.trim(),
      idioma: idioma.trim() || "Geral",
      traducao: traducao.trim(),
      exemplo: exemplo.trim() || null,
      classe_gramatical: classeGramatical,
      antonimo: antonimo.trim() || null,
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <SectionHeader overline="Gestão Pessoal" title="Vocabulário" />

      <Card className="mb-5">
        <CardContent className="pt-6">
          <Label className="mb-3 block">{editando ? "Editando palavra" : "Nova palavra"}</Label>
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
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <div className="mb-3 space-y-1.5">
              <Label>Classe gramatical</Label>
              <Select
                value={classeGramatical}
                onValueChange={(v) => setClasseGramatical(v as ClasseGramatical)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma opção" />
                </SelectTrigger>
                <SelectContent>
                  {CLASSES_GRAMATICAIS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CLASSE_GRAMATICAL_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mb-3 space-y-1.5">
              <Label>Antônimo (opcional)</Label>
              <Input
                value={antonimo}
                onChange={(e) => setAntonimo(e.target.value)}
                placeholder="ex.: feiúra"
              />
            </div>
          </div>
          <div className="mb-3 space-y-1.5">
            <Label>Frase de exemplo (opcional)</Label>
            <Input
              value={exemplo}
              onChange={(e) => setExemplo(e.target.value)}
              placeholder="ex.: pure serendipity."
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Adicionar palavra"}
            </Button>
            {editando && (
              <Button variant="ghost" onClick={cancelarEdicao}>
                Cancelar
              </Button>
            )}
          </div>
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
            <Card key={i.id} className={editando?.id === i.id ? "border-primary" : undefined}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary">{i.idioma}</Badge>
                      {i.classe_gramatical && (
                        <Badge variant="outline">
                          {CLASSE_GRAMATICAL_LABEL[i.classe_gramatical as ClasseGramatical]}
                        </Badge>
                      )}
                    </div>
                    <div className="truncate text-lg font-semibold text-foreground">{i.termo}</div>
                    <span className="text-[11px] text-muted-foreground">{fmtData(i.data)}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => iniciarEdicao(i)}
                      aria-label="Editar"
                      className="text-muted-foreground transition hover:text-primary"
                    >
                      <IconPencil className="size-4" />
                    </button>
                    <button
                      onClick={() => excluir(i.id)}
                      aria-label="Excluir"
                      className="text-muted-foreground transition hover:text-destructive"
                    >
                      <IconTrash className="size-4" />
                    </button>
                  </div>
                </div>
                {revisao && !revelados[i.id] ? (
                  <button
                    onClick={() => setRevelados({ ...revelados, [i.id]: true })}
                    className="mt-2 w-full rounded-md bg-secondary px-3 py-1.5 text-left text-sm font-medium text-secondary-foreground"
                  >
                    Revelar tradução
                  </button>
                ) : (
                  <>
                    <div className="mt-1.5 text-sm text-foreground">{i.traducao}</div>
                    {i.antonimo && (
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Antônimo: {i.antonimo}
                      </div>
                    )}
                  </>
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
