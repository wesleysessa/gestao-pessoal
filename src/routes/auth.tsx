import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconArrowRight,
  IconArrowLeft,
  IconLoader2,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { startSession } from "@/features/auth/idle";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    // sessão persistida (sem rede) — se já está logado, vai direto pra home
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  component: AuthPage,
});

type Step = "intro" | "login";

function AuthPage() {
  const [step, setStep] = useState<Step>("intro");

  return (
    <div
      className="relative flex min-h-svh flex-col items-center justify-center p-0"
      style={{
        background:
          "linear-gradient(180deg, var(--color-night-bg) 0%, var(--color-night-bg-2) 100%)",
      }}
    >
      <div className="relative flex min-h-svh w-full max-w-sm flex-col px-6 py-5">
        {step === "intro" && <Intro onStart={() => setStep("login")} />}
        {step === "login" && <Login onBack={() => setStep("intro")} />}
      </div>
    </div>
  );
}

/* ---------- Marca ---------- */
function BrandMark({ size = 88, radius = 24 }: { size?: number; radius?: number }) {
  return (
    <img
      src="/app-icon.png"
      alt="Gestão Pessoal"
      width={size}
      height={size}
      className="shadow-[0_8px_24px_-6px_rgba(0,0,0,.5)]"
      style={{ width: size, height: size, borderRadius: radius }}
    />
  );
}

/* ---------- Splash (única tela antes do login) ---------- */
function Intro({ onStart }: { onStart: () => void }) {
  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <BrandMark size={104} radius={28} />
        <div className="text-center">
          <div className="text-3xl font-bold tracking-[-0.02em] text-night-text">
            gestão <span className="text-night-text-2">pessoal</span>
          </div>
          <div className="mt-1.5 text-[13px] uppercase tracking-[0.14em] text-night-text-2">
            rotinas do dia a dia
          </div>
        </div>
      </div>
      <AccentButton onClick={onStart}>
        Começar <IconArrowRight className="size-5" />
      </AccentButton>
    </>
  );
}

/* ---------- Login (e-mail/senha — Supabase) ---------- */
function Login({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keep, setKeep] = useState(true);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error("E-mail ou senha inválidos");
      startSession(keep); // política de expiração (7 dias com "manter conectado", senão 24h de inatividade)
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setLoading(false);
    }
  }

  async function forgotPassword() {
    if (!email.includes("@")) {
      return toast.error("Informe seu e-mail para redefinir a senha.");
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) return toast.error(error.message);
    toast.success("Enviamos um e-mail para redefinir sua senha");
  }

  return (
    <form onSubmit={signIn} className="flex flex-1 flex-col">
      <div className="flex items-center gap-3.5 pb-5 pt-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="flex size-11 items-center justify-center rounded-xl border border-night-border bg-night-surface text-night-text transition active:opacity-80"
        >
          <IconArrowLeft className="size-5" />
        </button>
        <h1 className="text-[22px] font-bold text-night-text">Entrar</h1>
      </div>

      <div className="flex flex-1 flex-col gap-3.5">
        <NightField icon={<IconMail className="size-5" />}>
          <input
            type="email"
            required
            placeholder="E-mail"
            autoComplete="username"
            aria-label="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-night-text outline-none placeholder:text-night-muted"
          />
        </NightField>

        <NightField icon={<IconLock className="size-5" />}>
          <input
            type={show ? "text" : "password"}
            required
            placeholder="Senha"
            autoComplete="current-password"
            aria-label="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-night-text outline-none placeholder:text-night-muted"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          >
            {show ? <IconEyeOff className="size-5" /> : <IconEye className="size-5" />}
          </button>
        </NightField>

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer select-none items-center gap-2 text-[13.5px] text-night-text-2">
            <input
              type="checkbox"
              checked={keep}
              onChange={(e) => setKeep(e.target.checked)}
              className="size-4 rounded"
              style={{ accentColor: "#2E8BFF" }}
            />
            Manter conectado
          </label>
          <button
            type="button"
            onClick={forgotPassword}
            className="text-[13.5px] font-semibold text-night-accent transition active:opacity-80"
          >
            Esqueci a senha
          </button>
        </div>
      </div>

      <AccentButton type="submit" disabled={loading}>
        {loading ? <IconLoader2 className="size-5 animate-spin" /> : null}
        Entrar
      </AccentButton>
    </form>
  );
}

/* ---------- building blocks ---------- */
function AccentButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-night-accent text-base font-semibold text-white shadow-[0_10px_26px_-8px_rgba(46,139,255,.6)] transition active:opacity-90 disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function NightField({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex h-14 items-center gap-3 rounded-2xl border border-night-border bg-night-surface px-4 text-night-muted focus-within:border-night-accent">
      {icon}
      {children}
    </label>
  );
}
