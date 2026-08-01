import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconBug,
  IconBulb,
  IconCamera,
  IconPencil,
  IconPhoto,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ds";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { dataLocalDe, fmtData } from "@/lib/data";
import { useSignedUrl } from "@/lib/use-signed-url";
import { useCurrentProfile } from "@/features/auth/use-current-profile";
import {
  useCreateMelhoria,
  useDeleteFotoMelhoria,
  useDeleteMelhoria,
  useFotosMelhoria,
  useMarcarEmFuncionamento,
  useMelhorias,
  useUpdateMelhoria,
  useUploadFotoMelhoria,
  useVoltarParaSugerido,
} from "@/features/melhorias/hooks";
import { FOTOS_BUCKET } from "@/features/melhorias/service";
import {
  STATUS_LABEL,
  TIPO_LABEL,
  type FotoMelhoria,
  type Melhoria,
  type StatusMelhoria,
  type TipoMelhoria,
} from "@/features/melhorias/types";

export const Route = createFileRoute("/_authenticated/melhorias")({
  component: Melhorias,
});

const TIPO_ICON: Record<TipoMelhoria, typeof IconBulb> = { sugestao: IconBulb, erro: IconBug };

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
  if (!url) return <div className={cn("animate-pulse bg-muted", className)} />;
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
function FotosDoCard({ melhoriaId }: { melhoriaId: string }) {
  const { data: fotos = [] } = useFotosMelhoria(melhoriaId);
  const remover = useDeleteFotoMelhoria();
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
            <DialogTitle>Fotos / prints</DialogTitle>
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
                      { id: f.id, storagePath: f.storage_path, melhoriaId },
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

/** Fotos já salvas de uma melhoria em edição — removíveis direto. */
function FotosExistentes({ melhoriaId }: { melhoriaId: string }) {
  const { data: fotos = [] } = useFotosMelhoria(melhoriaId);
  const remover = useDeleteFotoMelhoria();

  if (fotos.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {fotos.map((f: FotoMelhoria) => (
        <div key={f.id} className="group relative size-16 overflow-hidden rounded-md bg-muted">
          <FotoOriginalLink path={f.storage_path} className="block size-full" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              remover.mutate(
                { id: f.id, storagePath: f.storage_path, melhoriaId },
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

/** Dialog de retorno ao marcar como "Em Funcionamento". */
function DialogRetorno({
  aberta,
  onOpenChange,
  onConfirmar,
  enviando,
}: {
  aberta: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirmar: (retorno: string) => void;
  enviando: boolean;
}) {
  const [retorno, setRetorno] = useState("");
  useEffect(() => {
    if (aberta) setRetorno("");
  }, [aberta]);

  return (
    <Dialog open={aberta} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Marcar como Em Funcionamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Retorno (opcional)</Label>
          <Textarea
            value={retorno}
            onChange={(e) => setRetorno(e.target.value)}
            placeholder="Explique a decisão ou o que foi feito"
            className="min-h-[80px]"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirmar(retorno.trim())} disabled={enviando}>
            {enviando ? "Salvando…" : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Melhorias() {
  const { data: melhorias = [], isLoading } = useMelhorias();
  const { data: profile } = useCurrentProfile();
  const criar = useCreateMelhoria();
  const atualizar = useUpdateMelhoria();
  const voltarSugerido = useVoltarParaSugerido();
  const marcarFuncionando = useMarcarEmFuncionamento();
  const remover = useDeleteMelhoria();
  const enviarFoto = useUploadFotoMelhoria();

  const [editando, setEditando] = useState<Melhoria | null>(null);
  const [tipo, setTipo] = useState<TipoMelhoria>("sugestao");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [retorno, setRetorno] = useState("");
  const [novasFotos, setNovasFotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [retornoAberto, setRetornoAberto] = useState<Melhoria | null>(null);

  const previews = useMemo(() => novasFotos.map((f) => URL.createObjectURL(f)), [novasFotos]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | StatusMelhoria>("sugerido");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  function iniciarEdicao(m: Melhoria) {
    setEditando(m);
    setTipo(m.tipo as TipoMelhoria);
    setTitulo(m.titulo);
    setDescricao(m.descricao ?? "");
    setRetorno(m.retorno ?? "");
    setNovasFotos([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    setEditando(null);
    setTipo("sugestao");
    setTitulo("");
    setDescricao("");
    setRetorno("");
    setNovasFotos([]);
  }

  async function enviarFotosPendentes(melhoriaId: string) {
    if (novasFotos.length === 0 || !profile) return;
    for (const file of novasFotos) {
      try {
        await enviarFoto.mutateAsync({ melhoriaId, userId: profile.id, file });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falha ao enviar foto");
      }
    }
  }

  function salvar() {
    if (!titulo.trim()) return;
    const input = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      status: editando?.status ?? "sugerido",
      tipo,
      retorno: retorno.trim() || null,
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
        onSuccess: async (nova) => {
          await enviarFotosPendentes(nova.id);
          cancelarEdicao();
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

  function handlePaste(e: React.ClipboardEvent) {
    const arquivos = Array.from(e.clipboardData.items)
      .filter((i) => i.type.startsWith("image/"))
      .map((i) => i.getAsFile())
      .filter((f): f is File => !!f);
    if (arquivos.length > 0) setNovasFotos((fs) => [...fs, ...arquivos]);
  }

  const salvando = criar.isPending || atualizar.isPending || enviarFoto.isPending;

  const filtradasPorBuscaEData = useMemo(() => {
    return melhorias.filter((m) => {
      if (busca.trim()) {
        const q = busca.trim().toLowerCase();
        if (!`${m.titulo} ${m.descricao ?? ""}`.toLowerCase().includes(q)) return false;
      }
      const dia = dataLocalDe(m.created_at);
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
            <Label>{editando ? "Editando" : "Nova sugestão / relatar erro"}</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["sugestao", "erro"] as TipoMelhoria[]).map((t) => {
                const Icon = TIPO_ICON[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition",
                      tipo === t
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {TIPO_LABEL[t]}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mb-3 space-y-1.5">
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
              onPaste={handlePaste}
              placeholder="Descreva a ideia ou o problema"
              className="min-h-[90px]"
            />
          </div>
          <div className="mb-3 space-y-1.5">
            <Label>Retorno (opcional)</Label>
            <Textarea
              value={retorno}
              onChange={(e) => setRetorno(e.target.value)}
              onPaste={handlePaste}
              placeholder="Explique a decisão, se já tiver uma"
              className="min-h-[70px]"
            />
          </div>

          <div className="mb-3 space-y-1.5">
            <Label>Fotos / prints (opcional — ou cole com Ctrl+V)</Label>
            {editando && <FotosExistentes melhoriaId={editando.id} />}
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
              <IconCamera className="size-4" /> Anexar fotos/prints
            </Button>
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
          {visiveis.map((m) => {
            const Icon = TIPO_ICON[m.tipo as TipoMelhoria] ?? IconBulb;
            return (
              <Card key={m.id} className={editando?.id === m.id ? "border-primary" : undefined}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Icon className="size-4 shrink-0 text-primary" />
                      <div className="truncate text-base font-semibold text-foreground">
                        {m.titulo}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => iniciarEdicao(m)}
                        aria-label="Editar"
                        className="text-muted-foreground transition hover:text-primary"
                      >
                        <IconPencil className="size-4" />
                      </button>
                      <button
                        onClick={(e) => excluir(m.id, e)}
                        aria-label="Excluir"
                        className="text-muted-foreground transition hover:text-destructive"
                      >
                        <IconTrash className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
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
                      {TIPO_LABEL[m.tipo as TipoMelhoria]} · {fmtData(dataLocalDe(m.created_at))}
                    </span>
                  </div>

                  {m.descricao && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {m.descricao}
                    </p>
                  )}

                  {m.retorno && (
                    <p className="mt-2 whitespace-pre-wrap rounded-md bg-secondary p-2 text-xs text-secondary-foreground">
                      <strong>Retorno:</strong> {m.retorno}
                    </p>
                  )}

                  <FotosDoCard melhoriaId={m.id} />

                  <button
                    onClick={() =>
                      m.status === "sugerido"
                        ? setRetornoAberto(m)
                        : voltarSugerido.mutate(m.id, {
                            onError: (e: Error) => toast.error(e.message),
                          })
                    }
                    className="mt-2.5 text-xs font-semibold text-primary hover:underline"
                  >
                    {m.status === "sugerido" ? "Marcar em funcionamento" : "Voltar a sugerido"}
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <DialogRetorno
        aberta={!!retornoAberto}
        onOpenChange={(o) => !o && setRetornoAberto(null)}
        enviando={marcarFuncionando.isPending}
        onConfirmar={(texto) => {
          if (!retornoAberto) return;
          marcarFuncionando.mutate(
            { id: retornoAberto.id, retorno: texto || null },
            {
              onSuccess: () => setRetornoAberto(null),
              onError: (e: Error) => toast.error(e.message),
            },
          );
        }}
      />
    </div>
  );
}
