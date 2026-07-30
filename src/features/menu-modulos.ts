import { IconRepeat } from "@tabler/icons-react";
import type { AppIcon } from "@/components/app-icon";

export type ModuloMenu = {
  label: string;
  to: string;
  icon: AppIcon;
};

/**
 * Registro central do menu. Cada novo módulo (nova área do app) ganha uma
 * entrada aqui — é a fonte usada pelo drawer (AppShell) e pela home.
 */
export const MENU_MODULOS: ModuloMenu[] = [{ label: "Rotinas", to: "/rotinas", icon: IconRepeat }];
