import {
  IconRepeat,
  IconSettings,
  IconLanguage,
  IconNotebook,
  IconBooks,
  IconHeartbeat,
  IconBulb,
  IconCalendar,
  IconDroplet,
  IconFlag,
} from "@tabler/icons-react";
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
export const MENU_MODULOS: ModuloMenu[] = [
  { label: "Rotinas", to: "/rotinas", icon: IconRepeat },
  { label: "Agenda", to: "/agenda", icon: IconCalendar },
  { label: "Lista de Prioridades", to: "/prioridades", icon: IconFlag },
  { label: "Vocabulário", to: "/vocabulario", icon: IconLanguage },
  { label: "Diário", to: "/diario", icon: IconNotebook },
  { label: "Livros", to: "/livros", icon: IconBooks },
  { label: "Hidratação", to: "/agua", icon: IconDroplet },
  { label: "Saúde", to: "/saude", icon: IconHeartbeat },
  { label: "Melhorias", to: "/melhorias", icon: IconBulb },
  { label: "Cadastros", to: "/cadastros", icon: IconSettings },
];
