import type { EventoLinha, Periodo, Unidade } from "./types";

/**
 * Datas são guardadas como "ano astronômico": negativo = antes de Cristo.
 * "Anos atrás" é contado a partir do ano atual (66 milhões de anos atrás =
 * ano atual − 66.000.000).
 */
const anoAtual = () => new Date().getFullYear();

export function paraAno(valor: number, unidade: Unidade): number {
  switch (unidade) {
    case "milhoes":
      return Math.round(anoAtual() - valor * 1_000_000);
    case "mil":
      return Math.round(anoAtual() - valor * 1_000);
    case "ac":
      return -Math.round(Math.abs(valor));
    case "dc":
      return Math.round(valor);
  }
}

/** Unidade mais natural pra exibir um ano, quando não se sabe como foi digitado. */
export function unidadeAuto(ano: number): Unidade {
  const atras = anoAtual() - ano;
  if (atras >= 1_000_000) return "milhoes";
  if (atras >= 100_000) return "mil";
  return ano < 0 ? "ac" : "dc";
}

/** Valor do ano na unidade escolhida (inverso de paraAno). */
export function deAno(ano: number, unidade: Unidade): number {
  switch (unidade) {
    case "milhoes":
      return arred((anoAtual() - ano) / 1_000_000);
    case "mil":
      return arred((anoAtual() - ano) / 1_000);
    case "ac":
      return Math.abs(ano);
    case "dc":
      return ano;
  }
}

function arred(n: number) {
  return Math.round(n * 1000) / 1000;
}

const num = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

/** Ponto de milhar em um número inteiro escrito só com dígitos: 4000000 → 4.000.000. */
export const milhar = (n: number | string) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export function fmtAno(ano: number, unidade?: string | null): string {
  const u = (unidade as Unidade | null) ?? unidadeAuto(ano);
  const v = deAno(ano, u);
  switch (u) {
    case "milhoes":
      return `${num(v)} ${v === 1 ? "milhão" : "milhões"} de anos atrás`;
    case "mil":
      return `${num(v)} mil anos atrás`;
    case "ac":
      return `${milhar(v)} a.C.`;
    case "dc":
      return v < 1000 ? `${v} d.C.` : v >= 10_000 ? milhar(v) : String(v);
  }
}

/** "65 milhões de anos", "300 mil anos", "12 anos". */
export function fmtDuracao(anos: number): string {
  if (anos >= 1_000_000) {
    const v = Math.round((anos / 1_000_000) * 10) / 10;
    return `${num(v)} ${v === 1 ? "milhão" : "milhões"} de anos`;
  }
  if (anos >= 10_000) return `${num(Math.round(anos / 1_000))} mil anos`;
  return `${num(anos)} ${anos === 1 ? "ano" : "anos"}`;
}

/** Data de um fato: pontual ("1789") ou com duração ("10000 a.C. → 1000 a.C."). */
export function fmtQuando(e: EventoLinha): string {
  const ini = fmtAno(e.ano, e.unidade);
  return e.ano_fim == null ? ini : `${ini} → ${fmtAno(e.ano_fim, e.unidade_fim)}`;
}

export function contem(p: Periodo, ano: number) {
  return (p.inicio == null || p.inicio <= ano) && (p.fim == null || ano < p.fim);
}

export function fmtIntervalo(p: Periodo): string {
  const ini = p.inicio == null ? "início dos tempos" : fmtAno(p.inicio);
  const fim = p.fim == null ? "hoje" : fmtAno(p.fim);
  return `${ini} → ${fim}`;
}

/** Fases da raiz até a fase em si (segue pai_id; protege contra ciclo). */
export function caminhoDe(periodo: Periodo, porId: Record<string, Periodo>): Periodo[] {
  const caminho: Periodo[] = [];
  let atual: Periodo | undefined = periodo;
  while (atual && !caminho.includes(atual)) {
    caminho.unshift(atual);
    atual = atual.pai_id ? porId[atual.pai_id] : undefined;
  }
  return caminho;
}

/**
 * Fase de um ano: entre as que contêm a data, a mais profunda (mais
 * subdividida); empate → a de intervalo mais curto. Devolve o caminho
 * completo (ex.: Pré-História › Era Mesozoica › Jurássico).
 */
export function caminhoDoAno(ano: number, periodos: Periodo[]): Periodo[] {
  const porId = Object.fromEntries(periodos.map((p) => [p.id, p]));
  let melhor: Periodo[] = [];
  let melhorSpan = Infinity;
  for (const p of periodos) {
    if (!contem(p, ano)) continue;
    const caminho = caminhoDe(p, porId);
    const span = p.inicio == null || p.fim == null ? Infinity : p.fim - p.inicio;
    if (caminho.length > melhor.length || (caminho.length === melhor.length && span < melhorSpan)) {
      melhor = caminho;
      melhorSpan = span;
    }
  }
  return melhor;
}

/** Fases ordenadas como árvore (pai seguido dos filhos, cada nível por início). */
export function arvoreDePeriodos(periodos: Periodo[]): { periodo: Periodo; nivel: number }[] {
  const porId = Object.fromEntries(periodos.map((p) => [p.id, p]));
  const ordenar = (lista: Periodo[]) =>
    [...lista].sort((a, b) => (a.inicio ?? -Infinity) - (b.inicio ?? -Infinity));
  const raizes = periodos.filter((p) => !p.pai_id || !porId[p.pai_id]);
  const saida: { periodo: Periodo; nivel: number }[] = [];
  const visitar = (p: Periodo, nivel: number) => {
    if (saida.some((s) => s.periodo.id === p.id)) return;
    saida.push({ periodo: p, nivel });
    ordenar(periodos.filter((f) => f.pai_id === p.id)).forEach((f) => visitar(f, nivel + 1));
  };
  ordenar(raizes).forEach((r) => visitar(r, 0));
  return saida;
}

/** Ids de uma fase e de todas as que estão dentro dela (pra não virar pai de si mesma). */
export function descendentes(id: string, periodos: Periodo[]): Set<string> {
  const ids = new Set([id]);
  let mudou = true;
  while (mudou) {
    mudou = false;
    for (const p of periodos) {
      if (p.pai_id && ids.has(p.pai_id) && !ids.has(p.id)) {
        ids.add(p.id);
        mudou = true;
      }
    }
  }
  return ids;
}

/** Fato "do dia": aleatório, mas estável até virar o dia. */
export function fatoDoDia(eventos: EventoLinha[], dataISO: string): EventoLinha | null {
  if (eventos.length === 0) return null;
  const ordenados = [...eventos].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const seed = Number(dataISO.replaceAll("-", ""));
  return ordenados[seed % ordenados.length];
}
