import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { clearActivity, isSessionExpired, markActivity } from "./idle";

/**
 * Desloga automaticamente após inatividade (ver MAX_IDLE_MS em ./idle).
 * - marca atividade em cliques/teclas (com throttle);
 * - revalida ao voltar para o app (visibilitychange) e a cada 5 min;
 * - se expirou, faz signOut e manda para a tela de login.
 */
export function useIdleLogout() {
  const navigate = useNavigate();

  useEffect(() => {
    let disposed = false;

    async function check(): Promise<boolean> {
      if (!isSessionExpired()) return false;
      const { data } = await supabase.auth.getSession();
      if (data.session) await supabase.auth.signOut();
      clearActivity();
      if (!disposed) navigate({ to: "/auth", replace: true });
      return true;
    }

    let lastTouch = 0;
    const touch = () => {
      const t = Date.now();
      if (t - lastTouch > 30_000) {
        lastTouch = t;
        markActivity();
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
      else touch();
    };

    // Ao abrir o app: checa expiração ANTES de renovar (pega sessão vencida);
    // se não venceu, renova a janela de inatividade.
    void (async () => {
      const expired = await check();
      if (!expired) markActivity();
    })();
    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown"];
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(check, 5 * 60 * 1000);

    return () => {
      disposed = true;
      events.forEach((e) => window.removeEventListener(e, touch));
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, [navigate]);
}
