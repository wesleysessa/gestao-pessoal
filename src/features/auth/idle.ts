/**
 * Política de expiração da sessão no app (além da sessão do Supabase).
 *
 * - "Manter conectado" (keep): a sessão vale por até 7 dias contados do login,
 *   independentemente de inatividade. Depois disso, precisa logar de novo.
 * - Sem "manter conectado": a sessão expira após 24h de inatividade.
 */
const KEY = "gp_last_activity";
const KEEP_KEY = "gp_keep_connected";
const LOGIN_AT_KEY = "gp_login_at";

export const MAX_IDLE_MS = 24 * 60 * 60 * 1000; // 24h (sem "manter conectado")
export const MAX_KEEP_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias (com "manter conectado")

export function markActivity() {
  try {
    localStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function isIdleExpired(): boolean {
  try {
    const v = localStorage.getItem(KEY);
    const last = v ? Number(v) : 0;
    return last > 0 && Date.now() - last > MAX_IDLE_MS;
  } catch {
    return false;
  }
}

/** Registra a escolha no login e zera o relógio da sessão. */
export function startSession(keepConnected: boolean) {
  try {
    localStorage.setItem(KEEP_KEY, keepConnected ? "1" : "0");
    localStorage.setItem(LOGIN_AT_KEY, String(Date.now()));
    markActivity();
  } catch {
    /* ignore */
  }
}

/** Expirou conforme a política escolhida no login. */
export function isSessionExpired(): boolean {
  try {
    if (localStorage.getItem(KEEP_KEY) === "1") {
      const at = Number(localStorage.getItem(LOGIN_AT_KEY) || 0);
      return at > 0 && Date.now() - at > MAX_KEEP_MS;
    }
    return isIdleExpired();
  } catch {
    return false;
  }
}

/** Limpa toda a política de sessão (ex.: no logout). */
export function clearActivity() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(KEEP_KEY);
    localStorage.removeItem(LOGIN_AT_KEY);
  } catch {
    /* ignore */
  }
}
