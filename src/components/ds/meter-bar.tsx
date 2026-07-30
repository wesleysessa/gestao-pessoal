import { cn } from "@/lib/utils";

/**
 * MeterBar — trilho fino + barra preenchida usado nos dashboards Comercial
 * (etapas do funil, por colaborador, por segmento). Cor via `color`.
 */
export function MeterBar({
  value = 0,
  color = "var(--color-primary)",
  height = 8,
  track = "var(--color-surface-2)",
  className,
}: {
  value?: number;
  color?: string;
  height?: number;
  track?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full", className)}
      style={{ height, background: track }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}
