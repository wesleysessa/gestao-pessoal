import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { clearActivity, isSessionExpired, markActivity } from "@/features/auth/idle";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // getSession() lê a sessão persistida (localStorage) sem exigir rede;
    // evita logout falso ao abrir o app "frio" no celular. RLS protege o backend.
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
    // logout automático: 7 dias corridos com "manter conectado", senão 24h de inatividade
    if (isSessionExpired()) {
      await supabase.auth.signOut();
      clearActivity();
      throw redirect({ to: "/auth" });
    }
    markActivity();
    return { user: data.session.user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
