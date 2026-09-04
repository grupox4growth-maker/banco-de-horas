// Service worker mínimo — habilita a instalação do app (PWA).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
// A simples presença de um handler de fetch permite a instalação ("Adicionar à tela inicial").
self.addEventListener("fetch", () => {});
