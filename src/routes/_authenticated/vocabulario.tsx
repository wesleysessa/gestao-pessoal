import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconCamera,
  IconLanguage,
  IconLayoutGrid,
  IconPencil,
  IconPhoto,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtData } from "@/lib/data";
import { useSignedUrl } from "@/lib/use-signed-url";
import { useCurrentProfile } from "@/features/auth/use-current-profile";
import {
  useCreateVocabulario,
  useDeleteFotoVocabulario,
  useDeleteVocabulario,
  useFotosVocabulario,
  useUpdateVocabulario,
  useUploadFotoVocabulario,
  useVocabulario,
} from "@/features/vocabulario/hooks";
import { FOTOS_BUCKET } from "@/features/vocabulario/service";
import {
  CLASSE_GRAMATICAL_LABEL,
  type ClasseGramatical,
  type FotoVocabulario,
  type Vocabulario as VocabularioItem,
} from "@/features/vocabulario/types";

export const Route = createFileRoute("/_authenticated/vocabulario")({
  component: Vocabulario,
});

const CLASSES_GRAMATICAIS: ClasseGramatical[] = [
  "substantivo",
  "verbo",
  "adjetivo",
  "phrasal_verb",
  "outro",
];

function FotoThumbInner({ path }: { path: string }) {
  const { data: url } = useSignedUrl(FOTOS_BUCKET, path);
  return url ? (
    <img src={url} alt="" className="size-full object-cover" />
  ) : (
    <div className="size-full animate-pulse bg-muted" />
  );
}

/** Miniatura que abre o arquivo original (sem corte) numa nova aba. */
function FotoOriginalLink({ path, className }: { path: string; className?: string }) {
  const { data: url } = useSignedUrl(FOTOS_BUCKET, path);
  if (!url) return <div className={`animate-pulse bg-muted ${className ?? ""}`} />;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title="Abrir foto original"
      className={className}
    >
      <img src={url} alt="" className="size-full object-cover" />
    </a>
  );
}

