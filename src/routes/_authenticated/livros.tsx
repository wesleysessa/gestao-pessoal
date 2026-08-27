import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconBooks, IconCamera, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ds";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { cn } from "@/lib/utils";
import { fmtData } from "@/lib/data";
import { useSignedUrl } from "@/lib/use-signed-url";
import { useCurrentProfile } from "@/features/auth/use-current-profile";
import {
  useCreateEntradaLivro,
  useCreateLivro,
  useDeleteEntradaLivro,
  useDeleteLivro,
  useEntradasLivros,
  useLivros,
  useUpdateEntradaLivro,
  useUpdateLivro,
  useUploadCapa,
} from "@/features/livros/hooks";
import { CAPAS_BUCKET } from "@/features/livros/service";
import type { EntradaLivro, Livro } from "@/features/livros/types";

export const Route = createFileRoute("/_authenticated/livros")({
  component: Livros,
});

/** Dias corridos entre hoje e uma data ISO passada (0 = hoje, 1 = ontem...). */
function diasDesde(dataISO: string): number {
  const [a, m, d] = dataISO.split("-").map(Number);
  const entao = new Date(a, m - 1, d);
  const agora = new Date();
  agora.setHours(0, 0, 0, 0);
  return Math.round((agora.getTime() - entao.getTime()) / 86400000);
}

function CapaLivro({ path, className }: { path: string | null; className?: string }) {
  const { data: url } = useSignedUrl(CAPAS_BUCKET, path);
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted",
        className,
      )}
    >
      {path ? (
        url ? (
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <div className="size-full animate-pulse bg-muted" />
        )
      ) : (
        <IconBooks className="size-5 text-muted-foreground/50" stroke={1.5} />
      )}
    </div>
  );
}

