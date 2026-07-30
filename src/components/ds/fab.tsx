import type { ReactNode } from "react";
import { IconPlus } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/**
 * FAB — ação primária fixa no canto inferior direito ("novo cliente").
 * Navy, squircle 16px, sombra navy pronunciada. `fixed` ancora acima da bottom nav.
 */
export function FAB({
  icon,
  label = "Novo",
  fixed = true,
  onClick,
  className,
}: {
  icon?: ReactNode;
  label?: string;
  fixed?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "z-20 inline-flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-fab transition active:opacity-90",
        fixed && "fixed bottom-20 right-5",
        className,
      )}
    >
      {icon ?? <IconPlus className="size-6" stroke={2} />}
    </button>
  );
}
