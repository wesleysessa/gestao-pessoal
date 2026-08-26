// Edge Function: recebe o aviso do Home & Tech quando um compromisso
// vinculado a um evento nosso é marcado como realizado/cancelado por lá, e
// espelha isso na conclusão do evento aqui. Chamada por um gatilho no banco
// da Matriz (sem JWT de usuário — autentica só pelo segredo compartilhado).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const HOOK_SECRET = Deno.env.get("GP_SYNC_HOOK_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-hook-secret",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const segredo = req.headers.get("x-hook-secret");
    if (!segredo || segredo !== HOOK_SECRET) {
      return jsonResponse({ ok: false, error: "Segredo inválido." }, 401);
    }

    const { evento_id, data, concluido, cancelado } = await req.json();
    if (!evento_id || !data) throw new Error("Payload incompleto.");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: evento } = await admin
      .from("agenda_eventos")
      .select("user_id")
      .eq("id", evento_id)
      .maybeSingle();
    // Evento pode já não existir mais aqui (apagado) — nada a fazer.
    if (!evento) return jsonResponse({ ok: true, ignorado: "evento não encontrado" });

    if (cancelado) {
      // Cancelado no Home & Tech não desfaz nada aqui automaticamente — só
      // ignora (o dono decide se quer reagendar/excluir do lado pessoal).
      return jsonResponse({ ok: true });
    }

    if (concluido) {
      const { error } = await admin
        .from("agenda_conclusoes")
        .upsert(
          { user_id: evento.user_id, evento_id, data },
          { onConflict: "evento_id,data", ignoreDuplicates: true },
        );
      if (error) throw error;
    } else {
      const { error } = await admin
        .from("agenda_conclusoes")
        .delete()
        .eq("evento_id", evento_id)
        .eq("data", data);
      if (error) throw error;
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      400,
    );
  }
});
