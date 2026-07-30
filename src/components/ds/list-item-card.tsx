import type { CSSProperties, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { IconChip } from "./icon-chip";

/**
 * ListItemCard — a linha-registro de trabalho: chip de ícone à esquerda,
 * título + badge de status opcional, linha secundária e um wrap de meta-itens.
 * Usado em clientes, veículos, pendências, etc. `children` é a linha de meta.
 */
export function ListItemCard({
  icon,
  title,
  badge,
  subtitle,
  action,
  className,
  style,
  children,
}: {
  icon?: ReactNode;
  title: ReactNode;
  badge?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <Card className={cn("p-3.5", className)} style={style}>
      <div className="flex items-start gap-3">
        {icon != null && (
          <IconChip size={40} radius="var(--radius-md)" tone="soft">
            {icon}
          </IconChip>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{title}</span>
            {badge}
          </div>
          {subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>}
          {children && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              {children}
            </div>
          )}
        </div>
        {action}
      </div>
    </Card>
  );
}
