import { createFileRoute, Link } from "@tanstack/react-router";
import {
  IconLanguage,
  IconNotebook,
  IconBooks,
  IconDroplet,
  IconHeartbeat,
  IconCalendar,
} from "@tabler/icons-react";
import { Card } from "@/components/ui/card";
import { FraseDoDia } from "@/components/frase-do-dia";
import { AprendizadoDoDia } from "@/components/aprendizado-do-dia";
import type { AppIcon } from "@/components/app-icon";
import { useStreakResumo } from "@/features/streak/hooks";

export const Route = createFileRoute("/_authenticated/")({
  component: Home,
});

type Modulo = {
  rotulo: string;
  to: string;
  icon: AppIcon;
  bg: string;
  border: string;
  accent: string;
};

const MODULOS: Modulo[] = [
  {
    rotulo: "Vocabulário",
    to: "/vocabulario",
    icon: IconLanguage,
    bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
    border: "border-fuchsia-200 dark:border-fuchsia-900",
    accent: "text-fuchsia-600 dark:text-fuchsia-400",
  },
  {
    rotulo: "Diário",
    to: "/diario",
    icon: IconNotebook,
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-900",
    accent: "text-amber-600 dark:text-amber-400",
  },
  {
    rotulo: "Livros",
    to: "/livros",
    icon: IconBooks,
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-900",
    accent: "text-rose-600 dark:text-rose-400",
  },
  {
    rotulo: "Hidratação",
    to: "/agua",
    icon: IconDroplet,
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-900",
    accent: "text-blue-600 dark:text-blue-400",
  },
  {
    rotulo: "Check-in Saúde",
    to: "/saude",
    icon: IconHeartbeat,
    bg: "bg-green-50 dark:bg-green-950/40",
    border: "border-green-200 dark:border-green-900",
    accent: "text-green-600 dark:text-green-400",
  },
  {
    rotulo: "Agenda Pessoal",
    to: "/agenda",
    icon: IconCalendar,
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    border: "border-cyan-200 dark:border-cyan-900",
    accent: "text-cyan-600 dark:text-cyan-400",
  },
];

function Home() {
  const { tarefas } = useStreakResumo();
  const feitaPorTo = new Map<string, boolean>(tarefas.map((t) => [t.to, t.feita]));

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <FraseDoDia />
      <AprendizadoDoDia />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {MODULOS.map((m) => {
          const feita = feitaPorTo.get(m.to);
          return (
            <Link key={m.to} to={m.to}>
              <Card className={`flex items-center justify-between gap-1.5 p-4 ${m.bg} ${m.border}`}>
                <div className="flex min-w-0 items-center gap-1.5">
                  <m.icon className={`size-4 shrink-0 ${m.accent}`} stroke={2} />
                  <span className="truncate text-sm font-semibold text-foreground">{m.rotulo}</span>
                </div>
                {feita !== undefined && (
                  <span
                    className={`shrink-0 text-sm ${feita ? m.accent : "text-muted-foreground/40"}`}
                  >
                    {feita ? "✓" : "○"}
                  </span>
                )}
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
