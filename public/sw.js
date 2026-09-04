// Service worker — habilita instalação (PWA) e recebe notificações push.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// A presença de um handler de fetch permite a instalação ("Adicionar à tela inicial").
self.addEventListener("fetch", () => {});

// Notificação push (chega mesmo com o app fechado).
self.addEventListener("push", (event) => {
  let data = { title: "Ponto & Banco de Horas", body: "Você tem um aviso de ponto." };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag,
      renotify: true,
      vibrate: [200, 100, 200],
      requireInteraction: false,
    }),
  );
});

// Clicar na notificação abre/foca o app.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/me");
    }),
  );
});
