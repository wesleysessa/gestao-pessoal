import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/** "HH:MM:SS" do Postgres → "HH:MM". */
export function hhmm(v: string | null): string {
  return v ? v.slice(0, 5) : "";
}

/**
 * Replica (best-effort) um evento profissional pro Home & Tech — nunca
 * bloqueia a ação principal do usuário, só avisa se falhar.
 */
export function sincronizarComHT(body: {
  acao: "upsert" | "excluir" | "concluir" | "desconcluir";
  eventoId?: string;
  compromissoHtId?: string | null;
}) {
  if (!body.eventoId && !body.compromissoHtId) return;
  supabase.functions.invoke("sync-compromisso-ht", { body }).then(({ error }) => {
    if (error) toast.error(`Falha ao sincronizar com o Home & Tech: ${error.message}`);
  });
}
