import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "tint" | "solid" | "soft";

const tones: Record<Tone, string> = {
  tint: "bg-secondary text-primary",
  solid: "bg-primary text-primary-foreground",
  soft: "bg-[#00204014] text-primary",
};

/**
 * IconChip — o quadrado arredondado navy-tint que segura um ícone de linha.
 * Aparece em nav-rows, module-cards, list-cards e no drawer.
 * `tone="solid"` inverte para navy (estados hero/ativo).
 */
export function IconChip({
  size = 36,
  radius = "var(--radius-chip)",
  tone = "tint",
  className,
  style,
  children,
}: {
  size?: number;
  radius?: string;
  tone?: Tone;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", tones[tone], className)}
      style={{ width: size, height: size, borderRadius: radius, ...style }}
    >
      {children}
    </span>
  );
}