function LivroCard({
  livro,
  entradas,
  emEdicaoLivro,
  onEditarLivro,
  onExcluirLivro,
}: {
  livro: Livro;
  entradas: EntradaLivro[];
  emEdicaoLivro: boolean;
  onEditarLivro: () => void;
  onExcluirLivro: () => void;
}) {
  const criarEntrada = useCreateEntradaLivro();
  const atualizarEntrada = useUpdateEntradaLivro();
  const removerEntrada = useDeleteEntradaLivro();

  const [entradaFormAberto, setEntradaFormAberto] = useState(false);
  const [entradaEditando, setEntradaEditando] = useState<EntradaLivro | null>(null);
  const [anotacoes, setAnotacoes] = useState("");
  const [notaEntrada, setNotaEntrada] = useState(0);
  const [paginas, setPaginas] = useState("");

  const notasValidas = entradas.filter((e) => e.nota != null).map((e) => e.nota as number);
  const notaMedia = notasValidas.length
    ? notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length
    : null;
  const totalPaginas = entradas.reduce((soma, e) => soma + (e.paginas ?? 0), 0);
  // `entradas` já vem ordenada por data desc (query do hook) — a primeira é a mais recente.
  const ultimaData = entradas[0]?.data ?? null;
  const diasSemLer = ultimaData ? diasDesde(ultimaData) : null;

  function iniciarEdicaoEntrada(e: EntradaLivro) {
    setEntradaEditando(e);
    setAnotacoes(e.anotacoes ?? "");
    setNotaEntrada(e.nota ?? 0);
    setPaginas(e.paginas != null ? String(e.paginas) : "");
    setEntradaFormAberto(true);
  }

  function cancelarEntrada() {
    setEntradaEditando(null);
    setAnotacoes("");
    setNotaEntrada(0);
    setPaginas("");
    setEntradaFormAberto(false);
  }

  function salvarEntrada() {
    const input = {
      anotacoes: anotacoes.trim() || null,
      nota: notaEntrada > 0 ? notaEntrada : null,
      paginas: paginas === "" ? null : Number(paginas),
    };
    if (entradaEditando) {
      atualizarEntrada.mutate(
        { id: entradaEditando.id, input },
        { onSuccess: cancelarEntrada, onError: (e: Error) => toast.error(e.message) },
      );
    } else {
      criarEntrada.mutate(
        { livroId: livro.id, input },
        { onSuccess: cancelarEntrada, onError: (e: Error) => toast.error(e.message) },
      );
    }
  }

  function excluirEntrada(id: string, ev: React.MouseEvent) {
    ev.stopPropagation();
    if (entradaEditando?.id === id) cancelarEntrada();
    removerEntrada.mutate(id, { onError: (e: Error) => toast.error(e.message) });
  }

  const salvandoEntrada = criarEntrada.isPending || atualizarEntrada.isPending;

  return (
    <Card className={emEdicaoLivro ? "border-primary" : undefined}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onEditarLivro}
            aria-label="Editar livro"
            className="shrink-0"
          >
            <CapaLivro path={livro.capa_path} className="h-16 w-12" />
          </button>
          <div className="min-w-0 flex-1">
            <button type="button" onClick={onEditarLivro} className="block w-full text-left">
              <div className="truncate text-base font-semibold text-foreground">{livro.titulo}</div>
              {livro.autor && <div className="text-sm text-muted-foreground">{livro.autor}</div>}
            </button>
            <div className="mt-1 text-xs text-muted-foreground">
              {ultimaData == null ? (
                "Nenhuma leitura registrada ainda"
              ) : diasSemLer === 0 ? (
                <span className="font-medium text-green-600 dark:text-green-400">Leu hoje ✓</span>
              ) : diasSemLer === 1 ? (
                "Sem ler há 1 dia"
              ) : (
                `Sem ler há ${diasSemLer} dias`
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <div className="flex flex-col items-end gap-0.5 text-xs font-semibold text-foreground">
              {notaMedia != null && <span>{notaMedia.toFixed(1)} ⭐</span>}
              {totalPaginas > 0 && <span>{totalPaginas} 📖</span>}
            </div>
            <button
              onClick={onExcluirLivro}
              aria-label="Excluir livro"
              className="text-muted-foreground transition hover:text-destructive"
            >
              <IconTrash className="size-4" />
            </button>
          </div>
        </div>

        {entradas.length > 0 && (
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            {entradas.map((e) => (
              <div
                key={e.id}
                onClick={() => iniciarEdicaoEntrada(e)}
                className={cn(
                  "cursor-pointer rounded-md border p-2.5 transition hover:border-muted-foreground/40",
                  entradaEditando?.id === e.id ? "border-primary" : "border-border",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{fmtData(e.data)}</span>
                  <div className="flex items-center gap-2">
                    {e.nota != null && <StarRating value={e.nota} size={12} />}
                    {e.paginas != null && (
                      <span className="text-xs text-muted-foreground">{e.paginas} pág.</span>
                    )}
                    <button
                      onClick={(ev) => excluirEntrada(e.id, ev)}
                      aria-label="Excluir leitura"
                      className="text-muted-foreground transition hover:text-destructive"
                    >
                      <IconX className="size-3.5" />
                    </button>
                  </div>
                </div>
                {e.anotacoes && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{e.anotacoes}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {!entradaFormAberto ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 gap-1.5"
            onClick={() => setEntradaFormAberto(true)}
          >
            <IconPlus className="size-3.5" /> Registrar leitura
          </Button>
        ) : (
          <div className="mt-3 flex flex-col gap-2 rounded-md border border-input p-3">
            <Label className="text-xs">
              {entradaEditando
                ? `Editando leitura de ${fmtData(entradaEditando.data)}`
                : "Leitura de hoje"}
            </Label>
            <Textarea
              value={anotacoes}
              onChange={(e) => setAnotacoes(e.target.value)}
              placeholder="Anotações (opcional)"
              className="min-h-[70px]"
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Qualidade da leitura</Label>
                <StarRating value={notaEntrada} onChange={setNotaEntrada} size={20} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Páginas lidas</Label>
                <Input
                  type="number"
                  min={0}
                  value={paginas}
                  onChange={(e) => setPaginas(e.target.value)}
                  placeholder="ex.: 20"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={salvarEntrada} disabled={salvandoEntrada}>
                {salvandoEntrada
                  ? "Salvando…"
                  : entradaEditando
                    ? "Salvar alterações"
                    : "Registrar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelarEntrada}>
                {entradaEditando ? "Cancelar" : "Fechar"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Livros() {
  const { data: livros = [], isLoading } = useLivros();
  const { data: entradas = [] } = useEntradasLivros();
  const { data: profile } = useCurrentProfile();
  const criar = useCreateLivro();
  const atualizar = useUpdateLivro();
  const remover = useDeleteLivro();
  const enviarCapa = useUploadCapa();

  const [editando, setEditando] = useState<Livro | null>(null);
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [capaFile, setCapaFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Formulário começa fechado — só um botão "+ Novo livro".
  const [formAberto, setFormAberto] = useState(false);

  const capaPreview = useMemo(() => (capaFile ? URL.createObjectURL(capaFile) : null), [capaFile]);
  useEffect(() => {
    return () => {
      if (capaPreview) URL.revokeObjectURL(capaPreview);
    };
  }, [capaPreview]);

  /** Entradas de todos os livros, agrupadas por livro_id (query única, agrupamento no cliente). */
  const entradasPorLivro = useMemo(() => {
    const map = new Map<string, EntradaLivro[]>();
    for (const e of entradas) {
      const arr = map.get(e.livro_id) ?? [];
      arr.push(e);
      map.set(e.livro_id, arr);
    }
    return map;
  }, [entradas]);

  function iniciarEdicao(l: Livro) {
    setEditando(l);
    setTitulo(l.titulo);
    setAutor(l.autor ?? "");
    setCapaFile(null);
    setFormAberto(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    setEditando(null);
    setTitulo("");
    setAutor("");
    setCapaFile(null);
    setFormAberto(false);
  }

  async function enviarCapaPendente(livroId: string) {
    if (!capaFile || !profile) return;
    try {
      await enviarCapa.mutateAsync({ livroId, userId: profile.id, file: capaFile });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar capa");
    }
  }

  function salvar() {
    if (!titulo.trim()) return;
    const input = { titulo: titulo.trim(), autor: autor.trim() || null };
    if (editando) {
      atualizar.mutate(
        { id: editando.id, input },
        {
          onSuccess: async () => {
            await enviarCapaPendente(editando.id);
            cancelarEdicao();
          },
          onError: (e: Error) => toast.error(e.message),
        },
      );
    } else {
      criar.mutate(input, {
        onSuccess: async (novo) => {
          await enviarCapaPendente(novo.id);
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

  const salvando = criar.isPending || atualizar.isPending || enviarCapa.isPending;

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <SectionHeader overline="Gestão Pessoal" title="Livros" />

      {livros.length > 0 && (
        <div className="mb-4 text-xs text-muted-foreground">
          <strong className="text-foreground">{livros.length}</strong>{" "}
          {livros.length === 1 ? "livro" : "livros"}
        </div>
      )}

      {!formAberto && (
        <Button
          variant="outline"
          size="sm"
          className="mb-5 gap-1.5"
          onClick={() => setFormAberto(true)}
        >
          <IconPlus className="size-4" /> Novo livro
        </Button>
      )}

      {formAberto && (
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
              <Label>Capa (opcional)</Label>
              <div className="flex items-center gap-3">
                {capaPreview ? (
                  <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                    <img src={capaPreview} alt="" className="size-full object-cover" />
                  </div>
                ) : editando?.capa_path ? (
                  <CapaLivro path={editando.capa_path} className="h-20 w-14" />
                ) : null}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setCapaFile(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <IconCamera className="size-4" />
                  {editando?.capa_path || capaPreview ? "Trocar capa" : "Escolher capa"}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={salvar} disabled={salvando}>
                {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Adicionar livro"}
              </Button>
              <Button variant="ghost" onClick={cancelarEdicao}>
                {editando ? "Cancelar" : "Fechar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : livros.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          <IconBooks className="size-8" stroke={1.5} />
          <p className="text-sm">Sua estante está vazia. Toque em "Novo livro" pra começar.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {livros.map((l) => (
            <LivroCard
              key={l.id}
              livro={l}
              entradas={entradasPorLivro.get(l.id) ?? []}
              emEdicaoLivro={editando?.id === l.id}
              onEditarLivro={() => iniciarEdicao(l)}
              onExcluirLivro={() => excluir(l.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
