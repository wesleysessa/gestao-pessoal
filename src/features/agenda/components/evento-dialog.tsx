import { useEffect, useMemo, useRef, useState } from "react";
import { IconCamera, IconFlag, IconPhoto, IconTrash, IconX } from "@tabler/icons-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSignedUrl } from "@/lib/use-signed-url";
import { useCurrentProfile } from "@/features/auth/use-current-profile";
import {
  useCreateEvento,
  useDeleteEvento,
  useDeleteFotoEvento,
  useFotosEvento,
  useUpdateEvento,
  useUploadFotoEvento,
} from "@/features/agenda/hooks";
import { FOTOS_BUCKET } from "@/features/agenda/service";
import {
  CORES_EVENTO,
  CORES_EVENTO_ORDEM,
  LEMBRETE_OPCOES,
  RECORRENCIAS,
  RECORRENCIA_LABEL,
  type CorEvento,
  type Evento,
  type FotoEvento,
  type NovoEvento,
  type Recorrencia,
} from "@/features/agenda/types";
import { useCreatePrioridade } from "@/features/prioridades/hooks";

import { hhmm, sincronizarComHT } from "@/features/agenda/util";

// Diálogo de criar/editar evento da Agenda — compartilhado entre a tela da
// Agenda e o Kanban (agenda vinculada a um cartão).

const COR_ANIVERSARIO: CorEvento = "flamingo";

export type FormValues = {
  titulo: string;
  descricao: string;
  local: string;
  diaInteiro: boolean;
  data: string;
  dataFim: string;
  horaInicio: string;
  horaFim: string;
  cor: CorEvento;
  recorrencia: Recorrencia;
  recorrenciaFim: string;
  lembreteMinutos: number | null;
  aniversario: boolean;
  destaque: boolean;
  radar: boolean;
  profissional: boolean;
};

function valoresVazios(dataPadrao: string): FormValues {
  return {
    titulo: "",
    descricao: "",
    local: "",
    diaInteiro: false,
    data: dataPadrao,
    dataFim: "",
    horaInicio: "",
    horaFim: "",
    cor: "blueberry",
    recorrencia: "nenhuma",
    recorrenciaFim: "",
    lembreteMinutos: null,
    aniversario: false,
    destaque: false,
    radar: false,
    profissional: false,
  };
}

