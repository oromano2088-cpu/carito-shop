// Service worker mínimo de CARITO.SHOP: permite instalar la tienda como app.
// No guarda nada en caché (los precios y el stock siempre se leen en vivo).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(
    fetch(e.request).catch(
      () =>
        new Response(
          '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CARITO.SHOP</title><body style="font-family:sans-serif;background:#0b0d12;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px"><div><h1>Sin conexión</h1><p>Revisá tu internet y volvé a abrir CARITO.SHOP.</p></div>',
          { headers: { "Content-Type": "text/html; charset=utf-8" } }
        )
    )
  );
});
