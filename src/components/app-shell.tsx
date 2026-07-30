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
} from "@tabler/icons-react";
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
import { MENU_MODULOS } from "@/features/menu-modulos";

const drawerSections = [{ label: "Início", to: "/", icon: IconHome }, ...MENU_MODULOS];

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
  const { isStandalone } = usePwaInstall();

  const isRoot = pathname === "/";
  const tituloSecao = sectionTitle(pathname);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("home-no-scrollbar", isRoot);
    return () => html.classList.remove("home-no-scrollbar");
  }, [isRoot]);

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");

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
      <header className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-divider dark:border-border bg-card px-2 text-foreground shadow-sm">
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
                  <img src="/app-icon.png" alt="" className="size-9 shrink-0 rounded-chip" />
                  <div className="min-w-0">
                    <SheetTitle className="truncate text-base font-medium text-primary">
                      {profile?.name ?? "Gestão Pessoal"}
                    </SheetTitle>
                    <p className="text-xs text-muted-foreground">Gestão Pessoal</p>
                  </div>
                </div>
              </SheetHeader>
              <nav className="scrollbar-clean flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
                {drawerSections.map((s) => (
                  <Link
                    key={s.to}
                    to={s.to}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive(s.to)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                    )}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-chip bg-secondary">
                      <s.icon className="size-4 text-primary" stroke={1.75} />
                    </span>
                    <span className="flex-1">{s.label}</span>
                    <IconChevronRight className="size-4 text-muted-foreground/60" stroke={1.75} />
                  </Link>
                ))}
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
            <img src="/app-icon.png" alt="" className="size-6 shrink-0 rounded-md" />
            Menu
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
      </header>

      <ChangePasswordDialog open={pwdOpen} onOpenChange={setPwdOpen} />
      <InstallDialog open={installOpen} onOpenChange={setInstallOpen} />

      <main className="flex-1 overflow-x-hidden pb-6">{children}</main>
    </div>
  );
}
