import {
  IconDeviceMobilePlus,
  IconDownload,
  IconShare3,
  IconSquarePlus,
  IconDotsVertical,
} from "@tabler/icons-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePwaInstall } from "./use-pwa-install";

/** Instalar o app: botão nativo (Android) ou instruções (iPhone / navegador). */
export function InstallDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { canInstall, isIOS, install } = usePwaInstall();

  async function handleInstall() {
    const r = await install();
    if (r === "accepted") {
      toast.success("App instalado!");
      onOpenChange(false);
    } else if (r === "unavailable") {
      toast("Use o menu do navegador para instalar.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Instalar o app</DialogTitle>
        </DialogHeader>
        <div className="flex items-start gap-3">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-chip"
            style={{ background: "linear-gradient(150deg, #013060, #002040)" }}
          >
            <IconDeviceMobilePlus className="size-6 text-primary-foreground" stroke={1.6} />
          </span>
          <p className="text-sm text-muted-foreground">
            Deixe o Gestão Pessoal na tela inicial do celular, com acesso em um toque.
          </p>
        </div>

        {canInstall ? (
          <Button className="w-full gap-1.5" onClick={handleInstall}>
            <IconDownload className="size-4" /> Instalar app
          </Button>
        ) : isIOS ? (
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>
              <b>1.</b> No <b>Safari</b>, toque em <b>Compartilhar</b>{" "}
              <IconShare3 className="inline size-4 align-text-bottom" />.
            </li>
            <li>
              <b>2.</b> Escolha <b>Adicionar à Tela de Início</b>{" "}
              <IconSquarePlus className="inline size-4 align-text-bottom" />.
            </li>
            <li>
              <b>3.</b> Confirme em <b>Adicionar</b>.
            </li>
          </ol>
        ) : (
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>
              <b>1.</b> Toque no menu{" "}
              <IconDotsVertical className="inline size-4 align-text-bottom" /> do navegador
              (Chrome).
            </li>
            <li>
              <b>2.</b> Toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.
            </li>
            <li>
              <b>3.</b> Confirme.
            </li>
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
