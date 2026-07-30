import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Avaliação em estrelas (1–5). Sem `onChange` vira só leitura. */
export function StarRating({
  value,
  onChange,
  size = 20,
  className,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          className={cn(!onChange && "cursor-default")}
        >
          <Star
            width={size}
            height={size}
            className={
              n <= value ? "fill-primary text-primary" : "fill-none text-muted-foreground/40"
            }
          />
        </button>
      ))}
    </div>
  );
}
