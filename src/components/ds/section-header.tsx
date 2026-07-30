import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * SectionHeader — bloco overline + título que abre cada tela
 * ("COMERCIAL" / "Clientes"), com slot opcional à direita (badge, filtro).
 */
export function SectionHeader({
  overline,
  title,
  action,
  className,
}: {
  overline?: ReactNode;
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-4 flex items-end justify-between gap-3", className)}>
      <div>
        {overline && (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {overline}
          </p>
        )}
        <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      </div>
      {action}
    </header>
  );
}
