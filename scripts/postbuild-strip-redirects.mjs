// O motor novo do Cloudflare (deploy via "Workers" conectado ao Git) rejeita
// o _redirects com "loop infinito" mesmo com not_found_handling configurado
// no wrangler.toml. Cloudflare Pages classico (a hospedagem original/matriz)
// injeta CF_PAGES=1 automaticamente na build; se essa variavel nao existir,
// assume-se o motor novo e remove o arquivo (o fallback de SPA passa a ser
// feito por not_found_handling no wrangler.toml).
import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";

if (!process.env.CF_PAGES) {
  const path = join(process.cwd(), "dist", "_redirects");
  if (existsSync(path)) {
    unlinkSync(path);
    console.log("[build] _redirects removido do dist (fora do Cloudflare Pages classico).");
  }
}
