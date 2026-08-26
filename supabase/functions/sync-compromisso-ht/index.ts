// Edge Function: replica um evento "profissional" da Agenda como compromisso
// na Agenda Comercial do Home & Tech (projeto Supabase separado — Matriz).
// Chamada pelo cliente depois de criar/editar/excluir um evento, ou marcar/
// desmarcar conclusão. "acao":
//   "upsert"       — releitura do evento (eventoId) e cria/atualiza/cancela lá
//   "excluir"      — evento pessoal foi apagado; cancela lá (compromissoHtId)
//   "concluir"     — marca "realizado sem D.O." lá (compromissoHtId)
//   "desconcluir"  — desfaz o "realizado" lá (compromissoHtId)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const HT_URL = Deno.env.get("HT_SUPABASE_URL")!;
const HT_SERVICE_KEY = Deno.env.get("HT_SUPABASE_SERVICE_ROLE_KEY")!;
const RESPONSAVEL = "Wesley Sessa";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function htHeaders(extra?: Record<string, string>) {
  return {
    apikey: HT_SERVICE_KEY,
    Authorization: `Bearer ${HT_SERVICE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function cancelarCompromisso(compromissoId: string, motivo: string) {
  await fetch(`${HT_URL}/rest/v1/agenda_compromissos?id=eq.${compromissoId}`, {
    method: "PATCH",
    headers: htHeaders({ Prefer: "return=minimal" }),
    body: JSON.stringify({ cancelado_at: new Date().toISOString(), cancelado_motivo: motivo }),
  });
}

async function marcarRealizado(compromissoId: string, realizado: boolean) {
  await fetch(`${HT_URL}/rest/v1/agenda_compromissos?id=eq.${compromissoId}`, {
    method: "PATCH",
    headers: htHeaders({ Prefer: "return=minimal" }),
    body: JSON.stringify(
      realizado
        ? { realizado_at: new Date().toISOString(), realizado_obs: "Concluído via Gestão Pessoal" }
        : { realizado_at: null, realizado_obs: null },
    ),
  });
}

function montarObservacoes(evento: {
  titulo: string;
  local: string | null;
  descricao: string | null;
}): string {
  return [evento.titulo, evento.local, evento.descricao].filter(Boolean).join(" — ");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autenticado.");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) throw new Error("Usuário inválido.");
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey);

    const { acao, eventoId, compromissoHtId } = await req.json();

    if (acao === "excluir") {
      if (compromissoHtId) await cancelarCompromisso(compromissoHtId, "Excluído no Gestão Pessoal");
      return jsonResponse({ ok: true });
    }

    if (acao === "concluir" || acao === "desconcluir") {
      if (compromissoHtId) await marcarRealizado(compromissoHtId, acao === "concluir");
      return jsonResponse({ ok: true });
    }

    if (acao !== "upsert") throw new Error(`Ação desconhecida: ${acao}`);

    const { data: evento, error: eventoError } = await admin
      .from("agenda_eventos")
      .select("*")
      .eq("id", eventoId)
      .eq("user_id", userId)
      .maybeSingle();
    if (eventoError) throw eventoError;
    if (!evento) throw new Error("Evento não encontrado.");

    // Não é (mais) profissional — cancela o vínculo se existia (ex.: alterado de volta pra Pessoal).
    if (evento.escopo !== "profissional") {
      if (evento.compromisso_ht_id) {
        await cancelarCompromisso(
          evento.compromisso_ht_id,
          "Alterado para Pessoal no Gestão Pessoal",
        );
        await admin.from("agenda_eventos").update({ compromisso_ht_id: null }).eq("id", evento.id);
      }
      return jsonResponse({ ok: true });
    }

    const payload = {
      data: evento.data,
      categoria: "comercial",
      categoria_nome: "Gestão Pessoal",
      tipo: null,
      tipo_nome: null,
      ft_projeto_id: null,
      responsavel: RESPONSAVEL,
      observacoes: montarObservacoes(evento),
      origem_gestao_pessoal_evento_id: evento.id,
    };

    if (evento.compromisso_ht_id) {
      await fetch(`${HT_URL}/rest/v1/agenda_compromissos?id=eq.${evento.compromisso_ht_id}`, {
        method: "PATCH",
        headers: htHeaders({ Prefer: "return=minimal" }),
        body: JSON.stringify(payload),
      });
    } else {
      const res = await fetch(`${HT_URL}/rest/v1/agenda_compromissos`, {
        method: "POST",
        headers: htHeaders({ Prefer: "return=representation" }),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Falha ao criar no Home & Tech: ${await res.text()}`);
      const [criado] = await res.json();
      await admin
        .from("agenda_eventos")
        .update({ compromisso_ht_id: criado.id })
        .eq("id", evento.id);
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      400,
    );
  }
});
