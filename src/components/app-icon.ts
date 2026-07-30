import type { ComponentType } from "react";

/** Ícone de UI (Tabler Icons). Aceita className, size e stroke. */
export type AppIcon = ComponentType<{
  className?: string;
  size?: number | string;
  stroke?: number;
}>;
