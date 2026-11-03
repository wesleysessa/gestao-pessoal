import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import {
  IconArrowDown,
  IconPencil,
  IconPlus,
  IconSearch,
  IconStack2,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ds";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useDeleteEventoLinha,
  useDeletePeriodo,
  useEventosLinha,
  usePeriodos,
  useSalvarEventoLinha,
  useSalvarPeriodo,
} from "@/features/linha-do-tempo/hooks";
import {
  CORES_PERIODO,
  COR_INFO,
  UNIDADES,
  UNIDADE_LABEL,
  corInfo,
  type CorPeriodo,
  type EventoLinha,
  type Periodo,
  type Unidade,
} from "@/features/linha-do-tempo/types";
import {
  arvoreDePeriodos,
  caminhoDoAno,
  deAno,
  descendentes,
  fmtAno,
  fmtDuracao,
  fmtIntervalo,
  fmtQuando,
  milhar,
  paraAno,
  unidadeAuto,
} from "@/features/linha-do-tempo/util";

export const Route = createFileRoute("/_authenticated/linha-do-tempo")({
  component: LinhaDoTempo,
});

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Data digitada como número + unidade ("66" + "milhões de anos atrás"). */
type Quando = { valor: string; unidade: Unidade };

/**
 * Põe os pontos de milhar enquanto digita (4000000 → 4.000.000); vírgula é a
 * casa decimal (66,5 milhões). Anos d.C. ficam sem ponto, como se escreve (1789).
 */
function comPontos(texto: string, unidade: Unidade): string {
  const [inteiro, ...resto] = texto.split(",");
  const digitos = inteiro.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  const agrupado = unidade === "dc" ? digitos : milhar(digitos);
  return resto.length ? `${agrupado},${resto.join("").replace(/\D/g, "")}` : agrupado;
}

function quandoDe(ano: number | null, unidade?: string | null): Quando {
  if (ano == null) return { valor: "", unidade: "ac" };
  const u = (unidade as Unidade | null) ?? unidadeAuto(ano);
  return { valor: comPontos(String(deAno(ano, u)).replace(".", ","), u), unidade: u };
}

function anoDe(q: Quando): number | null {
  const v = Number(q.valor.replace(/\./g, "").replace(",", "."));
  if (!q.valor.trim() || !Number.isFinite(v)) return null;
  return paraAno(v, q.unidade);
}

