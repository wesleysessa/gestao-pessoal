import { Link } from "@tanstack/react-router";
import type { AppIcon } from "@/components/app-icon";

export interface ModuleItem {
  label: string;
  to: string;
  icon: AppIcon;
}

/** Grade simples de cards de navegação (2 colunas). */
export function ModuleGrid({ items }: { items: ModuleItem[] }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <div className="grid grid-cols-2 items-start gap-3">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-2.5 rounded-card border border-border bg-card p-3 transition active:border-muted-foreground/40"
          >
            <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-secondary dark:bg-primary/15">
              <item.icon className="size-[17px] text-primary" stroke={1.75} />
            </span>
            <span className="min-w-0 flex-1 wrap-break-word text-[13.5px] leading-tight text-foreground">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
