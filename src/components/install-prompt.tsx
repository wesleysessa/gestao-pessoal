import { useEffect, useState } from "react";
import { IconDownload, IconShare3, IconSquarePlus, IconX } from "@tabler/icons-react";
import { usePwaInstall } from "@/features/pwa/use-pwa-install";

const DISMISS_KEY = "gp_install_dismissed";

/**
 * Banner automático "Instalar app" (dispensável).
 * Usa a captura compartilhada (features/pwa/install). O botão fixo no menu
 * (InstallDialog) é o caminho garantido; este banner é só a descoberta.
 */
export function InstallPrompt() {
  const { canInstall, isStandalone, isIOS, isSafari, install } = usePwaInstall();
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || isStandalone) return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (canInstall) {
      setIosHint(false);
      setShow(true);
      return;
    }
    if (isIOS && isSafari) {
      const t = setTimeout(() => {
        setIosHint(true);
        setShow(true);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [canInstall, isStandalone, isIOS, isSafari]);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }
  async function handleInstall() {
    const r = await install();
    if (r !== "unavailable") {
      localStorage.setItem(DISMISS_KEY, "1");
      setShow(false);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] flex justify-center p-3">
      <div className="w-full max-w-sm rounded-card border border-border bg-card p-4 shadow-elevated">
        <div className="flex items-start gap-3">
          <img src="/app-icon.png" alt="" className="size-11 shrink-0 rounded-chip" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Instalar o Gestão Pessoal</p>
            {iosHint ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                No Safari, toque em <b className="text-foreground">Compartilhar</b>{" "}
                <IconShare3 className="inline size-3.5 align-text-bottom" /> e depois em{" "}
                <b className="text-foreground">Adicionar à Tela de Início</b>{" "}
                <IconSquarePlus className="inline size-3.5 align-text-bottom" />.
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Acesse em um toque, direto da tela inicial do seu celular.
              </p>
            )}
            {!iosHint && (
              <button
                type="button"
                onClick={handleInstall}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-field bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition active:opacity-90"
              >
                <IconDownload className="size-4" /> Instalar app
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dispensar"
            className="text-muted-foreground transition active:opacity-70"
          >
            <IconX className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
