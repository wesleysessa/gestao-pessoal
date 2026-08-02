import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import {
  IconMenu2,
  IconLogout,
  IconKey,
  IconHome,
  IconChevronRight,
  IconArrowLeft,
  IconSun,
  IconMoon,
  IconDeviceDesktop,
  IconDeviceMobilePlus,
  IconFlame,
  IconPin,
  IconPinFilled,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useTheme, type Theme } from "@/features/theme/theme-provider";
import { useIdleLogout } from "@/features/auth/use-idle-logout";
import { ChangePasswordDialog } from "@/features/auth/change-password-dialog";
import { InstallDialog } from "@/features/pwa/install-dialog";
import { usePwaInstall } from "@/features/pwa/use-pwa-install";
import { useCurrentProfile } from "@/features/auth/use-current-profile";
import { useStreakResumo } from "@/features/streak/hooks";
import { StreakCalendarDialog } from "@/components/streak-calendar";
import { AppLogo } from "@/components/app-logo";
import { WaterCupIcon } from "@/components/water-cup-icon";
import { useHidratacaoHoje } from "@/features/agua/hooks";
import { MENU_MODULOS } from "@/features/menu-modulos";

const drawerSections = [{ label: "Início", to: "/", icon: IconHome }, ...MENU_MODULOS];

/** Quais itens do menu ficam fixados no rodapé — escolha do usuário (📌 no menu). */
const PINNED_KEY = "gp_bottom_nav";
const PINNED_PADRAO = ["/", "/diario", "/agua", "/saude", "/melhorias"];
const MAX_PINNED = 5;

function carregarFixados(): string[] {
  try {
    const salvo = localStorage.getItem(PINNED_KEY);
    if (!salvo) return PINNED_PADRAO;
    const lista = JSON.parse(salvo);
    if (!Array.isArray(lista)) return PINNED_PADRAO;
    const validos = lista.filter(
      (to): to is string => typeof to === "string" && drawerSections.some((s) => s.to === to),
    );
    return validos.length > 0 ? validos : PINNED_PADRAO;
  } catch {
    return PINNED_PADRAO;
  }
}

const barIcon = "text-[#44515E] dark:text-muted-foreground hover:bg-muted";

