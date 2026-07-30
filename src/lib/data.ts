/** Data de hoje no formato ISO (yyyy-mm-dd), igual ao tipo `date` do Postgres. */
export function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Formata uma data ISO (yyyy-mm-dd) como dd/mm/aaaa. */
export function fmtData(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}
