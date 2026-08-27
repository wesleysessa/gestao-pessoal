// Gera dist/precache-manifest.json com a lista de arquivos que o service
// worker (public/sw.js) guarda em cache no "install" — é o que permite abrir
// o app (o esqueleto: HTML/CSS/JS) mesmo sem internet. Roda a cada build
// porque os nomes dos arquivos em dist/assets mudam (hash no nome).
import { createHash } from "node:crypto";
import { existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const distDir = join(process.cwd(), "dist");

function listarArquivos(dir, base = "") {
  const arquivos = [];
  for (const nome of readdirSync(dir)) {
    const caminhoAbsoluto = join(dir, nome);
    const caminhoRelativo = base ? `${base}/${nome}` : nome;
    if (statSync(caminhoAbsoluto).isDirectory()) {
      arquivos.push(...listarArquivos(caminhoAbsoluto, caminhoRelativo));
    } else {
      arquivos.push(caminhoRelativo);
    }
  }
  return arquivos;
}

if (!existsSync(distDir)) {
  console.warn("[precache] dist/ não existe ainda — pulando geração do manifesto.");
  process.exit(0);
}

const arquivosAssets = existsSync(join(distDir, "assets"))
  ? listarArquivos(join(distDir, "assets"), "assets").map((f) => `/${f}`)
  : [];

// Arquivos essenciais fora de assets/ — só entram se existirem (o app pode
// não ter todos os ícones num checkout mais antigo).
const essenciaisCandidatos = [
  "/index.html",
  "/manifest.webmanifest",
  "/app-icon.png",
  "/app-icon-192.png",
  "/app-icon-512.png",
  "/app-icon-maskable.png",
  "/apple-touch-icon.png",
  "/favicon-32.png",
];
const essenciais = essenciaisCandidatos.filter((f) => existsSync(join(distDir, f.slice(1))));

const files = [...essenciais, ...arquivosAssets];

// Versão determinística: mesmo conjunto de arquivos = mesmo nome de cache
// (evita invalidar o cache do usuário à toa quando nada mudou).
const version = createHash("sha256")
  .update(files.slice().sort().join("\n"))
  .digest("hex")
  .slice(0, 12);

writeFileSync(join(distDir, "precache-manifest.json"), JSON.stringify({ version, files }, null, 2));
console.log(`[precache] manifesto gerado: ${files.length} arquivos, versão ${version}.`);
