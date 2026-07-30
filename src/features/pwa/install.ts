// Captura global do evento de instalação do PWA (uma única fonte de verdade).
// O evento pode disparar antes do React montar, então registramos no import.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    emit();
  });
}

export function subscribeInstall(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function hasNativePrompt() {
  return deferred !== null;
}

export async function promptNativeInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferred) return "unavailable";
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  emit();
  return outcome;
}

const ua = () => (typeof navigator !== "undefined" ? navigator.userAgent : "");
export const isIOS = () => /iphone|ipad|ipod/i.test(ua());
export const isSafari = () => /safari/i.test(ua()) && !/crios|fxios|edgios/i.test(ua());
export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}
