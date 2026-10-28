// Garde l'appli disponible hors connexion (les données viennent toujours du relais)
const CACHE = "chauffage-v8";
const FILES = ["./", "index.html", "app.js", "manifest.webmanifest", "icon-cadran.svg", "icon-cadran-192.png", "icon-cadran-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // le relais n'est jamais mis en cache
  e.respondWith(fetch(e.request.url, { cache: "no-cache" }).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request)));
});

// Alertes envoyées par le relais
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: "Chauffage", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Chauffage", {
    body: d.body || "", tag: d.tag || "chauffage", icon: "icon-cadran-192.png", badge: "icon-cadran-192.png",
    data: { tab: d.tag === "bilan" ? "suivi" : "rooms" },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const tab = e.notification.data?.tab || "rooms";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) if (c.url.startsWith(self.registration.scope)) { c.postMessage({ tab }); return c.focus(); }
    return self.clients.openWindow(`./?tab=${tab}`);
  }));
});
