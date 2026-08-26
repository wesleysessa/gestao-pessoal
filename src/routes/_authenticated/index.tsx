import { createFileRoute, Link } from "@tanstack/react-router";
import {
  IconLanguage,
  IconNotebook,
  IconBooks,
  IconDroplet,
  IconCalendar,
  IconBulb,
} from "@tabler/icons-react";
import { Card } from "@/components/ui/card";
import { FraseDoDia } from "@/components/frase-do-dia";
import { AprendizadoDoDia } from "@/components/aprendizado-do-dia";
import { GoogleHealthCard } from "@/components/google-health-card";
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
    rotulo: "Agenda Pessoal",
    to: "/agenda",
    icon: IconCalendar,
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    border: "border-cyan-200 dark:border-cyan-900",
    accent: "text-cyan-600 dark:text-cyan-400",
  },
  {
    rotulo: "Melhorias",
    to: "/melhorias",
    icon: IconBulb,
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-900",
    accent: "text-orange-600 dark:text-orange-400",
  },
];

function Home() {
  const { tarefas } = useStreakResumo();
  const feitaPorTo = new Map<string, boolean>(tarefas.map((t) => [t.to, t.feita]));

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <GoogleHealthCard />

      <div className="mb-5 grid grid-cols-2 gap-3">
        {MODULOS.map((m) => {
          const feita = feitaPorTo.get(m.to);
          return (
            <Link key={m.to} to={m.to}>
              <Card
                className={`flex min-h-[110px] flex-col items-center justify-end gap-2 p-5 text-center ${m.bg} ${m.border}`}
              >
                <m.icon className={`size-7 ${m.accent}`} stroke={2} />
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-foreground">{m.rotulo}</span>
                  {feita !== undefined && (
                    <span className={`text-sm ${feita ? m.accent : "text-muted-foreground/40"}`}>
                      {feita ? "✓" : "○"}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <FraseDoDia />
      <AprendizadoDoDia />
    </div>
  );
}
