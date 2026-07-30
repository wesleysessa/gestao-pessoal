import type { Database } from "@/integrations/supabase/types";

export type Livro = Database["public"]["Tables"]["livros"]["Row"];

export type NovoLivro = Pick<
  Database["public"]["Tables"]["livros"]["Insert"],
  "titulo" | "autor" | "nota" | "comentario"
>;
