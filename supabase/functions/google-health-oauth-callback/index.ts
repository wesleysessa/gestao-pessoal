// Edge Function: troca o "code" do OAuth do Google Health por um access
// token + refresh token, e guarda em google_health_tokens/google_health_status.
// Chamada pela rota /fitbit-callback logo após o Google redirecionar de volta.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_HEALTH_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_HEALTH_CLIENT_SECRET")!;
// Precisa bater exatamente com o URI cadastrado no Google Cloud Console.
const REDIRECT_URI = "https://gestao-pessoal.wsgoncalves0675.workers.dev/fitbit-callback";

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

    const { code } = await req.json();
    if (!code) throw new Error("Código de autorização ausente.");

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      throw new Error(
        tokenJson.error_description || tokenJson.error || "Falha ao trocar código por token.",
      );
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // O Google só reenvia refresh_token quando força re-consentimento
    // (prompt=consent) — na prática sempre deve vir, mas por segurança
    // preservamos o anterior se por algum motivo não vier dessa vez.
    let refreshToken: string | undefined = tokenJson.refresh_token;
    if (!refreshToken) {
      const { data: existente } = await admin
        .from("google_health_tokens")
        .select("refresh_token")
        .eq("user_id", userId)
        .maybeSingle();
      refreshToken = existente?.refresh_token;
    }
    if (!refreshToken) {
      throw new Error(
        "O Google não retornou um token de renovação. Remova o acesso em myaccount.google.com/permissions e conecte de novo.",
      );
    }

    const expiraEm = new Date(Date.now() + (tokenJson.expires_in ?? 3600) * 1000).toISOString();
    const agora = new Date().toISOString();

    const { error: tokenUpsertError } = await admin.from("google_health_tokens").upsert({
      user_id: userId,
      access_token: tokenJson.access_token,
      refresh_token: refreshToken,
      expira_em: expiraEm,
      escopo: tokenJson.scope ?? null,
      updated_at: agora,
    });
    if (tokenUpsertError) throw tokenUpsertError;

    const { error: statusUpsertError } = await admin.from("google_health_status").upsert({
      user_id: userId,
      conectado: true,
      expira_em: expiraEm,
      updated_at: agora,
    });
    if (statusUpsertError) throw statusUpsertError;

    // Dispara uma primeira sincronização em segundo plano — melhor esforço,
    // não bloqueia a resposta se falhar (o usuário sempre pode sincronizar
    // manualmente depois em Saúde).
    fetch(`${supabaseUrl}/functions/v1/google-health-sync`, {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
    }).catch((e) => console.error("Falha na sincronização inicial:", e));

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      400,
    );
  }
});
