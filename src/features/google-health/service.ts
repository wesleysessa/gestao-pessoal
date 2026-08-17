import { supabase } from "@/integrations/supabase/client";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_HEALTH_CLIENT_ID as string | undefined;
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_HEALTH_REDIRECT_URI as string | undefined;
const ESCOPOS = [
  "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
  "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
  "https://www.googleapis.com/auth/googlehealth.sleep.readonly",
];
const CHAVE_ESTADO = "google-health-oauth-state";

export async function getStatusGoogleHealth() {
  const { data, error } = await supabase.from("google_health_status").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export async function listDadosGoogleHealth(limite = 14) {
  const { data, error } = await supabase
    .from("google_health_dados")
    .select("*")
    .order("data", { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data;
}

/** Monta a URL de autorização do Google e guarda um "state" pra conferir na volta. */
export function montarUrlAutorizacaoGoogleHealth(): string {
  if (!CLIENT_ID || !REDIRECT_URI) {
    throw new Error("Google Health não está configurado (faltam variáveis de ambiente).");
  }
  const estado = crypto.randomUUID();
  sessionStorage.setItem(CHAVE_ESTADO, estado);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: ESCOPOS.join(" "),
    state: estado,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/** Confere se o "state" que voltou do Google bate com o que geramos antes de sair. */
export function conferirEstadoGoogleHealth(estadoRecebido: string | null): boolean {
  const esperado = sessionStorage.getItem(CHAVE_ESTADO);
  sessionStorage.removeItem(CHAVE_ESTADO);
  return !!estadoRecebido && !!esperado && estadoRecebido === esperado;
}

export async function trocarCodigoPorTokenGoogleHealth(code: string) {
  const { data, error } = await supabase.functions.invoke("google-health-oauth-callback", {
    body: { code },
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error ?? "Falha ao conectar com o Google Health.");
  return data;
}

export async function sincronizarGoogleHealth() {
  const { data, error } = await supabase.functions.invoke("google-health-sync");
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error ?? "Falha ao sincronizar com o Google Health.");
  return data as { ok: true; dias: number };
}