/** Faixa de miniaturas do card — clique abre a galeria completa em dialog. */
function FotosDoCard({ vocabularioId }: { vocabularioId: string }) {
  const { data: fotos = [] } = useFotosVocabulario(vocabularioId);
  const remover = useDeleteFotoVocabulario();
  const [aberto, setAberto] = useState(false);

  if (fotos.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setAberto(true);
        }}
        className="mt-2 flex items-center gap-1.5"
      >
        <div className="flex -space-x-2">
          {fotos.slice(0, 4).map((f) => (
            <div
              key={f.id}
              className="size-9 overflow-hidden rounded-md border-2 border-card bg-muted"
            >
              <FotoThumbInner path={f.storage_path} />
            </div>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          <IconPhoto className="inline size-3.5 align-text-bottom" /> {fotos.length}
        </span>
      </button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-lg" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Fotos</DialogTitle>
          </DialogHeader>
          <p className="-mt-2 text-xs text-muted-foreground">
            Toque numa foto para abrir o original
          </p>
          <div className="grid grid-cols-3 gap-2">
            {fotos.map((f) => (
              <div
                key={f.id}
                className="group relative aspect-square overflow-hidden rounded-md bg-muted"
              >
                <FotoOriginalLink path={f.storage_path} className="block size-full" />
                <button
                  onClick={() =>
                    remover.mutate(
                      { id: f.id, storagePath: f.storage_path, vocabularioId },
                      { onError: (e: Error) => toast.error(e.message) },
                    )
                  }
                  aria-label="Excluir foto"
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <IconX className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Fotos já salvas de um item em edição — removíveis direto. */
function FotosExistentes({ vocabularioId }: { vocabularioId: string }) {
  const { data: fotos = [] } = useFotosVocabulario(vocabularioId);
  const remover = useDeleteFotoVocabulario();

  if (fotos.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {fotos.map((f: FotoVocabulario) => (
        <div key={f.id} className="group relative size-16 overflow-hidden rounded-md bg-muted">
          <FotoOriginalLink path={f.storage_path} className="block size-full" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              remover.mutate(
                { id: f.id, storagePath: f.storage_path, vocabularioId },
                { onError: (err: Error) => toast.error(err.message) },
              );
            }}
            aria-label="Excluir foto"
            className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
          >
            <IconX className="size-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

function Vocabulario() {
  const { data: itens = [], isLoading } = useVocabulario();
  const { data: profile } = useCurrentProfile();
  const criar = useCreateVocabulario();
  const atualizar = useUpdateVocabulario();
  const remover = useDeleteVocabulario();
  const enviarFoto = useUploadFotoVocabulario();

  const [editando, setEditando] = useState<VocabularioItem | null>(null);
  const [termo, setTermo] = useState("");
  const [idioma, setIdioma] = useState("");
  const [traducao, setTraducao] = useState("");
  const [exemplo, setExemplo] = useState("");
  const [classeGramatical, setClasseGramatical] = useState<ClasseGramatical | "">("");
  const [antonimo, setAntonimo] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const [modo, setModo] = useState<"lista" | "phrasal">("lista");
  const [revisao, setRevisao] = useState(false);
  const [revelados, setRevelados] = useState<Record<string, boolean>>({});
  const [novasFotos, setNovasFotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Formulário começa fechado — só um botão "+ Inserir Vocabulário".
  const [formAberto, setFormAberto] = useState(false);

  const previews = useMemo(() => novasFotos.map((f) => URL.createObjectURL(f)), [novasFotos]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const idiomas = useMemo(() => [...new Set(itens.map((i) => i.idioma))], [itens]);
  const visiveis = useMemo(() => {
    let lista = filtro === "todos" ? itens : itens.filter((i) => i.idioma === filtro);
    const termoBusca = busca.trim().toLowerCase();
    if (termoBusca) {
      lista = lista.filter((i) =>
        [i.termo, i.traducao, i.exemplo, i.antonimo].some((campo) =>
          campo?.toLowerCase().includes(termoBusca),
        ),
      );
    }
    return lista;
  }, [itens, filtro, busca]);
  const phrasalVerbs = useMemo(
    () => itens.filter((i) => i.classe_gramatical === "phrasal_verb"),
    [itens],
  );

  const salvando = criar.isPending || atualizar.isPending || enviarFoto.isPending;

  // Ao entrar no quadro Phrasal Verbs pra adicionar uma nova palavra (sem
  // estar editando outra), já pré-seleciona a classe gramatical.
  useEffect(() => {
    if (modo === "phrasal" && !editando) setClasseGramatical("phrasal_verb");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo]);

  function iniciarEdicao(i: VocabularioItem) {
    setEditando(i);
    setTermo(i.termo);
    setIdioma(i.idioma);
    setTraducao(i.traducao);
    setExemplo(i.exemplo ?? "");
    setClasseGramatical((i.classe_gramatical as ClasseGramatical) ?? "");
    setAntonimo(i.antonimo ?? "");
    setNovasFotos([]);
    setFormAberto(true);
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
    setNovasFotos([]);
    setFormAberto(false);
  }

  async function enviarFotosPendentes(vocabularioId: string) {
    if (novasFotos.length === 0 || !profile) return;
    for (const file of novasFotos) {
      try {
        await enviarFoto.mutateAsync({ vocabularioId, userId: profile.id, file });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falha ao enviar foto");
      }
    }
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
        {
          onSuccess: async () => {
            await enviarFotosPendentes(editando.id);
            cancelarEdicao();
          },
          onError: (e: Error) => toast.error(e.message),
        },
      );
    } else {
      criar.mutate(input, {
        onSuccess: async (novo) => {
          await enviarFotosPendentes(novo.id);
          cancelarEdicao();
        },
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
      <div className="mb-1 flex items-start justify-between gap-2">
        <SectionHeader overline="Gestão Pessoal" title="Vocabulário" />
        <Button
          variant="outline"
          size="sm"
          className="mt-1 shrink-0 gap-1.5 text-xs"
          onClick={() => setModo((m) => (m === "lista" ? "phrasal" : "lista"))}
        >
          <IconLayoutGrid className="size-3.5" />
          {modo === "lista" ? "Quadro Phrasal Verbs" : "Vocabulário"}
        </Button>
      </div>

      {itens.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <span>
            <strong className="text-foreground">{idiomas.length}</strong>{" "}
            {idiomas.length === 1 ? "idioma" : "idiomas"}
          </span>
          <span>
            <strong className="text-foreground">{itens.length}</strong>{" "}
            {itens.length === 1 ? "palavra" : "palavras"}
          </span>
        </div>
      )}

      {formAberto && (
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

            <div className="mb-3 space-y-1.5">
              <Label>Fotos (opcional)</Label>
              {editando && <FotosExistentes vocabularioId={editando.id} />}
              {previews.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {previews.map((url, i) => (
                    <div
                      key={url}
                      className="group relative size-16 overflow-hidden rounded-md bg-muted"
                    >
                      <img src={url} alt="" className="size-full object-cover" />
                      <button
                        onClick={() => setNovasFotos((fs) => fs.filter((_, idx) => idx !== i))}
                        aria-label="Remover"
                        className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
                      >
                        <IconX className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setNovasFotos((fs) => [...fs, ...files]);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <IconCamera className="size-4" /> Anexar fotos
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={salvar} disabled={salvando}>
                {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Adicionar palavra"}
              </Button>
              <Button variant="ghost" onClick={cancelarEdicao}>
                {editando ? "Cancelar" : "Fechar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {modo === "phrasal" ? (
        <>
          {!formAberto && (
            <Button
              variant="outline"
              size="sm"
              className="mb-4 gap-1.5"
              onClick={() => setFormAberto(true)}
            >
              <IconPlus className="size-3.5" /> Inserir Vocabulário
            </Button>
          )}
          {phrasalVerbs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
              <IconLayoutGrid className="size-8" stroke={1.5} />
              <p className="text-sm">
                Nenhum phrasal verb ainda. Toque em "Inserir Vocabulário" e escolha a classe
                gramatical "Phrasal Verbs".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {phrasalVerbs.map((i) => (
                <Card key={i.id} className={editando?.id === i.id ? "border-primary" : undefined}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-lg font-semibold text-foreground">
                          {i.termo}
                        </div>
                        {i.exemplo && (
                          <div className="mt-1.5 text-sm italic text-muted-foreground">
                            “{i.exemplo}”
                          </div>
                        )}
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {!formAberto && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setFormAberto(true)}
              >
                <IconPlus className="size-3.5" /> Inserir Vocabulário
              </Button>
            )}
            {itens.length > 0 && (
              <>
                <div className="relative w-full sm:w-56">
                  <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar palavra..."
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
              </>
            )}
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : visiveis.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
              <IconLanguage className="size-8" stroke={1.5} />
              <p className="text-sm">
                {itens.length === 0
                  ? 'Nenhuma palavra ainda. Toque em "Inserir Vocabulário" pra registrar a primeira.'
                  : "Nenhuma palavra encontrada com esse filtro."}
              </p>
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
                        <div className="truncate text-lg font-semibold text-foreground">
                          {i.termo}
                        </div>
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
                      <div className="mt-1.5 text-xs italic text-muted-foreground">
                        “{i.exemplo}”
                      </div>
                    )}
                    <FotosDoCard vocabularioId={i.id} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
