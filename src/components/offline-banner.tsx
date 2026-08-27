import { useEffect, useState } from "react";
import { IconWifiOff } from "@tabler/icons-react";

/**
 * Faixa fixa no topo quando o navegador perde a conexão — avisa que os
 * dados na tela são os últimos carregados (o cache fica em localStorage,
 * ver __root.tsx), não necessariamente atualizados agora. Criar/editar
 * continua exigindo internet — isso ainda não guarda uma fila offline.
 */
export function OfflineBanner() {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);

  useEffect(() => {
    const marcarOnline = () => setOnline(true);
    const marcarOffline = () => setOnline(false);
    window.addEventListener("online", marcarOnline);
    window.addEventListener("offline", marcarOffline);
    return () => {
      window.removeEventListener("online", marcarOnline);
      window.removeEventListener("offline", marcarOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 bg-amber-500 px-3 py-1.5 text-center text-xs font-medium text-white">
      <IconWifiOff className="size-3.5 shrink-0" />
      Você está offline — mostrando os últimos dados carregados. Criar ou editar só volta a
      funcionar com internet.
    </div>
  );
}
