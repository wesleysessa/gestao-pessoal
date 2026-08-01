import { useId } from "react";
import { cn } from "@/lib/utils";

const CUP_PATH = "M6 3H18L16.2 20.5C16.1 21.5 15.3 22 14.3 22H9.7C8.7 22 7.9 21.5 7.8 20.5L6 3Z";

/** Copo d'água cujo nível de preenchimento acompanha o % da meta diária (snapado em quartos). */
export function WaterCupIcon({
  percent,
  size = 16,
  className,
}: {
  percent: number;
  size?: number;
  className?: string;
}) {
  const id = useId();
  const nivel = Math.max(0, Math.min(100, Math.round(percent / 25) * 25));
  const topo = 3;
  const base = 22;
  const yPreenchido = base - (nivel / 100) * (base - topo);

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <path d={CUP_PATH} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect x="0" y="0" width="24" height="24" className="fill-sky-100 dark:fill-sky-950/50" />
        {nivel > 0 && (
          <rect
            x="0"
            y={yPreenchido}
            width="24"
            height={base - yPreenchido}
            className="fill-sky-500"
          />
        )}
      </g>
      <path
        d={CUP_PATH}
        fill="none"
        strokeWidth="1.5"
        className={cn("stroke-muted-foreground/50")}
      />
    </svg>
  );
}