function valoresDoEvento(e: Evento): FormValues {
  return {
    titulo: e.titulo,
    descricao: e.descricao ?? "",
    local: e.local ?? "",
    diaInteiro: e.dia_inteiro,
    data: e.data,
    dataFim: e.data_fim ?? "",
    horaInicio: hhmm(e.hora_inicio),
    horaFim: hhmm(e.hora_fim),
    cor: e.cor as CorEvento,
    recorrencia: e.recorrencia as Recorrencia,
    recorrenciaFim: e.recorrencia_fim ?? "",
    lembreteMinutos: e.lembrete_minutos,
    aniversario: e.aniversario,
    destaque: e.destaque,
    radar: e.radar,
    profissional: e.escopo === "profissional",
  };
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

/** Faixa de miniaturas do card — clique abre a galeria completa em dialog. */
export function FotosDoCard({ eventoId }: { eventoId: string }) {
  const { data: fotos = [] } = useFotosEvento(eventoId);
  const remover = useDeleteFotoEvento();
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
        className="mt-1.5 flex items-center gap-1.5"
      >
        <div className="flex -space-x-2">
          {fotos.slice(0, 4).map((f) => (
            <div
              key={f.id}
              className="size-7 overflow-hidden rounded-md border-2 border-card bg-muted"
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
                      { id: f.id, storagePath: f.storage_path, eventoId },
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

/** Fotos já salvas de um evento em edição — removíveis direto. */
function FotosExistentes({ eventoId }: { eventoId: string }) {
  const { data: fotos = [] } = useFotosEvento(eventoId);
  const remover = useDeleteFotoEvento();

  if (fotos.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {fotos.map((f: FotoEvento) => (
        <div key={f.id} className="group relative size-16 overflow-hidden rounded-md bg-muted">
          <FotoOriginalLink path={f.storage_path} className="block size-full" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              remover.mutate(
                { id: f.id, storagePath: f.storage_path, eventoId },
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

export function EventoDialog({
  aberto,
  onOpenChange,
  evento,
  dataPadrao,
  inicial,
  kanbanCartaoId,
}: {
  aberto: boolean;
  onOpenChange: (o: boolean) => void;
  evento: Evento | null;
  dataPadrao: string;
  /** Pré-preenche um evento novo (ex.: título do cartão do Kanban). */
  inicial?: Partial<FormValues>;
  /** Evento novo nasce vinculado a este cartão do Kanban. */
  kanbanCartaoId?: string;
}) {
  const { data: profile } = useCurrentProfile();
  const criar = useCreateEvento();
  const atualizar = useUpdateEvento();
  const remover = useDeleteEvento();
  const criarPrioridade = useCreatePrioridade();
  const enviarFoto = useUploadFotoEvento();
  const [v, setV] = useState<FormValues>(() => valoresVazios(dataPadrao));
  const [novasFotos, setNovasFotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => novasFotos.map((f) => URL.createObjectURL(f)), [novasFotos]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  useEffect(() => {
    if (!aberto) return;
    setV(evento ? valoresDoEvento(evento) : { ...valoresVazios(dataPadrao), ...inicial });
    setNovasFotos([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, evento]);

  async function enviarFotosPendentes(eventoId: string) {
    if (novasFotos.length === 0 || !profile) return;
    for (const file of novasFotos) {
      try {
        await enviarFoto.mutateAsync({ eventoId, userId: profile.id, file });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falha ao enviar foto");
      }
    }
  }

  const set = <K extends keyof FormValues>(key: K, val: FormValues[K]) =>
    setV((prev) => ({ ...prev, [key]: val }));

  function alternarAniversario() {
    setV((prev) =>
      prev.aniversario
        ? { ...prev, aniversario: false }
        : { ...prev, aniversario: true, diaInteiro: true, recorrencia: "anual" },
    );
  }

  const salvando = criar.isPending || atualizar.isPending || enviarFoto.isPending;
  const diaInteiroEfetivo = v.aniversario || v.diaInteiro;

  function salvar() {
    if (!v.titulo.trim()) {
      toast.error("Dê um título pro evento");
      return;
    }
    const diaInteiro = v.aniversario || v.diaInteiro;
    if (!diaInteiro && !v.horaInicio) {
      toast.error("Informe o horário de início");
      return;
    }
    const recorrencia = v.aniversario ? "anual" : v.recorrencia;
    const input: NovoEvento = {
      titulo: v.titulo.trim(),
      descricao: v.descricao.trim() || null,
      local: v.local.trim() || null,
      dia_inteiro: diaInteiro,
      data: v.data,
      data_fim: !v.aniversario && diaInteiro && v.dataFim ? v.dataFim : null,
      hora_inicio: diaInteiro ? null : v.horaInicio,
      hora_fim: diaInteiro ? null : v.horaFim || null,
      cor: v.aniversario ? COR_ANIVERSARIO : v.cor,
      recorrencia,
      recorrencia_fim: recorrencia !== "nenhuma" && v.recorrenciaFim ? v.recorrenciaFim : null,
      lembrete_minutos: v.lembreteMinutos,
      aniversario: v.aniversario,
      destaque: v.destaque,
      radar: v.radar,
      escopo: v.profissional ? "profissional" : "pessoal",
    };
    const onErr = (e: Error) => toast.error(e.message);
    if (evento) {
      atualizar.mutate(
        { id: evento.id, input },
        {
          onSuccess: async () => {
            await enviarFotosPendentes(evento.id);
            sincronizarComHT({ acao: "upsert", eventoId: evento.id });
            onOpenChange(false);
          },
          onError: onErr,
        },
      );
    } else {
      criar.mutate(
        { ...input, kanban_cartao_id: kanbanCartaoId ?? null },
        {
          onSuccess: async (novo) => {
            await enviarFotosPendentes(novo.id);
            sincronizarComHT({ acao: "upsert", eventoId: novo.id });
            onOpenChange(false);
          },
          onError: onErr,
        },
      );
    }
  }

  function excluir() {
    if (!evento) return;
    if (evento.compromisso_ht_id) {
      sincronizarComHT({ acao: "excluir", compromissoHtId: evento.compromisso_ht_id });
    }
    remover.mutate(evento.id, {
      onSuccess: () => onOpenChange(false),
      onError: (e: Error) => toast.error(e.message),
    });
  }

  /** Tira da Agenda e joga pra Lista de Prioridades (sem data). */
  function virarPrioridade() {
    if (!evento) return;
    criarPrioridade.mutate(
      {
        titulo: evento.titulo,
        descricao: evento.descricao,
        cor: "amarelo",
        concluida: false,
        escopo: evento.escopo,
      },
      {
        onSuccess: () => {
          remover.mutate(evento.id, { onError: (e: Error) => toast.error(e.message) });
          toast.success("Virou item da Lista de Prioridades");
          onOpenChange(false);
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-md flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 pb-3 pt-6">
          <DialogTitle>{evento ? "Agenda - Editar Evento" : "Agenda - Novo Evento"}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-3">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input
                value={v.titulo}
                onChange={(e) => set("titulo", e.target.value)}
                placeholder="ex.: Reunião com o time"
              />
            </div>

            <button
              type="button"
              onClick={alternarAniversario}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition",
                v.aniversario
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input text-foreground",
              )}
            >
              🎂 Aniversário
            </button>

            {!v.aniversario && (
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    [false, "Com horário"],
                    [true, "Dia inteiro"],
                  ] as [boolean, string][]
                ).map(([val, label]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => set("diaInteiro", val)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm font-medium transition",
                      v.diaInteiro === val
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>{diaInteiroEfetivo ? "De" : "Data"}</Label>
                <Input type="date" value={v.data} onChange={(e) => set("data", e.target.value)} />
              </div>
              {diaInteiroEfetivo && !v.aniversario && (
                <div className="space-y-1.5">
                  <Label>Até (opcional)</Label>
                  <Input
                    type="date"
                    value={v.dataFim}
                    min={v.data}
                    onChange={(e) => set("dataFim", e.target.value)}
                  />
                </div>
              )}
            </div>

            {!diaInteiroEfetivo && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>Início</Label>
                  <Input
                    type="time"
                    value={v.horaInicio}
                    onChange={(e) => set("horaInicio", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Fim (opcional)</Label>
                  <Input
                    type="time"
                    value={v.horaFim}
                    onChange={(e) => set("horaFim", e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Local (opcional)</Label>
              <Input
                value={v.local}
                onChange={(e) => set("local", e.target.value)}
                placeholder="ex.: Escritório"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={v.descricao}
                onChange={(e) => set("descricao", e.target.value)}
                className="min-h-[70px]"
              />
            </div>

            {!v.aniversario && (
              <div className="space-y-1.5">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {CORES_EVENTO_ORDEM.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set("cor", c)}
                      aria-label={CORES_EVENTO[c].label}
                      title={CORES_EVENTO[c].label}
                      className={cn(
                        "size-7 rounded-full transition",
                        CORES_EVENTO[c].dot,
                        v.cor === c &&
                          cn("ring-2 ring-offset-2 ring-offset-card", CORES_EVENTO[c].ring),
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {v.aniversario ? (
              <p className="text-xs text-muted-foreground">
                🎂 Repete todo ano, dia inteiro, na cor rosa — fica fácil de bater o olho no
                calendário.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>Repetir</Label>
                  <Select
                    value={v.recorrencia}
                    onValueChange={(val) => set("recorrencia", val as Recorrencia)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECORRENCIAS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {RECORRENCIA_LABEL[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {v.recorrencia !== "nenhuma" && (
                  <div className="space-y-1.5">
                    <Label>Repetir até (opcional)</Label>
                    <Input
                      type="date"
                      value={v.recorrenciaFim}
                      min={v.data}
                      onChange={(e) => set("recorrenciaFim", e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => set("destaque", !v.destaque)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition",
                v.destaque
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input text-foreground",
              )}
            >
              🔝 Destacar (aparece primeiro na lista do dia)
            </button>

            <button
              type="button"
              onClick={() => set("radar", !v.radar)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition",
                v.radar
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input text-foreground",
              )}
            >
              👁️ Radar (fica no grupo fixo do Quadro da Semana)
            </button>

            <button
              type="button"
              onClick={() => set("profissional", !v.profissional)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition",
                v.profissional
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input text-foreground",
              )}
            >
              💼 Profissional (replica na Agenda Comercial do Home & Tech)
            </button>

            <div className="space-y-1.5">
              <Label>Lembrete</Label>
              <Select
                value={v.lembreteMinutos == null ? "none" : String(v.lembreteMinutos)}
                onValueChange={(val) => set("lembreteMinutos", val === "none" ? null : Number(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEMBRETE_OPCOES.map((o) => (
                    <SelectItem key={o.label} value={o.valor == null ? "none" : String(o.valor)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Por enquanto é só uma anotação — lembrete por notificação é o próximo passo.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Fotos (opcional)</Label>
              {evento && <FotosExistentes eventoId={evento.id} />}
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
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-border px-6 py-4">
          <Button onClick={salvar} disabled={salvando} className="flex-1">
            {salvando ? "Salvando…" : "Salvar"}
          </Button>
          {evento && !evento.aniversario && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={virarPrioridade}
              disabled={criarPrioridade.isPending || remover.isPending}
              aria-label="Virar item da Lista de Prioridades"
              title="Tirar da Agenda e virar item da Lista de Prioridades (sem data)"
              className="text-muted-foreground hover:text-primary"
            >
              <IconFlag className="size-4" />
            </Button>
          )}
          {evento && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={excluir}
              disabled={remover.isPending}
              aria-label="Excluir evento"
              className="text-destructive hover:text-destructive"
            >
              <IconTrash className="size-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