function CampoQuando({
  valor,
  onChange,
  placeholder,
}: {
  valor: Quando;
  onChange: (q: Quando) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex gap-2">
      <Input
        inputMode="decimal"
        value={valor.valor}
        onChange={(e) => onChange({ ...valor, valor: comPontos(e.target.value, valor.unidade) })}
        placeholder={placeholder}
        className="w-28 shrink-0"
      />
      <Select
        value={valor.unidade}
        onValueChange={(u) =>
          onChange({ valor: comPontos(valor.valor, u as Unidade), unidade: u as Unidade })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {UNIDADES.map((u) => (
            <SelectItem key={u} value={u}>
              {UNIDADE_LABEL[u]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Trilha({ caminho, className }: { caminho: Periodo[]; className?: string }) {
  if (caminho.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {caminho.map((p, i) => (
        <Fragment key={p.id}>
          {i > 0 && <span className="text-[10px] text-muted-foreground">›</span>}
          <span
            className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", corInfo(p.cor).chip)}
          >
            {p.nome}
          </span>
        </Fragment>
      ))}
    </div>
  );
}

function DialogFato({
  evento,
  periodos,
  onFechar,
}: {
  evento: EventoLinha | null;
  periodos: Periodo[];
  onFechar: () => void;
}) {
  const salvar = useSalvarEventoLinha();
  const remover = useDeleteEventoLinha();
  const [titulo, setTitulo] = useState(evento?.titulo ?? "");
  const [descricao, setDescricao] = useState(evento?.descricao ?? "");
  const [quando, setQuando] = useState<Quando>(
    evento ? quandoDe(evento.ano, evento.unidade) : { valor: "", unidade: "ac" },
  );

  const [temFim, setTemFim] = useState(evento?.ano_fim != null);
  const [ate, setAte] = useState<Quando>(
    evento?.ano_fim != null
      ? quandoDe(evento.ano_fim, evento.unidade_fim)
      : { valor: "", unidade: evento ? quandoDe(evento.ano, evento.unidade).unidade : "ac" },
  );

  const ano = anoDe(quando);
  const anoFim = temFim ? anoDe(ate) : null;
  const caminho = ano == null ? [] : caminhoDoAno(ano, periodos);

  function confirmar() {
    if (!titulo.trim()) {
      toast.error("Dê um título ao fato");
      return;
    }
    if (ano == null) {
      toast.error("Informe quando aconteceu");
      return;
    }
    if (temFim && anoFim == null) {
      toast.error("Informe até quando durou");
      return;
    }
    if (anoFim != null && anoFim <= ano) {
      toast.error("O fim precisa vir depois do início");
      return;
    }
    salvar.mutate(
      {
        id: evento?.id,
        input: {
          titulo: titulo.trim(),
          descricao: descricao.trim() || null,
          ano,
          unidade: quando.unidade,
          ano_fim: anoFim,
          unidade_fim: anoFim == null ? null : ate.unidade,
        },
      },
      { onSuccess: onFechar, onError: (e: Error) => toast.error(e.message) },
    );
  }

  function excluir() {
    if (!evento || !window.confirm(`Excluir "${evento.titulo}"?`)) return;
    remover.mutate(evento.id, {
      onSuccess: onFechar,
      onError: (e: Error) => toast.error(e.message),
    });
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{evento ? "Editar fato" : "Novo fato"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>O que aconteceu</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Extinção dos dinossauros"
              autoFocus={!evento}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{temFim ? "De" : "Quando"}</Label>
            <CampoQuando valor={quando} onChange={setQuando} placeholder="Ex.: 66" />
            {temFim && (
              <>
                <Label className="block pt-1.5">Até</Label>
                <CampoQuando valor={ate} onChange={setAte} placeholder="Ex.: 1000" />
              </>
            )}
            <label className="flex items-center gap-2 pt-1 text-sm">
              <input
                type="checkbox"
                checked={temFim}
                onChange={(e) => setTemFim(e.target.checked)}
                className="size-4 accent-primary"
              />
              Durou um período (tem início e fim)
            </label>
            {ano != null && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
                <span>
                  {fmtAno(ano, quando.unidade)}
                  {anoFim != null && anoFim > ano && (
                    <>
                      {" → "}
                      {fmtAno(anoFim, ate.unidade)} (durou {fmtDuracao(anoFim - ano)})
                    </>
                  )}
                </span>
                {caminho.length > 0 ? (
                  <>
                    <span>· entra em</span>
                    <Trilha caminho={caminho} />
                  </>
                ) : (
                  <span>· fora das fases cadastradas</span>
                )}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Anotações (opcional)</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="O que você leu, onde leu, detalhes…"
              className="min-h-[80px]"
            />
          </div>
        </div>
        <DialogFooter className="flex-row items-center gap-2 sm:justify-between">
          {evento ? (
            <Button variant="ghost" className="text-destructive" onClick={excluir}>
              Excluir
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onFechar}>
              Cancelar
            </Button>
            <Button onClick={confirmar} disabled={salvar.isPending}>
              {salvar.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const SEM_PAI = "__nenhuma";

function FormPeriodo({
  periodo,
  periodos,
  onFechar,
}: {
  periodo: Periodo | null;
  periodos: Periodo[];
  onFechar: () => void;
}) {
  const salvar = useSalvarPeriodo();
  const [nome, setNome] = useState(periodo?.nome ?? "");
  const [paiId, setPaiId] = useState(periodo?.pai_id ?? SEM_PAI);
  const [inicio, setInicio] = useState<Quando>(quandoDe(periodo?.inicio ?? null));
  const [fim, setFim] = useState<Quando>(quandoDe(periodo?.fim ?? null));
  const [cor, setCor] = useState<CorPeriodo>((periodo?.cor as CorPeriodo) ?? "amber");

  // Não pode ficar dentro de si mesma nem de uma fase que está dentro dela.
  const bloqueados = periodo ? descendentes(periodo.id, periodos) : new Set<string>();
  const opcoesPai = arvoreDePeriodos(periodos).filter((o) => !bloqueados.has(o.periodo.id));

  function confirmar() {
    if (!nome.trim()) {
      toast.error("Dê um nome à fase");
      return;
    }
    const ini = anoDe(inicio);
    const f = anoDe(fim);
    if (ini != null && f != null && ini >= f) {
      toast.error("O início precisa vir antes do fim");
      return;
    }
    salvar.mutate(
      {
        id: periodo?.id,
        input: {
          nome: nome.trim(),
          pai_id: paiId === SEM_PAI ? null : paiId,
          inicio: ini,
          fim: f,
          cor,
        },
      },
      { onSuccess: onFechar, onError: (e: Error) => toast.error(e.message) },
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="space-y-1.5">
        <Label>Nome da fase</Label>
        <Input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Era Mesozoica"
          autoFocus={!periodo}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Dentro de</Label>
        <Select value={paiId} onValueChange={setPaiId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SEM_PAI}>Nenhuma (divisão principal)</SelectItem>
            {opcoesPai.map(({ periodo: p, nivel }) => (
              <SelectItem key={p.id} value={p.id}>
                {"  ".repeat(nivel)}
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Início (vazio = desde o início dos tempos)</Label>
        <CampoQuando valor={inicio} onChange={setInicio} placeholder="Ex.: 252" />
      </div>
      <div className="space-y-1.5">
        <Label>Fim (vazio = até hoje)</Label>
        <CampoQuando valor={fim} onChange={setFim} placeholder="Ex.: 66" />
      </div>
      <div className="space-y-1.5">
        <Label>Cor</Label>
        <div className="flex flex-wrap gap-2">
          {CORES_PERIODO.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCor(c)}
              aria-label={c}
              className={cn(
                "size-7 rounded-full ring-offset-2 ring-offset-background transition",
                COR_INFO[c].dot,
                cor === c && "ring-2 ring-foreground",
              )}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onFechar}>
          Cancelar
        </Button>
        <Button size="sm" onClick={confirmar} disabled={salvar.isPending}>
          {salvar.isPending ? "Salvando…" : "Salvar fase"}
        </Button>
      </div>
    </div>
  );
}

function DialogFases({ periodos, onFechar }: { periodos: Periodo[]; onFechar: () => void }) {
  const remover = useDeletePeriodo();
  const [editando, setEditando] = useState<Periodo | "nova" | null>(null);
  const arvore = arvoreDePeriodos(periodos);

  function excluir(p: Periodo) {
    if (
      !window.confirm(
        `Excluir a fase "${p.nome}"? Os fatos continuam na linha do tempo; fases que estavam dentro dela viram divisões principais.`,
      )
    )
      return;
    remover.mutate(p.id, { onError: (e: Error) => toast.error(e.message) });
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fases da História</DialogTitle>
        </DialogHeader>

        {editando === "nova" ? (
          <FormPeriodo periodo={null} periodos={periodos} onFechar={() => setEditando(null)} />
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setEditando("nova")}
          >
            <IconPlus className="size-3.5" /> Nova fase
          </Button>
        )}

        <div className="space-y-1">
          {arvore.map(({ periodo: p, nivel }) =>
            editando !== "nova" && editando?.id === p.id ? (
              <FormPeriodo
                key={p.id}
                periodo={p}
                periodos={periodos}
                onFechar={() => setEditando(null)}
              />
            ) : (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-md py-1.5 pr-1 hover:bg-muted/50"
                style={{ paddingLeft: `${nivel * 16 + 4}px` }}
              >
                <span className={cn("size-2.5 shrink-0 rounded-full", corInfo(p.cor).dot)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.nome}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{fmtIntervalo(p)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditando(p)}
                  aria-label="Editar fase"
                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <IconPencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => excluir(p)}
                  aria-label="Excluir fase"
                  className="rounded p-1 text-muted-foreground hover:text-destructive"
                >
                  <IconTrash className="size-4" />
                </button>
              </div>
            ),
          )}
          {arvore.length === 0 && (
            <p className="py-4 text-center text-sm italic text-muted-foreground">
              Nenhuma fase cadastrada.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LinhaDoTempo() {
  const { data: periodos = [] } = usePeriodos();
  const { data: eventos = [], isLoading } = useEventosLinha();
  const [divisao, setDivisao] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [dialogFato, setDialogFato] = useState<{ evento: EventoLinha | null } | null>(null);
  const [fasesAberto, setFasesAberto] = useState(false);

  const comCaminho = useMemo(
    () => eventos.map((e) => ({ evento: e, caminho: caminhoDoAno(e.ano, periodos) })),
    [eventos, periodos],
  );

  const divisoes = useMemo(
    () =>
      arvoreDePeriodos(periodos)
        .filter((o) => o.nivel === 0)
        .map((o) => ({
          periodo: o.periodo,
          total: comCaminho.filter((c) => c.caminho[0]?.id === o.periodo.id).length,
        })),
    [periodos, comCaminho],
  );

  const termo = normalizar(busca.trim());
  const visiveis = comCaminho.filter(
    ({ evento, caminho }) =>
      (!divisao || caminho[0]?.id === divisao) &&
      (!termo ||
        normalizar(
          [evento.titulo, evento.descricao ?? "", ...caminho.map((p) => p.nome)].join(" "),
        ).includes(termo)),
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <SectionHeader overline="Gestão Pessoal" title="Linha do Tempo" />
        <div className="mt-1 flex shrink-0 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setFasesAberto(true)}
          >
            <IconStack2 className="size-3.5" /> Fases
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setDialogFato({ evento: null })}>
            <IconPlus className="size-3.5" /> Novo fato
          </Button>
        </div>
      </div>

      <div className="-mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4 pb-1">
        <button
          type="button"
          onClick={() => setDivisao(null)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition",
            divisao == null
              ? "border-primary bg-primary/10 text-primary"
              : "border-input text-muted-foreground",
          )}
        >
          Tudo ({eventos.length})
        </button>
        {divisoes.map(({ periodo: p, total }) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setDivisao(divisao === p.id ? null : p.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
              divisao === p.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-input text-muted-foreground",
            )}
          >
            <span className={cn("size-2 rounded-full", corInfo(p.cor).dot)} />
            {p.nome} ({total})
          </button>
        ))}
      </div>

      {eventos.length > 0 && (
        <div className="relative mb-4">
          <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar fato, anotação ou fase…"
            className="pl-8"
          />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : visiveis.length === 0 ? (
        <p className="py-10 text-center text-sm italic text-muted-foreground">
          {eventos.length === 0
            ? "Sua linha do tempo está vazia. Toque em “Novo fato” e comece pelo que estiver lendo."
            : "Nada encontrado."}
        </p>
      ) : (
        <ol className="relative ml-2 border-l-2 border-border">
          {visiveis.map(({ evento, caminho }, i) => {
            const anterior = visiveis[i - 1];
            const chave = caminho.map((p) => p.id).join("/");
            const mudouFase = !anterior || anterior.caminho.map((p) => p.id).join("/") !== chave;
            const intervalo = anterior ? evento.ano - anterior.evento.ano : 0;
            const corPonto = caminho.length
              ? corInfo(caminho[caminho.length - 1].cor).dot
              : "bg-muted-foreground";
            return (
              <Fragment key={evento.id}>
                {anterior && intervalo > 0 && (
                  <li className="flex items-center gap-1 py-1 pl-5 text-[11px] text-muted-foreground/80">
                    <IconArrowDown className="size-3" /> {fmtDuracao(intervalo)} depois
                  </li>
                )}
                {mudouFase && (
                  <li className="pb-1 pl-5 pt-3">
                    {caminho.length > 0 ? (
                      <Trilha caminho={caminho} />
                    ) : (
                      <span className="text-[11px] font-medium text-muted-foreground">
                        Sem fase
                      </span>
                    )}
                  </li>
                )}
                <li className="relative pb-1 pl-5">
                  <span
                    className={cn(
                      "absolute -left-[7px] top-3.5 size-3 rounded-full ring-2 ring-background",
                      corPonto,
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setDialogFato({ evento })}
                    className="w-full rounded-lg border border-border bg-card p-3 text-left transition hover:bg-muted/40"
                  >
                    <p className="text-xs font-semibold text-primary">
                      {fmtQuando(evento)}
                      {evento.ano_fim != null && (
                        <span className="font-normal text-muted-foreground">
                          {" · durou "}
                          {fmtDuracao(evento.ano_fim - evento.ano)}
                        </span>
                      )}
                    </p>
                    <p className="text-sm font-medium text-foreground">{evento.titulo}</p>
                    {evento.descricao && (
                      <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs text-muted-foreground">
                        {evento.descricao}
                      </p>
                    )}
                  </button>
                </li>
              </Fragment>
            );
          })}
        </ol>
      )}

      {dialogFato && (
        <DialogFato
          evento={dialogFato.evento}
          periodos={periodos}
          onFechar={() => setDialogFato(null)}
        />
      )}
      {fasesAberto && <DialogFases periodos={periodos} onFechar={() => setFasesAberto(false)} />}
    </div>
  );
}
