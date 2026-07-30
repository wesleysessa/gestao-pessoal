// Service worker: instalação do PWA + notificações push.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // passthrough — sem respondWith(), a requisição segue normal para a rede.
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
