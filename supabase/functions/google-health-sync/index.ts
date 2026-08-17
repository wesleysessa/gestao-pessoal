// Edge Function: renova o token se preciso e puxa passos, frequência
// cardíaca de repouso e sono dos últimos dias da Google Health API,
// gravando em google_health_dados. Chamada pelo botão "Sincronizar agora"
// em Saúde (e, best-effort, uma vez logo após conectar).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_HEALTH_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_HEALTH_CLIENT_SECRET")!;
const DIAS_PARA_TRAS = 5; // reprocessa os últimos dias pra pegar dado atrasado

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

function dataISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type PontoData = { year: number; month: number; day: number };

function isoDePontoData(p: PontoData): string {
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
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

    const { data: tokenRow, error: tokenError } = await admin
      .from("google_health_tokens")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (tokenError) throw tokenError;
    if (!tokenRow) throw new Error("Google Health não conectado.");

    let accessToken = tokenRow.access_token;

    // Renova se está a menos de 5 minutos de expirar.
    if (new Date(tokenRow.expira_em).getTime() - Date.now() < 5 * 60 * 1000) {
      const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token: tokenRow.refresh_token,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          grant_type: "refresh_token",
        }),
      });
      const refreshJson = await refreshRes.json();
      if (!refreshRes.ok || !refreshJson.access_token) {
        // Token de renovação morreu (ex.: 7 dias em modo teste) — marca
        // desconectado pra UI oferecer "Reconectar" em vez de tentar de novo.
        await admin.from("google_health_status").upsert({
          user_id: userId,
          conectado: false,
          updated_at: new Date().toISOString(),
        });
        throw new Error("A conexão com o Google Health expirou. Reconecte em Saúde.");
      }
      accessToken = refreshJson.access_token;
      const novaExpiracao = new Date(
        Date.now() + (refreshJson.expires_in ?? 3600) * 1000,
      ).toISOString();
      await admin
        .from("google_health_tokens")
        .update({
          access_token: accessToken,
          refresh_token: refreshJson.refresh_token ?? tokenRow.refresh_token,
          expira_em: novaExpiracao,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      await admin.from("google_health_status").upsert({
        user_id: userId,
        conectado: true,
        expira_em: novaExpiracao,
        updated_at: new Date().toISOString(),
      });
    }

    const hoje = new Date();
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - DIAS_PARA_TRAS);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    async function chamarGoogleHealth(path: string, init?: RequestInit) {
      const res = await fetch(`https://health.googleapis.com/v4/${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || `Falha ao consultar ${path}`);
      return json;
    }

    // --- Passos (soma diária) ---
    const passosPorDia = new Map<string, number>();
    try {
      const rollup = await chamarGoogleHealth("users/me/dataTypes/steps/dataPoints:dailyRollUp", {
        method: "POST",
        body: JSON.stringify({
          range: {
            start: {
              year: inicio.getFullYear(),
              month: inicio.getMonth() + 1,
              day: inicio.getDate(),
            },
            end: {
              year: amanha.getFullYear(),
              month: amanha.getMonth() + 1,
              day: amanha.getDate(),
            },
          },
          windowSizeDays: 1,
        }),
      });
      for (const p of rollup.rollupDataPoints ?? []) {
        const d = p.civilStartTime as PontoData | undefined;
        if (!d) continue;
        const total = p.steps?.count_sum ?? p.steps?.countSum ?? null;
        if (total != null) passosPorDia.set(isoDePontoData(d), total);
      }
    } catch (e) {
      console.error("Erro ao buscar passos:", e);
    }

    // --- Frequência cardíaca de repouso ---
    // Sem filtro por data na query (o nome exato do campo de filtro pra
    // essa métrica diária não é 100% documentado) — filtra no código, lendo
    // a data de qualquer formato que a API devolver.
    const fcPorDia = new Map<string, number>();
    try {
      const lista = await chamarGoogleHealth(
        "users/me/dataTypes/daily-resting-heart-rate/dataPoints?pageSize=30",
      );
      for (const dp of lista.dataPoints ?? []) {
        const obj = dp.dailyRestingHeartRate ?? {};
        const bpm = obj.bpm ?? obj.value ?? obj.beatsPerMinute ?? null;
        const rawDate = obj.civilDate ?? obj.date ?? obj.day ?? null;
        let iso: string | null = null;
        if (typeof rawDate === "string") iso = rawDate.slice(0, 10);
        else if (rawDate && typeof rawDate === "object" && "year" in rawDate) {
          iso = isoDePontoData(rawDate as PontoData);
        }
        if (bpm != null && iso && iso >= dataISO(inicio) && iso <= dataISO(hoje)) {
          fcPorDia.set(iso, Math.round(bpm));
        }
      }
    } catch (e) {
      console.error("Erro ao buscar frequência cardíaca:", e);
    }

    // --- Sono ---
    const sonoPorDia = new Map<string, { minutos: number; fases: unknown }>();
    try {
      const filtro = `sleep.interval.end_time >= "${inicio.toISOString()}" AND sleep.interval.end_time <= "${amanha.toISOString()}"`;
      const lista = await chamarGoogleHealth(
        `users/me/dataTypes/sleep/dataPoints?filter=${encodeURIComponent(filtro)}&pageSize=100`,
      );
      for (const dp of lista.dataPoints ?? []) {
        const sono = dp.sleep;
        if (!sono?.interval?.startTime || !sono?.interval?.endTime) continue;
        const inicioSono = new Date(sono.interval.startTime);
        const fimSono = new Date(sono.interval.endTime);
        const minutos = Math.round((fimSono.getTime() - inicioSono.getTime()) / 60000);
        // Atribui ao dia em que a pessoa ACORDOU (convenção usual de sono).
        const iso = dataISO(fimSono);
        const atual = sonoPorDia.get(iso);
        sonoPorDia.set(iso, {
          minutos: (atual?.minutos ?? 0) + minutos,
          fases: sono.stages ?? atual?.fases ?? null,
        });
      }
    } catch (e) {
      console.error("Erro ao buscar sono:", e);
    }

    const dias = new Set<string>([
      ...passosPorDia.keys(),
      ...fcPorDia.keys(),
      ...sonoPorDia.keys(),
    ]);

    // Busca o que já existe no período pra não apagar um valor bom
    // gravado antes só porque essa rodada não trouxe nada pra aquele dia.
    const { data: existentes } = await admin
      .from("google_health_dados")
      .select("data, passos, frequencia_repouso, sono_minutos, sono_fases")
      .eq("user_id", userId)
      .gte("data", dataISO(inicio))
      .lte("data", dataISO(hoje));
    const existentesPorDia = new Map((existentes ?? []).map((r) => [r.data, r]));

    let sincronizados = 0;
    for (const dia of dias) {
      const existente = existentesPorDia.get(dia);
      const sono = sonoPorDia.get(dia);
      const { error } = await admin.from("google_health_dados").upsert(
        {
          user_id: userId,
          data: dia,
          passos: passosPorDia.has(dia) ? passosPorDia.get(dia) : (existente?.passos ?? null),
          frequencia_repouso: fcPorDia.has(dia)
            ? fcPorDia.get(dia)
            : (existente?.frequencia_repouso ?? null),
          sono_minutos: sonoPorDia.has(dia) ? sono!.minutos : (existente?.sono_minutos ?? null),
          sono_fases: sonoPorDia.has(dia) ? sono!.fases : (existente?.sono_fases ?? null),
          sincronizado_em: new Date().toISOString(),
        },
        { onConflict: "user_id,data" },
      );
      if (!error) sincronizados++;
      else console.error(`Erro ao gravar dia ${dia}:`, error);
    }

    await admin.from("google_health_status").upsert({
      user_id: userId,
      conectado: true,
      ultima_sincronizacao: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return jsonResponse({ ok: true, dias: sincronizados });
  } catch (err) {
    return jsonResponse(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      400,
    );
  }
});
