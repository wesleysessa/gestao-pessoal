import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { conferirEstadoGoogleHealth } from "@/features/google-health/service";
import { useTrocarCodigoPorTokenGoogleHealth } from "@/features/google-health/hooks";

export const Route = createFileRoute("/_authenticated/fitbit-callback")({
  component: FitbitCallback,
});

/**
 * Página de retorno do OAuth do Google Health (URI de redirecionamento
 * cadastrado no Google Cloud Console). Só troca o "code" pelo token e volta
 * pra Home (onde fica o card do Google Health) — não tem UI própria além de
 * um aviso de carregando.
 */
function FitbitCallback() {
  const navigate = useNavigate();
  const trocar = useTrocarCodigoPorTokenGoogleHealth();
  const executado = useRef(false);

  useEffect(() => {
    if (executado.current) return;
    executado.current = true;

    const params = new URLSearchParams(window.location.search);
    const erro = params.get("error");
    const code = params.get("code");
    const estado = params.get("state");

    if (erro) {
      toast.error("Conexão com o Google Health cancelada.");
      navigate({ to: "/" });
      return;
    }
    if (!code || !conferirEstadoGoogleHealth(estado)) {
      toast.error("Não foi possível confirmar a resposta do Google. Tente conectar de novo.");
      navigate({ to: "/" });
      return;
    }

    trocar.mutate(code, {
      onSuccess: () => {
        toast.success("Google Health conectado!");
        navigate({ to: "/" });
      },
      onError: (e: Error) => {
        toast.error(e.message);
        navigate({ to: "/" });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4 py-16 text-center text-muted-foreground">
      <p className="text-sm">Conectando ao Google Health…</p>
    </div>
  );
}
