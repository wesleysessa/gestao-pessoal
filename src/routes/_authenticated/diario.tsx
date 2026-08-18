import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconBarbell,
  IconCamera,
  IconNotebook,
  IconPhoto,
  IconStar,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ds";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StarRating } from "@/components/star-rating";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { addDias, dataLocalDe, domingoDaSemana, fmtData, hoje, segundaDaSemana } from "@/lib/data";
import { useSignedUrl } from "@/lib/use-signed-url";
import { useCurrentProfile } from "@/features/auth/use-current-profile";
import {
  useCreateEntradaDiario,
  useDeleteEntradaDiario,
  useDeleteFotoEntrada,
  useDiario,
  useFotosEntrada,
  useUpdateEntradaDiario,
  useUploadFotoEntrada,
} from "@/features/diario/hooks";
import { FOTOS_BUCKET } from "@/features/diario/service";
import type { EntradaDiario, FotoDiario } from "@/features/diario/types";
import {
  useCheckinsAcademia,
  useDesmarcarCheckinAcademia,
  useMarcarCheckinAcademiaHoje,
} from "@/features/academia/hooks";

export const Route = createFileRoute("/_authenticated/diario")({
  component: Diario,
});

const HUMORES = ["Péssimo", "Ruim", "Neutro", "Bom", "Ótimo"];

const notaChartConfig = {
  nota: { label: "Nota do dia", color: "var(--color-primary)" },
} satisfies ChartConfig;

/** Dias do mês corrente, do dia 1 até hoje (dias futuros não têm dado). */
function diasDoMesAteHoje(): string[] {
  const hojeDate = new Date();
  const dias: string[] = [];
  for (let d = 1; d <= hojeDate.getDate(); d++) {
    const dt = new Date(hojeDate.getFullYear(), hojeDate.getMonth(), d);
    dias.push(dataLocalDe(dt));
  }
  return dias;
}

function Escala({
  valor,
  onEscolher,
  rotulos,
}: {
  valor: number;
  onEscolher: (n: number) => void;
  rotulos?: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onEscolher(n)}
          className={cn(
            "rounded-md border px-3 py-2 text-xs font-semibold transition",
            n === valor
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-transparent text-foreground",
          )}
        >
          {rotulos ? rotulos[n - 1] : n}
        </button>
      ))}
    </div>
  );
}