function sectionTitle(pathname: string): string {
  if (pathname === "/") return "Menu";
  const seg = pathname.split("/").filter(Boolean)[0] ?? "";
  const modulo = MENU_MODULOS.find((m) => m.to === "/" + seg);
  return modulo?.label ?? "Menu";
}

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useCurrentProfile();
  const { theme, setTheme } = useTheme();
  useIdleLogout(); // desloga após 24h de inatividade (ou 7 dias com "manter conectado")
  const [pwdOpen, setPwdOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [fixados, setFixados] = useState<string[]>(carregarFixados);
  const { isStandalone } = usePwaInstall();
  const { streakExibido } = useStreakResumo();
  const { progresso: hidratacaoProgresso } = useHidratacaoHoje();

  const isRoot = pathname === "/";
  const tituloSecao = sectionTitle(pathname);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("home-no-scrollbar", isRoot);
    return () => html.classList.remove("home-no-scrollbar");
  }, [isRoot]);

  useEffect(() => {
    localStorage.setItem(PINNED_KEY, JSON.stringify(fixados));
  }, [fixados]);

  function alternarFixado(to: string) {
    setFixados((atual) => {
      if (atual.includes(to)) return atual.filter((t) => t !== to);
      if (atual.length >= MAX_PINNED) {
        toast.error(`Máximo de ${MAX_PINNED} itens no rodapé`);
        return atual;
      }
      return [...atual, to];
    });
  }

  const bottomItems = drawerSections.filter((s) => fixados.includes(s.to));

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");
  // Trocar de aba substitui o histórico (não empilha) — só quando já se está
  // numa aba, pra "voltar" a partir de uma tela interna continuar normal.
  const emAlgumaAba = bottomItems.some((b) => isActive(b.to));

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function handleBack() {
    if (window.history.length > 1) router.history.back();
    else navigate({ to: "/" });
  }

  return (
    <div className={cn("flex min-h-svh flex-col", isRoot ? "bg-secondary" : "bg-background")}>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-divider dark:border-border bg-card px-2 pr-3 text-foreground shadow-sm">
        {isRoot ? (
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={barIcon}>
                <IconMenu2 className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-[280px] flex-col border-0 bg-sidebar p-0 text-sidebar-foreground"
            >
              <SheetHeader className="shrink-0 border-b border-sidebar-border p-5 text-left">
                <div className="flex items-center gap-3">
                  <AppLogo size={36} editable />
                  <div className="min-w-0">
                    <SheetTitle className="truncate text-base font-medium text-primary">
                      {profile?.name ?? "Gestão Pessoal"}
                    </SheetTitle>
                    <p className="text-xs text-muted-foreground">Gestão Pessoal</p>
                  </div>
                </div>
              </SheetHeader>
              <nav className="scrollbar-clean flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
                {drawerSections.map((s) => {
                  const fixado = fixados.includes(s.to);
                  return (
                    <div
                      key={s.to}
                      className={cn(
                        "flex items-center gap-1 rounded-md pl-3 pr-1 text-sm font-medium transition-colors",
                        isActive(s.to)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                      )}
                    >
                      <Link
                        to={s.to}
                        onClick={() => setDrawerOpen(false)}
                        className="flex flex-1 items-center gap-3 py-2.5"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-chip bg-secondary">
                          <s.icon className="size-4 text-primary" stroke={1.75} />
                        </span>
                        <span className="flex-1">{s.label}</span>
                        <IconChevronRight
                          className="size-4 text-muted-foreground/60"
                          stroke={1.75}
                        />
                      </Link>
                      <button
                        type="button"
                        onClick={() => alternarFixado(s.to)}
                        aria-label={fixado ? "Remover do rodapé" : "Fixar no rodapé"}
                        title={fixado ? "Remover do rodapé" : "Fixar no rodapé"}
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-md",
                          fixado
                            ? "text-primary"
                            : "text-muted-foreground/50 hover:text-muted-foreground",
                        )}
                      >
                        {fixado ? (
                          <IconPinFilled className="size-4" />
                        ) : (
                          <IconPin className="size-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </nav>
              <div className="shrink-0 border-t border-sidebar-border p-2">
                <div className="mb-1 flex items-center gap-1 rounded-md bg-muted p-1">
                  {(
                    [
                      { value: "light", label: "Claro", icon: IconSun },
                      { value: "dark", label: "Escuro", icon: IconMoon },
                      { value: "system", label: "Sistema", icon: IconDeviceDesktop },
                    ] as { value: Theme; label: string; icon: typeof IconSun }[]
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={cn(
                        "flex flex-1 flex-col items-center gap-0.5 rounded px-2 py-1.5 text-[11px] font-medium transition-colors",
                        theme === opt.value
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <opt.icon className="size-4" stroke={1.75} />
                      {opt.label}
                    </button>
                  ))}
                </div>
                {!isStandalone && (
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      setInstallOpen(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60"
                  >
                    <IconDeviceMobilePlus className="size-4" />
                    Instalar app
                  </button>
                )}
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    setPwdOpen(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60"
                >
                  <IconKey className="size-4" />
                  Alterar senha
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60"
                >
                  <IconLogout className="size-4" />
                  Sair
                </button>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <Button variant="ghost" size="icon" onClick={handleBack} className={barIcon}>
            <IconArrowLeft className="size-5" />
          </Button>
        )}

        {isRoot ? (
          <h1 className="flex flex-1 items-center gap-2 truncate text-[18px] font-medium text-primary">
            <AppLogo size={24} className="rounded-md" />
            Gestão Pessoal
          </h1>
        ) : (
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="flex-1 truncate text-left text-[18px] font-medium text-primary active:opacity-70"
            title="Voltar ao Menu"
          >
            {tituloSecao}
          </button>
        )}

        <div className="flex shrink-0 items-center gap-1.5">
          {hidratacaoProgresso != null && (
            <button
              type="button"
              onClick={() => navigate({ to: "/saude" })}
              aria-label="Hidratação do dia"
              title="Hidratação do dia"
              className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 py-1 transition hover:bg-muted"
            >
              <WaterCupIcon percent={hidratacaoProgresso} size={16} />
              <span className="text-sm font-semibold text-foreground">{hidratacaoProgresso}%</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setCalendarioAberto(true)}
            aria-label="Chama e calendário de ofensiva"
            className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 py-1 transition hover:bg-muted"
          >
            <IconFlame
              className={cn(
                "size-4",
                streakExibido > 0 ? "fill-orange-500 text-orange-500" : "text-muted-foreground/40",
              )}
            />
            <span className="text-sm font-semibold text-foreground">{streakExibido}</span>
          </button>
        </div>
      </header>

      <ChangePasswordDialog open={pwdOpen} onOpenChange={setPwdOpen} />
      <InstallDialog open={installOpen} onOpenChange={setInstallOpen} />
      <StreakCalendarDialog open={calendarioAberto} onOpenChange={setCalendarioAberto} />

      <main className={cn("flex-1 overflow-x-hidden", bottomItems.length > 0 ? "pb-24" : "pb-6")}>
        {children}
      </main>

      {bottomItems.length > 0 && (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-divider bg-card shadow-elevated dark:border-border">
          <ul
            className="mx-auto grid max-w-2xl"
            style={{ gridTemplateColumns: `repeat(${bottomItems.length}, minmax(0, 1fr))` }}
          >
            {bottomItems.map((item) => {
              const active = isActive(item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    replace={emAlgumaAba}
                    className={cn(
                      "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-5" stroke={active ? 2 : 1.75} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
