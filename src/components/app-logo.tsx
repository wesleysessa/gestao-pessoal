import { useRef } from "react";
import { IconCamera } from "@tabler/icons-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAppLogo, useTrocarAppLogo } from "@/features/app-logo/hooks";

/**
 * Logo do app — busca a imagem trocada pelo usuário (bucket app-logo) e cai
 * pro ícone padrão (/app-icon.png) enquanto não tiver nenhuma. Com
 * `editable`, clicar abre o seletor de arquivo pra trocar na hora.
 */
export function AppLogo({
  size = 36,
  className,
  editable = false,
}: {
  size?: number;
  className?: string;
  editable?: boolean;
}) {
  const { data: url } = useAppLogo();
  const trocar = useTrocarAppLogo();
  const inputRef = useRef<HTMLInputElement>(null);

  const img = (
    <img
      src={url || "/app-icon.png"}
      alt=""
      style={{ width: size, height: size }}
      className={cn("shrink-0 rounded-chip object-cover", className)}
    />
  );

  if (!editable) return img;

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="group relative shrink-0 rounded-chip"
      style={{ width: size, height: size }}
      title="Trocar logo"
    >
      {img}
      <span className="absolute inset-0 flex items-center justify-center rounded-chip bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
        <IconCamera className="size-4" />
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          trocar.mutate(file, { onError: (err: Error) => toast.error(err.message) });
        }}
      />
    </button>
  );
}
