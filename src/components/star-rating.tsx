import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

function StarMark({ fill, size }: { fill: "empty" | "half" | "full"; size: number }) {
  if (fill === "empty") {
    return <Star width={size} height={size} className="fill-none text-muted-foreground/40" />;
  }
  if (fill === "full") {
    return <Star width={size} height={size} className="fill-primary text-primary" />;
  }
  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      <Star
        width={size}
        height={size}
        className="absolute inset-0 fill-none text-muted-foreground/40"
      />
      <span className="absolute inset-0 overflow-hidden" style={{ width: size / 2 }}>
        <Star width={size} height={size} className="fill-primary text-primary" />
      </span>
    </span>
  );
}

/**
 * Avaliação em estrelas, com meia-estrela (0.5 em 0.5). Clique na metade
 * esquerda de uma estrela vale "N - 0.5"; na direita, "N". Sem `onChange`
 * vira só leitura.
 */
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
      {[1, 2, 3, 4, 5].map((n) => {
        const fill: "empty" | "half" | "full" =
          value >= n ? "full" : value >= n - 0.5 ? "half" : "empty";
        return (
          <span key={n} className="relative inline-block" style={{ width: size, height: size }}>
            <StarMark fill={fill} size={size} />
            {onChange && (
              <>
                <button
                  type="button"
                  onClick={() => onChange(n - 0.5)}
                  aria-label={`${n - 0.5} estrelas`}
                  className="absolute inset-y-0 left-0 w-1/2 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => onChange(n)}
                  aria-label={`${n} estrelas`}
                  className="absolute inset-y-0 right-0 w-1/2 cursor-pointer"
                />
              </>
            )}
          </span>
        );
      })}
    </div>
  );
}
