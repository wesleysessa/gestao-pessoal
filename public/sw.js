// Service worker: instalação do PWA, cache do esqueleto do app (pra abrir
// offline) e notificações push.

const PRECACHE_PREFIXO = "gp-precache-";

async function buscarManifesto() {
  try {
    const res = await fetch("/precache-manifest.json", { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (_e) {
    return null;
  }
}

async function nomeCacheAtual() {
  const nomes = await caches.keys();
  return nomes.find((n) => n.startsWith(PRECACHE_PREFIXO)) || null;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const manifesto = await buscarManifesto();
      if (manifesto) {
        const cache = await caches.open(PRECACHE_PREFIXO + manifesto.version);
        try {
          await cache.addAll(manifesto.files);
        } catch (_e) {
          // um arquivo individual falhou (ex.: 404) — não trava a instalação por isso.
        }
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const manifesto = await buscarManifesto();
      const nomeAtual = manifesto ? PRECACHE_PREFIXO + manifesto.version : null;
      const nomes = await caches.keys();
      await Promise.all(
        nomes
          .filter((n) => n.startsWith(PRECACHE_PREFIXO) && n !== nomeAtual)
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Só GET, só do próprio app — chamadas ao Supabase (outro domínio) e
  // escritas (POST/PUT/PATCH/DELETE) seguem direto pra rede, sem cache.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegação (abrir uma rota) — tenta a rede primeiro; sem internet, cai
  // pro index.html cacheado e o roteamento client-side assume dali.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch (_e) {
          const nome = await nomeCacheAtual();
          if (!nome) return Response.error();
          const cache = await caches.open(nome);
          const resposta = await cache.match("/index.html");
          return resposta || Response.error();
        }
      })(),
    );
    return;
  }

  // Assets estáticos do app (JS/CSS/ícones) — cache-first, atualizando em
  // segundo plano quando há rede.
  event.respondWith(
    (async () => {
      const nome = await nomeCacheAtual();
      const cache = nome ? await caches.open(nome) : null;
      const emCache = cache ? await cache.match(request) : null;
      const daRede = fetch(request)
        .then((res) => {
          if (res.ok && cache) cache.put(request, res.clone());
          return res;
        })
        .catch(() => null);
      return emCache || (await daRede) || Response.error();
    })(),
  );
});

// Push recebido (mesmo com o app fechado) → mostra a notificação do sistema.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_e) {
    data = { titulo: event.data ? event.data.text() : "Gestão Pessoal" };
  }
  const titulo = data.titulo || "Gestão Pessoal";
  const options = {
    body: data.mensagem || "",
    icon: "/app-icon.png",
    badge: "/app-icon.png",
    data: { link: data.link || "/" },
    vibrate: [80, 40, 80],
  };
  event.waitUntil(self.registration.showNotification(titulo, options));
});

// Clique na notificação → foca (ou abre) o app na tela relacionada.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";
  event.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of wins) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(link);
            } catch (_e) {
              /* ignore */
            }
          }
          return;
        }
      }
      if (self.clients.openWindow) await self.clients.openWindow(link);
    })(),
  );
});
