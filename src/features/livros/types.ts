import type { Database } from "@/integrations/supabase/types";

export type Livro = Database["public"]["Tables"]["livros"]["Row"];

/** O livro em si (box principal) — só título/autor. Capa é enviada à parte. */
export type NovoLivro = Pick<Database["public"]["Tables"]["livros"]["Insert"], "titulo" | "autor">;

export type EntradaLivro = Database["public"]["Tables"]["livros_entradas"]["Row"];

/** Uma leitura registrada num dia — anotações, nota da sessão e páginas lidas. */
export type NovaEntradaLivro = Pick<
  Database["public"]["Tables"]["livros_entradas"]["Insert"],
  "anotacoes" | "nota" | "paginas"
>;