/** Tira/faixa de miniaturas do dia — clique abre a galeria completa em dialog. */
function FotosDoDia({ entradaId }: { entradaId: string }) {
  const { data: fotos = [] } = useFotosEntrada(entradaId);
  const remover = useDeleteFotoEntrada();
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
            <DialogTitle>Fotos — {fmtData(hoje())}</DialogTitle>
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
                      { id: f.id, storagePath: f.storage_path, entradaId },
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

/** Fotos já salvas de uma entrada em edição — removíveis direto. */
function FotosExistentes({ entradaId }: { entradaId: string }) {
  const { data: fotos = [] } = useFotosEntrada(entradaId);
  const remover = useDeleteFotoEntrada();

  if (fotos.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {fotos.map((f: FotoDiario) => (
        <div key={f.id} className="group relative size-16 overflow-hidden rounded-md bg-muted">
          <FotoOriginalLink path={f.storage_path} className="block size-full" />
          <button
            onClick={() =>
              remover.mutate(
                { id: f.id, storagePath: f.storage_path, entradaId },
                { onError: (e: Error) => toast.error(e.message) },
              )
            }
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

function Diario() {
  const { data: entradas = [], isLoading } = useDiario();
  const { data: profile } = useCurrentProfile();
  const criar = useCreateEntradaDiario();
  const atualizar = useUpdateEntradaDiario();
  const remover = useDeleteEntradaDiario();
  const enviarFoto = useUploadFotoEntrada();

  const { data: checkinsAcademia = [] } = useCheckinsAcademia();
  const marcarAcademia = useMarcarCheckinAcademiaHoje();
  const desmarcarAcademia = useDesmarcarCheckinAcademia();
  const checkinAcademiaHoje = checkinsAcademia.find((c) => c.data === hoje());

  const [editando, setEditando] = useState<EntradaDiario | null>(null);
  const [titulo, setTitulo] = useState("");
  const [aprendizado, setAprendizado] = useState("");
  const [texto, setTexto] = useState("");
  const [nota, setNota] = useState(0);
  const [humor, setHumor] = useState(0);
  const [energia, setEnergia] = useState(0);
  const [novasFotos, setNovasFotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => novasFotos.map((f) => URL.createObjectURL(f)), [novasFotos]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  function iniciarEdicao(e: EntradaDiario) {
    setEditando(e);
    setTitulo(e.titulo ?? "");
    setAprendizado(e.aprendizado ?? "");
    setTexto(e.texto);
    setNota(e.nota ?? 0);
    setHumor(e.humor ?? 0);
    setEnergia(e.energia ?? 0);
    setNovasFotos([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    setEditando(null);
    setTitulo("");
    setAprendizado("");
    setTexto("");
    setNota(0);
    setHumor(0);
    setEnergia(0);
    setNovasFotos([]);
  }

  function alternarAcademia() {
    if (checkinAcademiaHoje) {
      desmarcarAcademia.mutate(checkinAcademiaHoje.id, {
        onError: (e: Error) => toast.error(e.message),
      });
    } else {
      marcarAcademia.mutate(undefined, { onError: (e: Error) => toast.error(e.message) });
    }
  }

  async function enviarFotosPendentes(entradaId: string) {
    if (novasFotos.length === 0 || !profile) return;
    for (const file of novasFotos) {
      try {
        await enviarFoto.mutateAsync({ entradaId, userId: profile.id, file });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falha ao enviar foto");
      }
    }
  }

  function salvar() {
    if (!texto.trim()) return;
    const input = {
      titulo: titulo.trim() || null,
      aprendizado: aprendizado.trim() || null,
      texto: texto.trim(),
      nota: nota > 0 ? nota : null,
      humor: humor > 0 ? humor : null,
      energia: energia > 0 ? energia : null,
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

  const salvando = criar.isPending || atualizar.isPending || enviarFoto.isPending;

  const diasComAcademia = useMemo(
    () => new Set(checkinsAcademia.map((c) => c.data)),
    [checkinsAcademia],
  );

  // Academia conta domingo a domingo (igual ao antigo Check-in Saúde).
  const semanaAcademia = useMemo(() => domingoDaSemana(hoje()), []);
  const checkinsNaSemana = useMemo(() => {
    const fimSemana = addDias(semanaAcademia, 6);
    return checkinsAcademia.filter((c) => c.data >= semanaAcademia && c.data <= fimSemana).length;
  }, [checkinsAcademia, semanaAcademia]);

  // Energia continua na semana segunda-domingo (mesma convenção do resto do app).
  const semanaAtual = useMemo(() => segundaDaSemana(hoje()), []);
  const mediaEnergiaSemana = useMemo(() => {
    const valores = entradas
      .filter((e) => e.data >= semanaAtual && e.data <= hoje() && e.energia != null)
      .map((e) => e.energia as number);
    return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
  }, [entradas, semanaAtual]);

  const notaPorDia = useMemo(() => {
    const somas = new Map<string, { soma: number; qtd: number }>();
    for (const e of entradas) {
      if (e.nota == null) continue;
      const atual = somas.get(e.data) ?? { soma: 0, qtd: 0 };
      atual.soma += e.nota;
      atual.qtd += 1;
      somas.set(e.data, atual);
    }
    const medias = new Map<string, number>();
    for (const [data, { soma, qtd }] of somas) medias.set(data, soma / qtd);
    return medias;
  }, [entradas]);

  const dadosGrafico = useMemo(
    () => diasDoMesAteHoje().map((data) => ({ data, nota: notaPorDia.get(data) })),
    [notaPorDia],
  );

  const mediaDoMes = useMemo(() => {
    const valores = [...notaPorDia.values()];
    if (valores.length === 0) return null;
    return valores.reduce((a, b) => a + b, 0) / valores.length;
  }, [notaPorDia]);

  const ultimosComHumor = useMemo(
    () =>
      [...entradas]
        .filter((e) => e.humor != null)
        .sort((a, b) => a.data.localeCompare(b.data))
        .slice(-14),
    [entradas],
  );

  const aprendizados = useMemo(() => entradas.filter((e) => e.aprendizado).length, [entradas]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <SectionHeader overline="Gestão Pessoal" title="Diário" />

      {entradas.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <span>
            <strong className="text-foreground">{entradas.length}</strong>{" "}
            {entradas.length === 1 ? "entrada" : "entradas"}
          </span>
          <span>
            <strong className="text-foreground">{aprendizados}</strong>{" "}
            {aprendizados === 1 ? "aprendizado" : "aprendizados"} 🌟
          </span>
          {mediaEnergiaSemana != null && (
            <span>
              <strong className="text-foreground">{mediaEnergiaSemana.toFixed(1)}</strong> energia
              média (semana)
            </span>
          )}
          <span>
            <strong className="text-foreground">{checkinsNaSemana}</strong> vezes na academia
            (semana)
          </span>
        </div>
      )}

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
            <Input
              value={aprendizado}
              onChange={(e) => setAprendizado(e.target.value)}
              placeholder="Aprendizado ou curiosidade de hoje (opcional — ganha uma estrela)"
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

          <div className="mb-3.5 space-y-1.5">
            <Label>Humor (opcional)</Label>
            <Escala valor={humor} onEscolher={setHumor} rotulos={HUMORES} />
          </div>
          <div className="mb-3.5 space-y-1.5">
            <Label>Energia (1 = esgotado · 5 = a mil, opcional)</Label>
            <Escala valor={energia} onEscolher={setEnergia} />
          </div>
          <div className="mb-3 space-y-1.5">
            <Label>Nota de produtividade (opcional)</Label>
            <StarRating value={nota} onChange={setNota} size={24} />
          </div>

          <div className="mb-3 space-y-1.5">
            <Label>Fotos</Label>
            {editando && <FotosExistentes entradaId={editando.id} />}
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
              <IconCamera className="size-4" /> Adicionar fotos
            </Button>
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

      <Card className="mb-5">
        <CardContent className="flex items-center justify-between gap-2 pt-6">
          <Button
            variant={checkinAcademiaHoje ? "default" : "outline"}
            onClick={alternarAcademia}
            disabled={marcarAcademia.isPending || desmarcarAcademia.isPending}
          >
            <IconBarbell className="size-4" />
            {checkinAcademiaHoje ? "Fui à academia hoje ✓" : "Check Academia"}
          </Button>
          <span className="text-xs text-muted-foreground">({checkinsNaSemana}/7)</span>
        </CardContent>
      </Card>

      {mediaDoMes != null && (
        <Card className="mb-5">
          <CardContent className="pt-6">
            <div className="mb-3.5 flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-foreground">Produtividade — mês atual</div>
              <div className="text-sm font-semibold text-primary">
                Média {mediaDoMes.toFixed(1)}
              </div>
            </div>
            <ChartContainer config={notaChartConfig} className="h-48 w-full">
              <LineChart data={dadosGrafico} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="data"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => v.slice(8, 10)}
                  minTickGap={16}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  width={24}
                  domain={[0, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(v: string) => fmtData(v as string)}
                      indicator="line"
                    />
                  }
                />
                <ReferenceLine
                  y={mediaDoMes}
                  stroke="var(--color-muted-foreground)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
                <Line
                  dataKey="nota"
                  type="monotone"
                  stroke="var(--color-nota)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {ultimosComHumor.length > 1 && (
        <Card className="mb-5">
          <CardContent className="pt-6">
            <div className="mb-2.5 text-xs uppercase tracking-wide text-muted-foreground">
              Humor — últimos {ultimosComHumor.length} registros
            </div>
            <div className="flex h-20 items-end gap-1">
              {ultimosComHumor.map((e) => (
                <div
                  key={e.id}
                  title={`${fmtData(e.data)} — ${HUMORES[(e.humor as number) - 1]}`}
                  className={cn(
                    "min-w-2 flex-1 rounded-t",
                    (e.humor as number) >= 4
                      ? "bg-green-500"
                      : e.humor === 3
                        ? "bg-amber-400"
                        : "bg-primary",
                  )}
                  style={{ height: `${((e.humor as number) / 5) * 100}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                  <div className="flex shrink-0 items-center gap-2">
                    {diasComAcademia.has(e.data) && (
                      <span className="text-base" title="Foi à academia">
                        🏋️
                      </span>
                    )}
                    {e.aprendizado && (
                      <IconStar
                        className="size-4 fill-amber-400 text-amber-400"
                        aria-label="Aprendizado registrado hoje"
                      />
                    )}
                    <button
                      onClick={(ev) => excluir(e.id, ev)}
                      aria-label="Excluir"
                      className="text-muted-foreground transition hover:text-destructive"
                    >
                      <IconTrash className="size-4" />
                    </button>
                  </div>
                </div>
                {(e.humor != null || e.energia != null) && (
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    {e.humor != null && <span>Humor: {HUMORES[e.humor - 1]}</span>}
                    {e.energia != null && <span>Energia: {e.energia}/5</span>}
                  </div>
                )}
                {e.nota != null && (
                  <div className="mt-1.5">
                    <StarRating value={e.nota} size={14} />
                  </div>
                )}
                {e.aprendizado && (
                  <div className="mt-1.5 flex items-start gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <IconStar className="mt-0.5 size-3 shrink-0 fill-amber-400 text-amber-400" />
                    {e.aprendizado}
                  </div>
                )}
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {e.texto}
                </p>
                <FotosDoDia entradaId={e.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
