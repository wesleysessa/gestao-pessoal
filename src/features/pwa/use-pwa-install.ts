import { useEffect, useReducer } from "react";
import {
  hasNativePrompt,
  isIOS,
  isSafari,
  isStandalone,
  promptNativeInstall,
  subscribeInstall,
} from "./install";

/** Estado de instalação do PWA (reage à chegada do evento beforeinstallprompt). */
export function usePwaInstall() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => subscribeInstall(force), []);
  return {
    canInstall: hasNativePrompt(),
    isStandalone: isStandalone(),
    isIOS: isIOS(),
    isSafari: isSafari(),
    install: promptNativeInstall,
  };
}
