/** Converte um instante (Date ou timestamp ISO) pro dia LOCAL, no formato yyyy-mm-dd. */
export function dataLocalDe(valor: Date | string): string {
  const d = typeof valor === "string" ? new Date(valor) : valor;
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/**
 * Data de hoje no fuso LOCAL, no formato ISO (yyyy-mm-dd), igual ao tipo
 * `date` do Postgres. Importante: usa o calendário local, não UTC — em
 * fusos atrás de UTC (ex.: Brasil), `new Date().toISOString()` já vira o
 * dia seguinte algumas horas antes da meia-noite local.
 */
export function hoje(): string {
  return dataLocalDe(new Date());
}

/** Formata uma data ISO (yyyy-mm-dd) como dd/mm/aaaa. */
export function fmtData(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

/** Soma (ou subtrai) dias a uma data ISO (yyyy-mm-dd), no calendário local. */
export function addDias(iso: string, n: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  return dataLocalDe(new Date(a, m - 1, d + n));
}

/** Segunda-feira (início da semana) da semana que contém a data informada. */
export function segundaDaSemana(dataISO: string): string {
  const [a, m, d] = dataISO.split("-").map(Number);
  const dt = new Date(a, m - 1, d);
  const diaSemana = dt.getDay(); // 0 = domingo
  const offset = diaSemana === 0 ? 6 : diaSemana - 1;
  dt.setDate(dt.getDate() - offset);
  return dataLocalDe(dt);
}
