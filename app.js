/* Chauffage : pilotage des radiateurs Cozytouch
   Appli web installable (PWA). Parle au relais Supabase, ou fonctionne en démo. */
(() => {
"use strict";

// ---------- Réglages Cozytouch (identifiants de "capabilities")
const C = {
  POWER: 7, TARGET: 40, TEMP: 117, HEATING: 153, NAME: 154, OVERRIDE: 157, OVERRIDE_TOTAL: 158,
  OVERRIDE_LEFT: 159, MIN: 160, MAX: 161, ABSENCE_T: 172, PROG: 184, STEP: 294, TEMP_OK: 103150,
  ECO_T: 100196, NIGHT_T: 100197, COMFORT_T: 100198, POWER_W: 104025,
};
const DAY_IDS = [100334, 100335, 100336, 100337, 100338, 100339, 100341]; // lundi..dimanche
const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const LEVELS = {
  1: { key: "comfort", label: "Confort", cap: C.COMFORT_T, color: "var(--confort)" },
  2: { key: "eco", label: "Éco", cap: C.ECO_T, color: "var(--eco)" },
  3: { key: "night", label: "Nuit", cap: C.NIGHT_T, color: "var(--nuit)" },
};
const ON = "4", OFF = "0";

// ---------- Icônes (traits simples)
const I = {
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  rooms: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
  plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  conso: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  power: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v8"/><path d="M6.3 7.3a8 8 0 1 0 11.4 0"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
  laptop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="7" width="16" height="13" rx="2"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 4-3 5.5-3 9.5A3 3 0 0 0 12 15a3 3 0 0 0 3-3c0-1.2-.5-2-.9-2.7C17 11 19 13.6 19 16a7 7 0 0 1-14 0c0-5 4.7-7.4 7-14z"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  boost: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
};

// ---------- Stockage local (protégé : peut être indisponible)
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* rien */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* rien */ } },
};

const DEFAULT_CFG = { url: "", code: "", demo: false, staleHours: 3,
  work: { room: "Bureau", temp: 20, hours: 8 }, boost: { delta: 2, minutes: 60 } };
let cfg = Object.assign({}, DEFAULT_CFG, store.get("cfg", {}));
cfg.work = Object.assign({}, DEFAULT_CFG.work, cfg.work);
cfg.boost = Object.assign({}, DEFAULT_CFG.boost, cfg.boost);

const S = {
  setup: null, conso: null, serverNow: 0, fetchedAt: 0, loading: false, error: null,
  tab: store.get("tab", "rooms"), planRoom: null, jobs: [],
};
const cached = store.get("lastState", null);
if (cached && !cfg.demo) { S.setup = cached.setup; S.serverNow = cached.now; S.fetchedAt = cached.fetchedAt; S.fromCache = true; }

// ---------- Outils
const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nf1 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const deg = (v) => (v == null || isNaN(v) ? "–" : nf1.format(v)) ;
const nowS = () => Math.floor(Date.now() / 1000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
function ago(sec) {
  if (sec < 90) return "à l'instant";
  const m = Math.round(sec / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 48) return `il y a ${h} h${m % 60 && h < 10 ? " " + String(m % 60).padStart(2, "0") : ""}`;
  return `il y a ${Math.round(h / 24)} jours`;
}
function dateFr(ts, withTime = true) {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) +
    (withTime ? " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "");
}
function duration(min) {
  min = Math.round(min);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

// ---------- Lecture du modèle Cozytouch
function capsOf(dev) { const m = {}; for (const c of dev.capabilities || []) m[c.capabilityId] = c; return m; }
function num(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }
function pair(v) { try { const a = JSON.parse(v); return Array.isArray(a) ? num(a[0]) : num(v); } catch { return num(v); } }
function parseDay(v) {
  try {
    const a = JSON.parse(v);
    return a.filter((p) => Array.isArray(p) && p[1] > 0).map((p) => ({ min: p[0], level: p[1] })).sort((x, y) => x.min - y.min);
  } catch { return []; }
}
function serializeDay(points) {
  const sorted = [...points].sort((a, b) => a.min - b.min).slice(0, 10).map((p) => [p.min, p.level]);
  while (sorted.length < 10) sorted.push([0, 0]);
  return JSON.stringify(sorted);
}

function rooms() {
  if (!S.setup) return [];
  const devs = S.setup.devices || [];
  return devs.filter((d) => capsOf(d)[C.NAME]).map((d) => {
    const c = capsOf(d);
    const childName = (d.tags || []).find((t) => t.label === "iothubChildrenIds")?.value;
    const rad = devs.find((x) => x.name === childName);
    const rc = rad ? capsOf(rad) : {};
    const v = (id) => c[id]?.value;
    const tempOk = v(C.TEMP_OK) == null || v(C.TEMP_OK) === "1";
    return {
      id: d.deviceId, dev: d, caps: c,
      name: v(C.NAME) || d.name,
      model: rad ? rad.longName : "",
      watts: rc[C.POWER_W] ? num(rc[C.POWER_W].value) : null,
      temp: tempOk ? num(v(C.TEMP)) : null,
      tempAt: c[C.TEMP]?.modificationDate || 0,
      target: num(v(C.TARGET)),
      min: num(v(C.MIN)) ?? 7, max: num(v(C.MAX)) ?? 28, step: num(v(C.STEP)) || 0.5,
      on: v(C.POWER) != null && v(C.POWER) !== OFF,
      powerAt: c[C.POWER]?.modificationDate || 0,
      prog: v(C.PROG) === "1",
      override: v(C.OVERRIDE) === "1",
      overrideTotal: num(v(C.OVERRIDE_TOTAL)) || 120,
      overrideLeft: num(v(C.OVERRIDE_LEFT)) || 0,
      heating: v(C.HEATING) === "1",
      levels: { 1: pair(v(C.COMFORT_T)), 2: pair(v(C.ECO_T)), 3: pair(v(C.NIGHT_T)) },
      levelsRaw: { 1: v(C.COMFORT_T), 2: v(C.ECO_T), 3: v(C.NIGHT_T) },
      week: DAY_IDS.map((id) => parseDay(v(id))),
      weekRaw: DAY_IDS.map((id) => v(id)),
      hasSchedule: DAY_IDS.every((id) => c[id]),
    };
  }).sort((a, b) => a.name.localeCompare(b.name, "fr"));
}
const roomById = (id) => rooms().find((r) => r.id === id);

// Niveau actif du programme à un instant donné
function levelAt(room, dayIdx, minute) {
  const pts = room.week[dayIdx];
  let lvl = null;
  for (const p of pts) if (p.min <= minute) lvl = p.level;
  if (lvl == null) {
    for (let k = 1; k <= 7 && lvl == null; k++) {
      const prev = room.week[(dayIdx - k + 7) % 7];
      if (prev.length) lvl = prev[prev.length - 1].level;
    }
  }
  return lvl;
}
function nowParts() { const d = new Date(); return { day: (d.getDay() + 6) % 7, min: d.getHours() * 60 + d.getMinutes() }; }
function nextChange(room) {
  const { day, min } = nowParts();
  for (let k = 0; k < 7; k++) {
    const di = (day + k) % 7;
    for (const p of room.week[di]) if (k > 0 || p.min > min) return { day: di, min: p.min, level: p.level, k };
  }
  return null;
}

// Dernières nouvelles des radiateurs : la température remonte souvent, c'est le meilleur pouls
function health() {
  const rs = rooms();
  const last = Math.max(0, ...rs.map((r) => r.tempAt));
  const now = S.serverNow ? S.serverNow + (nowS() - Math.floor(S.fetchedAt / 1000)) : nowS();
  const gwDead = (S.setup?.gateways || []).some((g) => g.isAlive === false);
  const age = last ? now - last : 0;
  return { last, age, stale: gwDead || (last && age > cfg.staleHours * 3600), gwDead };
}

// ---------- Accès au relais (ou démo)
const demo = {
  data: null,
  init() {
    const D = JSON.parse(JSON.stringify(window.DEMO));
    const shift = nowS() - D.now;
    const shiftDev = (d) => { for (const c of d.capabilities) if (c.modificationDate) c.modificationDate += shift; };
    D.setup.devices.forEach(shiftDev);
    for (const z of D.conso) for (const p of z.consumptionPeriods) p.date += shift - (shift % 86400);
    this.data = D;
  },
  async call(action, method, body) {
    if (!this.data) this.init();
    await sleep(500 + Math.random() * 400);
    const D = this.data;
    if (action === "state") return { now: nowS(), setup: JSON.parse(JSON.stringify(D.setup)) };
    if (action === "conso") return { now: nowS(), conso: D.conso };
    if (action === "absence") {
      D.setup.absence = body.start ? { startDate: body.start, endDate: body.end } : { startDate: null, endDate: null };
      return { ok: true };
    }
    if (action === "write") {
      // En démo, les commandes s'appliquent (sauf si "box figée" est cochée, pour voir l'alerte)
      const results = [];
      for (const w of body.writes) {
        await sleep(250);
        if (!cfg.demoStuck) {
          const dev = D.setup.devices.find((d) => d.deviceId === w.deviceId);
          const cap = dev.capabilities.find((c) => c.capabilityId === w.capabilityId);
          if (cap) { cap.value = w.value; cap.modificationDate = nowS(); }
          else dev.capabilities.push({ capabilityId: w.capabilityId, value: w.value, modificationDate: nowS() });
        }
        results.push({ ...w, ok: true, attempts: 1 });
      }
      return { ok: true, results };
    }
    throw new Error("Action inconnue");
  },
};

async function api(action, method = "GET", body) {
  if (cfg.demo) return demo.call(action, method, body);
  if (!cfg.url) throw new Error("Relais non configuré");
  const r = await fetch(cfg.url.replace(/\/$/, "") + "?action=" + action, {
    method,
    headers: { "x-app-code": cfg.code, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await r.json(); } catch { /* rien */ }
  if (!r.ok) throw new Error(data.error || `Erreur ${r.status}`);
  return data;
}

async function refresh({ quiet = false } = {}) {
  if (S.loading) return;
  S.loading = true; if (!quiet) renderTop();
  try {
    const d = await api("state");
    S.setup = d.setup; S.serverNow = d.now; S.fetchedAt = Date.now(); S.error = null; S.fromCache = false;
    if (!cfg.demo) store.set("lastState", { setup: d.setup, now: d.now, fetchedAt: S.fetchedAt });
  } catch (e) {
    S.error = e.message;
  } finally {
    S.loading = false;
    render();
  }
}
async function loadConso() {
  try { const d = await api("conso"); S.conso = d.conso; S.consoError = null; }
  catch (e) { S.consoError = e.message; }
  if (S.tab === "conso") render();
}

// ---------- Commandes : envoi, nouvelles tentatives, puis vérification sur les radiateurs
let jobSeq = 1;
const SKIP_VERIFY = new Set([C.OVERRIDE_TOTAL, C.OVERRIDE_LEFT]);
function sameValue(cap, a, b) {
  if (a == null) return false;
  if (DAY_IDS.includes(cap) || [C.COMFORT_T, C.ECO_T, C.NIGHT_T].includes(cap)) {
    try { return JSON.stringify(JSON.parse(a)) === JSON.stringify(JSON.parse(b)); } catch { return a === b; }
  }
  const x = parseFloat(a), y = parseFloat(b);
  return !isNaN(x) && !isNaN(y) ? Math.abs(x - y) < 0.01 : a === b;
}
function verify(writes) {
  if (!S.setup) return false;
  return writes.filter((w) => !SKIP_VERIFY.has(w.capabilityId)).every((w) => {
    const dev = S.setup.devices.find((d) => d.deviceId === w.deviceId);
    return dev && sameValue(w.capabilityId, capsOf(dev)[w.capabilityId]?.value, w.value);
  });
}
function pendingRoomIds() {
  const s = new Set();
  for (const j of S.jobs) if (j.status === "sending" || j.status === "verifying") j.writes.forEach((w) => s.add(w.deviceId));
  return s;
}
async function runJob(label, writes, done) {
  if (!writes.length) return;
  const job = { id: jobSeq++, label, writes, status: "sending", detail: "Envoi…" };
  S.jobs.push(job); renderJobs(); render();
  try {
    const res = await api("write", "POST", { writes });
    if (!res.ok) {
      const bad = (res.results || []).find((r) => !r.ok);
      throw new Error(bad?.reason ? `Cozytouch a refusé : ${bad.reason}` : "Cozytouch a refusé la commande");
    }
    job.status = "verifying"; job.detail = "Envoyé, vérification sur les radiateurs…"; renderJobs();
    for (const wait of [4000, 10000, 25000, 45000]) {
      await sleep(wait);
      await refresh({ quiet: true });
      if (verify(writes)) { job.status = "done"; job.detail = "Appliqué"; break; }
    }
    if (job.status !== "done") {
      job.status = "unconfirmed";
      job.detail = "Cozytouch a dit OK mais les radiateurs n'ont pas appliqué. Si ça se répète, redémarre la CozyBox.";
    }
  } catch (e) {
    job.status = "failed"; job.detail = e.message;
  }
  renderJobs(); render();
  if (job.status === "done") { done && done(); setTimeout(() => dismissJob(job.id), 3500); }
}
function dismissJob(id) { S.jobs = S.jobs.filter((j) => j.id !== id); renderJobs(); render(); }
function retryJob(id) { const j = S.jobs.find((x) => x.id === id); if (!j) return; dismissJob(id); runJob(j.label, j.writes); }

function renderJobs() {
  const el = $("#jobs");
  el.innerHTML = S.jobs.map((j) => {
    const icon = j.status === "done" ? I.check : (j.status === "failed" || j.status === "unconfirmed") ? I.warn : I.clock;
    const act = (j.status === "failed" || j.status === "unconfirmed")
      ? `<button data-retry="${j.id}">Réessayer</button><button data-dismiss="${j.id}" aria-label="Fermer">OK</button>` : "";
    return `<div class="job ${j.status}"><span class="ic">${icon}</span><div class="j-body"><b>${esc(j.label)}</b>${esc(j.detail)}</div>${act}</div>`;
  }).join("");
}

// Écritures types
const W = (room, cap, value) => ({ deviceId: room.id, capabilityId: cap, value: String(value) });
function writesPower(room, on) { return [W(room, C.POWER, on ? ON : OFF)]; }
function writesTarget(room, t) {
  if (room.prog) return [W(room, C.OVERRIDE_TOTAL, room.overrideTotal || 120), W(room, C.OVERRIDE, "1"), W(room, C.TARGET, t)];
  return [W(room, C.TARGET, t)];
}
function writesMode(room, prog) {
  const w = [W(room, C.PROG, prog ? "1" : "0")];
  if (room.override) w.unshift(W(room, C.OVERRIDE_LEFT, "0"), W(room, C.OVERRIDE, "0"));
  return w;
}
function writesOverride(room, t, minutes) {
  const w = [];
  if (!room.on) w.push(W(room, C.POWER, ON));
  if (!room.prog) w.push(W(room, C.PROG, "1"));
  w.push(W(room, C.OVERRIDE_TOTAL, minutes), W(room, C.OVERRIDE, "1"), W(room, C.TARGET, t));
  return w;
}
function writesCancelOverride(room) { return [W(room, C.OVERRIDE_LEFT, "0"), W(room, C.OVERRIDE, "0")]; }
const clampT = (room, t) => Math.min(room.max, Math.max(room.min, Math.round(t / room.step) * room.step));

// ---------- Rendu
function render() {
  const app = $("#app");
  if (!cfg.demo && !cfg.url) { app.innerHTML = welcomeView(); bindWelcome(); return; }
  const scrollY = window.scrollY;
  app.innerHTML = `<div class="wrap">${topView()}${S.tab === "rooms" ? roomsView() : S.tab === "plan" ? planView() : consoView()}</div>${navView()}`;
  window.scrollTo(0, scrollY);
}
function renderTop() { const el = $("#refresh"); if (el) el.classList.toggle("spin", S.loading); }

function topView() {
  const rs = rooms();
  const onCount = rs.filter((r) => r.on).length;
  let title = "Chauffage";
  if (S.tab === "rooms" && rs.length) {
    title = onCount === 0 ? "Tout est éteint" : onCount === rs.length ? "Toutes les pièces chauffent" :
      `${onCount} pièce${onCount > 1 ? "s" : ""} sur ${rs.length} ${onCount > 1 ? "chauffent" : "chauffe"}`;
  } else if (S.tab === "plan") title = "Planning";
  else if (S.tab === "conso") title = "Consommation";
  const h = health();
  const sub = S.error ? `<span style="color:var(--alert)">${esc(S.error)}</span>` :
    S.fetchedAt ? `Données reçues ${ago(Math.round((Date.now() - S.fetchedAt) / 1000))}${S.fromCache ? " (hors ligne)" : ""}` : "Chargement…";
  let banners = "";
  if (cfg.demo && S.tab === "rooms") banners += `<div class="banner info"><div class="b-body"><strong>Mode démo.</strong> Ce sont tes vraies données du 12 octobre, mais rien n'est envoyé à tes radiateurs.</div></div>`;
  if (S.setup && h.stale && S.tab === "rooms") {
    banners += `<div class="banner alert">${I.warn}<div class="b-body"><strong>Tes radiateurs ne donnent plus de nouvelles</strong> depuis ${dateFr(h.last)}. Les commandes risquent de ne pas passer. Débranche la CozyBox 30 secondes puis rebranche-la.</div></div>`;
  }
  const abs = S.setup?.absence;
  if (abs?.startDate && abs?.endDate && abs.endDate > nowS()) {
    banners += `<div class="banner info">${I.bag}<div class="b-body"><strong>Mode vacances</strong> jusqu'au ${dateFr(abs.endDate)}.<br><button class="btn" data-act="absence-stop">Arrêter le mode vacances</button></div></div>`;
  }
  return `<header class="top"><div class="status"><h1>${esc(title)}</h1><p class="muted">${sub}</p></div>
    <button class="iconbtn${S.loading ? " spin" : ""}" id="refresh" data-act="refresh" aria-label="Actualiser">${I.refresh}</button>
    <button class="iconbtn" data-act="settings" aria-label="Réglages">${I.gear}</button></header>${banners}`;
}

function navView() {
  const t = (id, label, icon) => `<button role="tab" aria-selected="${S.tab === id}" data-tab="${id}">${icon}${label}</button>`;
  return `<nav class="tabs" role="tablist"><div class="inner">${t("rooms", "Pièces", I.rooms)}${t("plan", "Planning", I.plan)}${t("conso", "Conso", I.conso)}</div></nav>`;
}

function heatPct(t) { if (t == null) return 30; return Math.round(Math.min(100, Math.max(0, (t - 15) / 7 * 100))); }

function roomsView() {
  const rs = rooms();
  if (!rs.length) return `<div class="empty">${S.error ? "Impossible de lire tes radiateurs pour l'instant." : "Chargement de tes pièces…"}</div>`;
  const pend = pendingRoomIds();
  const work = rs.find((r) => r.name.toLowerCase() === String(cfg.work.room).toLowerCase());
  const scenes = `<div class="scenes" role="group" aria-label="Scènes">
    <button class="scene" data-act="all-on">${I.power}Tout allumer</button>
    <button class="scene" data-act="all-off">${I.moon}Tout éteindre</button>
    ${work ? `<button class="scene" data-act="work">${I.laptop}Télétravail</button>` : ""}
    <button class="scene" data-act="vacation">${I.bag}Vacances</button></div>`;
  const tiles = rs.map((r) => {
    const chips = [];
    if (!r.on) chips.push("Éteint");
    else {
      chips.push(`Consigne ${deg(r.target)}°`);
      if (r.override) chips.push(`Dérogation${r.overrideLeft ? " " + duration(r.overrideLeft) : ""}`);
      else chips.push(r.prog ? "Prog" : "Manuel");
      if (r.heating) chips.push(`<span class="chip flame">${I.flame}Chauffe</span>`);
    }
    return `<button class="tile${r.on ? "" : " off"}" style="--heat:${heatPct(r.temp)}%" data-room="${r.id}" aria-label="${esc(r.name)}, ${r.temp != null ? deg(r.temp) + " degrés" : "température inconnue"}, ${r.on ? "allumé" : "éteint"}">
      ${pend.has(r.id) ? '<span class="pend" aria-hidden="true"></span>' : ""}
      <span class="name">${esc(r.name)}</span>
      <span class="temp num">${r.temp != null ? deg(r.temp) : "–"}<sup>°</sup></span>
      <span class="meta">${chips.map((c) => c.startsWith("<span") ? c : `<span class="chip">${c}</span>`).join("")}</span></button>`;
  }).join("");
  return scenes + `<div class="rooms">${tiles}</div>`;
}

// ---------- Planning
function planView() {
  const rs = rooms().filter((r) => r.hasSchedule);
  if (!rs.length) return `<div class="empty">Aucun planning trouvé.</div>`;
  if (!S.planRoom || !rs.find((r) => r.id === S.planRoom)) S.planRoom = rs[0].id;
  const room = rs.find((r) => r.id === S.planRoom);
  const chips = rs.map((r) => `<button aria-pressed="${r.id === room.id}" data-plan-room="${r.id}">${esc(r.name)}</button>`).join("");
  const { day: today, min: nowMin } = nowParts();
  const rows = room.week.map((pts, di) => {
    const segs = [];
    let cursor = 0, lvl = levelAt(room, di, 0);
    for (const p of pts) { if (p.min > cursor) segs.push([cursor, p.min, lvl]); cursor = Math.max(cursor, p.min); lvl = p.level; }
    segs.push([cursor, 1440, lvl]);
    const bars = segs.filter((s) => s[1] > s[0]).map((s) => `<i style="flex:${s[1] - s[0]};background:${LEVELS[s[2]]?.color || "var(--surface-2)"}" title="${hhmm(s[0])} à ${hhmm(s[1] === 1440 ? 0 : s[1])} : ${LEVELS[s[2]]?.label || "?"}"></i>`).join("");
    const desc = pts.map((p) => `${hhmm(p.min)} ${LEVELS[p.level]?.label}`).join(", ");
    return `<button class="day" data-day="${di}" aria-label="${DAYS[di]} : ${esc(desc)}. Modifier"><span class="lbl">${DAYS_SHORT[di]}</span>
      <span class="bar">${bars}${di === today ? `<span class="now-line" style="left:${nowMin / 14.4}%"></span>` : ""}</span></button>`;
  }).join("");
  const levels = [1, 2, 3].map((k) => `<button class="level" data-level="${k}"><small><span class="dot" style="background:${LEVELS[k].color}"></span>${LEVELS[k].label}</small><b class="num">${deg(room.levels[k])}°</b></button>`).join("");
  const nx = nextChange(room);
  const nxTxt = nx ? `Prochain changement : ${LEVELS[nx.level]?.label.toLowerCase()} à ${hhmm(nx.min)}${nx.k === 0 ? "" : nx.k === 1 ? " demain" : " " + DAYS[nx.day].toLowerCase()}.` : "";
  return `<div class="chips" role="group" aria-label="Pièce">${chips}</div>
    <div class="levels">${levels}</div>
    <p class="help">${room.prog ? "Le programme est actif dans cette pièce." : "Cette pièce est en manuel : le programme ne s'applique pas."} ${nxTxt}</p>
    <div class="card"><div class="week">${rows}</div>
      <div class="hours" aria-hidden="true"><span></span><div><span>0 h</span><span>6 h</span><span>12 h</span><span>18 h</span><span>24 h</span></div></div>
      <div class="legend">${[1, 2, 3].map((k) => `<span><i style="background:${LEVELS[k].color}"></i>${LEVELS[k].label}</span>`).join("")}</div>
    </div>
    <p class="help">Touche un jour pour changer ses horaires, ou une température en haut pour la régler.</p>
    <button class="btn block" data-act="copy-plan">Copier ce planning vers une autre pièce</button>
    ${!room.prog ? `<p></p><button class="btn primary block" data-act="plan-enable">Activer le programme dans cette pièce</button>` : ""}`;
}

// ---------- Conso
function consoData() {
  if (!S.conso) return null;
  const byDay = new Map(), byRoom = new Map();
  for (const z of S.conso) {
    for (const p of z.consumptionPeriods || []) {
      const key = p.date;
      const d = byDay.get(key) || { date: key, hp: 0, hc: 0, cost: 0 };
      if (p.mode === 2) d.hc += p.consumedQuantity || 0; else d.hp += p.consumedQuantity || 0;
      d.cost += p.cost || 0;
      byDay.set(key, d);
      const r = byRoom.get(z.zoneLabel) || { name: z.zoneLabel, kwh: 0, cost: 0 };
      r.kwh += p.consumedQuantity || 0; r.cost += p.cost || 0;
      byRoom.set(z.zoneLabel, r);
    }
  }
  const days = [...byDay.values()].sort((a, b) => a.date - b.date);
  const rooms_ = [...byRoom.values()].sort((a, b) => b.kwh - a.kwh);
  return { days, rooms: rooms_, kwh: days.reduce((s, d) => s + d.hp + d.hc, 0), cost: days.reduce((s, d) => s + d.cost, 0) };
}
function consoView() {
  if (S.conso == null && !S.consoError) { loadConso(); return `<div class="empty">Chargement de la consommation…</div>`; }
  if (S.consoError) return `<div class="empty">Consommation indisponible : ${esc(S.consoError)}<p><button class="btn" data-act="conso-retry">Réessayer</button></p></div>`;
  const d = consoData();
  if (!d.days.length) return `<div class="empty">Pas encore de consommation enregistrée.</div>`;
  const nb = d.days.length;
  const avg = d.cost / nb;
  const maxKwh = Math.max(...d.days.map((x) => x.hp + x.hc), 0.1);
  // Graphique : barres empilées heures pleines / heures creuses
  const W_ = 320, H = 150, padB = 22, padT = 8, gap = 10;
  const bw = Math.min(40, (W_ - gap * (nb + 1)) / nb);
  const totalW = nb * bw + (nb - 1) * gap;
  const x0 = (W_ - totalW) / 2;
  const sc = (v) => (v / maxKwh) * (H - padB - padT);
  const bars = d.days.map((x, i) => {
    const X = x0 + i * (bw + gap);
    const hcH = sc(x.hc), hpH = sc(x.hp);
    const base = H - padB;
    const lbl = new Date(x.date * 1000).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
    const tip = `${lbl} : ${nf2.format(x.hp + x.hc)} kWh, ${nf2.format(x.cost)} €`;
    // creuses en bas, pleines au-dessus, 2 px d'écart, bout arrondi en haut uniquement
    const r = 4;
    const top = hpH > 0 ? hpH : hcH;
    const segHC = hcH > 0 ? (hpH > 0 ? `<rect x="${X}" y="${base - hcH}" width="${bw}" height="${hcH}" fill="var(--hc)"/>` :
      `<path d="M${X},${base} v${-(hcH - r)} q0,-${r} ${r},-${r} h${bw - 2 * r} q${r},0 ${r},${r} v${hcH - r} z" fill="var(--hc)"/>`) : "";
    const hpY = base - hcH - (hcH > 0 ? 2 : 0) - hpH;
    const segHP = hpH > 0 ? `<path d="M${X},${hpY + hpH} v${-(hpH - r)} q0,-${r} ${r},-${r} h${bw - 2 * r} q${r},0 ${r},${r} v${hpH - r} z" fill="var(--hp)"/>` : "";
    return `<g class="b" data-tip="${esc(tip)}" data-x="${X + bw / 2}" data-y="${base - top - hcH}">${segHC}${segHP}
      <rect x="${X - gap / 2}" y="${padT}" width="${bw + gap}" height="${H - padT}" fill="transparent"/>
      <text x="${X + bw / 2}" y="${H - 6}" text-anchor="middle" font-size="11" fill="var(--ink-2)">${esc(lbl)}</text></g>`;
  }).join("");
  const grid = `<line x1="0" x2="${W_}" y1="${H - padB}" y2="${H - padB}" stroke="var(--line)"/>`;
  const roomsList = d.rooms.map((r) => `<div class="r"><span>${esc(r.name)}</span><span class="num"><b>${nf2.format(r.cost)} €</b> <span class="muted">${nf1.format(r.kwh)} kWh</span></span>
    <span class="share"><i style="width:${Math.round(r.kwh / Math.max(...d.rooms.map((x) => x.kwh)) * 100)}%"></i></span></div>`).join("");
  const missing = rooms().filter((r) => !d.rooms.find((x) => x.name === r.name)).map((r) => r.name);
  const table = d.days.map((x) => `<tr><td>${new Date(x.date * 1000).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</td><td>${nf2.format(x.hp)}</td><td>${nf2.format(x.hc)}</td><td>${nf2.format(x.cost)} €</td></tr>`).join("");
  return `<div class="card"><div class="kpis">
      <div class="kpi"><b class="num">${nf2.format(d.cost)} €</b><span>sur ${nb} jour${nb > 1 ? "s" : ""}</span></div>
      <div class="kpi"><b class="num">${nf1.format(d.kwh)} kWh</b><span>soit ${nf2.format(avg)} € par jour en moyenne</span></div></div></div>
    <div class="card"><h2 class="sec" style="margin-top:0">Par jour</h2>
      <div class="legend"><span><i style="background:var(--hp)"></i>Heures pleines</span><span><i style="background:var(--hc)"></i>Heures creuses</span></div>
      <div class="chart" id="chart"><svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Consommation par jour">${grid}${bars}</svg><div class="tip hidden" id="tip"></div></div>
      <details><summary>Voir le tableau</summary><table class="data"><thead><tr><th>Jour</th><th>Pleines (kWh)</th><th>Creuses (kWh)</th><th>Coût</th></tr></thead><tbody>${table}</tbody></table></details>
    </div>
    <div class="card"><h2 class="sec" style="margin-top:0">Par pièce</h2><div class="rlist">${roomsList}</div>
      ${missing.length ? `<p class="help">Rien de mesuré pour : ${esc(missing.join(", "))} (éteint sur la période).</p>` : ""}</div>
    <p class="help">Coûts calculés par Cozytouch avec ton tarif. Les chiffres du jour arrivent souvent avec un jour de décalage.</p>`;
}

// ---------- Feuilles (fenêtres du bas)
let sheetEl = null, scrimEl = null, sheetOnClose = null;
function openSheet(html, onBind, onClose) {
  closeSheet(true);
  scrimEl = document.createElement("div"); scrimEl.className = "scrim";
  sheetEl = document.createElement("div"); sheetEl.className = "sheet"; sheetEl.setAttribute("role", "dialog"); sheetEl.setAttribute("aria-modal", "true");
  sheetEl.innerHTML = `<div class="grab"></div><button class="iconbtn close" data-close aria-label="Fermer">${I.close}</button>${html}`;
  document.body.append(scrimEl, sheetEl);
  requestAnimationFrame(() => { scrimEl.classList.add("show"); sheetEl.classList.add("show"); });
  scrimEl.onclick = () => closeSheet();
  sheetEl.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeSheet(); });
  sheetOnClose = onClose || null;
  onBind && onBind(sheetEl);
  setTimeout(() => sheetEl?.querySelector("[data-close]")?.focus(), 50);
}
function closeSheet(instant) {
  if (!sheetEl) return;
  const s = sheetEl, sc = scrimEl, cb = sheetOnClose;
  sheetEl = scrimEl = sheetOnClose = null;
  cb && cb();
  if (instant) { s.remove(); sc.remove(); return; }
  s.classList.remove("show"); sc.classList.remove("show");
  setTimeout(() => { s.remove(); sc.remove(); }, 260);
}
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });

// Fiche d'une pièce
function openRoom(id) {
  let pendingTarget = null, timer = null;
  const draw = () => {
    const r = roomById(id); if (!r) return "";
    const t = pendingTarget ?? r.target;
    const nx = r.prog && !r.override ? nextChange(r) : null;
    return `<h3>${esc(r.name)}</h3><p class="muted" style="margin:0">${esc(r.model)}${r.watts ? `, ${r.watts} W` : ""}</p>
      <div class="big-temp"><span class="now">${r.temp != null ? deg(r.temp) + "°" : "–"}</span><span class="muted">dans la pièce<br>${r.tempAt ? "mesuré " + ago(nowS() - r.tempAt) : ""}</span></div>
      <div class="switch"><span>${r.on ? "Allumé" : "Éteint"}</span><button class="toggle" role="switch" aria-checked="${r.on}" aria-label="Allumer ou éteindre" data-r="power"></button></div>
      ${r.on ? `
      <div class="stepper"><button data-r="minus" aria-label="Baisser la consigne">−</button>
        <div class="val"><b class="num">${deg(t)}°</b><span class="muted">${pendingTarget != null ? "envoi dans un instant…" : r.override ? `dérogation, encore ${duration(r.overrideLeft || r.overrideTotal)}` : "consigne"}</span></div>
        <button data-r="plus" aria-label="Monter la consigne">+</button></div>
      ${r.prog && !r.override ? `<p class="help">En programme, changer la consigne crée une dérogation de ${duration(r.overrideTotal)}, puis le programme reprend.</p>` : ""}
      <div class="seg" role="group" aria-label="Mode"><button aria-pressed="${!r.prog}" data-r="manual">Manuel</button><button aria-pressed="${r.prog}" data-r="prog">Programme</button></div>
      ${nx ? `<p class="help">Programme : passe en ${LEVELS[nx.level]?.label.toLowerCase()} (${deg(r.levels[nx.level])}°) à ${hhmm(nx.min)}${nx.k ? (nx.k === 1 ? " demain" : " " + DAYS[nx.day].toLowerCase()) : ""}.</p>` : ""}
      ${r.override ? `<button class="btn block" data-r="cancel-override">Reprendre le programme maintenant</button><p></p>` : ""}
      <button class="btn primary block" data-r="boost">${I.boost}Coup de chaud : +${cfg.boost.delta}° pendant ${duration(cfg.boost.minutes)}</button>
      ` : `<p class="help">Éteint depuis ${r.powerAt ? dateFr(r.powerAt) : "un moment"}.</p>`}
      <p></p><button class="btn block" data-r="planning">Voir le planning</button>`;
  };
  const rebind = (el) => {
    el.querySelectorAll("[data-r]").forEach((b) => b.addEventListener("click", () => act(b.dataset.r)));
  };
  const redraw = () => { if (!sheetEl) return; const keep = sheetEl.querySelector(".close").outerHTML; sheetEl.innerHTML = `<div class="grab"></div>${keep}${draw()}`; rebind(sheetEl); };
  const flushTarget = () => {
    if (pendingTarget == null) return;
    const r = roomById(id); const t = pendingTarget; pendingTarget = null;
    if (Math.abs(t - r.target) < 0.01) { redraw(); return; }
    runJob(`${r.name} : consigne ${deg(t)}°`, writesTarget(r, t));
    redraw();
  };
  const act = (a) => {
    const r = roomById(id);
    if (a === "power") { runJob(`${r.name} : ${r.on ? "extinction" : "allumage"}`, writesPower(r, !r.on)); return; }
    if (a === "minus" || a === "plus") {
      const base = pendingTarget ?? r.target ?? 19;
      pendingTarget = clampT(r, base + (a === "plus" ? r.step : -r.step));
      clearTimeout(timer); timer = setTimeout(flushTarget, 1300); redraw(); return;
    }
    if (a === "manual" && r.prog) runJob(`${r.name} : mode manuel`, writesMode(r, false));
    if (a === "prog" && !r.prog) runJob(`${r.name} : programme`, writesMode(r, true));
    if (a === "cancel-override") runJob(`${r.name} : retour au programme`, writesCancelOverride(r));
    if (a === "boost") {
      const t = clampT(r, Math.max(r.target ?? 19, r.temp ?? 0) + cfg.boost.delta);
      runJob(`${r.name} : ${deg(t)}° pendant ${duration(cfg.boost.minutes)}`, writesOverride(r, t, cfg.boost.minutes));
    }
    if (a === "planning") { S.planRoom = id; setTab("plan"); closeSheet(); }
  };
  openSheet(draw(), rebind, () => { clearTimeout(timer); roomSheetRedraw = null; flushTarget(); });
  sheetEl.dataset.kind = "room";
  roomSheetRedraw = redraw;
}
let roomSheetRedraw = null;

// Éditeur d'une journée du planning
function openDay(roomId, di) {
  const r = roomById(roomId);
  let pts = r.week[di].map((p) => ({ ...p }));
  const also = new Set();
  const draw = () => `<h3>${DAYS[di]}</h3><p class="muted" style="margin:0">${esc(r.name)}</p>
    <p class="help">Chaque ligne indique l'heure où la pièce passe dans un niveau. Jusqu'à 10 changements par jour.</p>
    <div id="slots">${pts.map((p, i) => `<div class="slot"><input type="time" step="900" value="${hhmm(p.min)}" data-i="${i}" data-k="min" aria-label="Heure">
      <select data-i="${i}" data-k="level" aria-label="Niveau">${[1, 2, 3].map((k) => `<option value="${k}" ${p.level === k ? "selected" : ""}>${LEVELS[k].label} (${deg(r.levels[k])}°)</option>`).join("")}</select>
      <button class="iconbtn" data-del="${i}" aria-label="Supprimer">${I.trash}</button></div>`).join("")}</div>
    ${pts.length < 10 ? `<button class="btn block" data-add>Ajouter un horaire</button>` : ""}
    <p class="help" style="margin-top:16px">Appliquer aussi à :</p>
    <div class="daypick">${DAYS_SHORT.map((d, k) => k === di ? "" : `<label><input type="checkbox" data-also="${k}" ${also.has(k) ? "checked" : ""}>${d}</label>`).join("")}</div>
    <p></p><button class="btn primary block" data-save>Enregistrer</button>`;
  const bind = (el) => {
    el.querySelectorAll("[data-k]").forEach((inp) => inp.addEventListener("change", () => {
      const i = +inp.dataset.i;
      if (inp.dataset.k === "min") { const [h, m] = inp.value.split(":").map(Number); pts[i].min = (h || 0) * 60 + (m || 0); }
      else pts[i].level = +inp.value;
    }));
    el.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => { pts.splice(+b.dataset.del, 1); redraw(); }));
    el.querySelector("[data-add]")?.addEventListener("click", () => {
      const last = pts.length ? Math.max(...pts.map((p) => p.min)) : 360;
      pts.push({ min: Math.min(1425, last + 60), level: 1 }); redraw();
    });
    el.querySelectorAll("[data-also]").forEach((c) => c.addEventListener("change", () => { c.checked ? also.add(+c.dataset.also) : also.delete(+c.dataset.also); }));
    el.querySelector("[data-save]").addEventListener("click", () => {
      const mins = pts.map((p) => p.min);
      if (new Set(mins).size !== mins.length) { alert("Deux lignes ont la même heure."); return; }
      const value = serializeDay(pts);
      const days = [di, ...[...also].sort()];
      const writes = days.map((k) => W(r, DAY_IDS[k], value)).filter((w, idx) => !sameValue(w.capabilityId, r.weekRaw[days[idx]], w.value));
      closeSheet();
      if (!writes.length) return;
      runJob(`${r.name} : planning ${days.map((k) => DAYS_SHORT[k]).join(", ")}`, writes);
    });
  };
  const redraw = () => { if (!sheetEl) return; const keep = sheetEl.querySelector(".close").outerHTML; sheetEl.innerHTML = `<div class="grab"></div>${keep}${draw()}`; bind(sheetEl); };
  openSheet(draw(), bind);
}

// Réglage d'une température de niveau (confort / éco / nuit)
function openLevel(roomId, k) {
  const r = roomById(roomId);
  let t = r.levels[k] ?? 19;
  const draw = () => `<h3>${LEVELS[k].label}</h3><p class="muted" style="margin:0">${esc(r.name)}</p>
    <div class="stepper"><button data-m aria-label="Baisser">−</button><div class="val"><b class="num">${deg(t)}°</b><span class="muted">température ${LEVELS[k].label.toLowerCase()}</span></div><button data-p aria-label="Monter">+</button></div>
    <button class="btn primary block" data-save>Enregistrer</button>`;
  const bind = (el) => {
    el.querySelector("[data-m]").onclick = () => { t = clampT(r, t - r.step); redraw(); };
    el.querySelector("[data-p]").onclick = () => { t = clampT(r, t + r.step); redraw(); };
    el.querySelector("[data-save]").onclick = () => {
      let second = 0; try { second = JSON.parse(r.levelsRaw[k])[1] ?? 0; } catch { /* rien */ }
      closeSheet();
      runJob(`${r.name} : ${LEVELS[k].label.toLowerCase()} à ${deg(t)}°`, [W(r, LEVELS[k].cap, JSON.stringify([t, second]))]);
    };
  };
  const redraw = () => { if (!sheetEl) return; const keep = sheetEl.querySelector(".close").outerHTML; sheetEl.innerHTML = `<div class="grab"></div>${keep}${draw()}`; bind(sheetEl); };
  openSheet(draw(), bind);
}

function openCopyPlan(roomId) {
  const src = roomById(roomId);
  const others = rooms().filter((r) => r.id !== roomId && r.hasSchedule);
  const sel = new Set();
  openSheet(`<h3>Copier le planning</h3><p class="muted" style="margin:0">De ${esc(src.name)} vers :</p>
    <div class="daypick">${others.map((r) => `<label><input type="checkbox" data-to="${r.id}">${esc(r.name)}</label>`).join("")}</div>
    <label class="daypick"><label><input type="checkbox" data-levels checked>Copier aussi les températures</label></label>
    <button class="btn primary block" data-go>Copier</button>`, (el) => {
    el.querySelectorAll("[data-to]").forEach((c) => c.onchange = () => c.checked ? sel.add(+c.dataset.to) : sel.delete(+c.dataset.to));
    el.querySelector("[data-go]").onclick = () => {
      const withLevels = el.querySelector("[data-levels]").checked;
      closeSheet();
      for (const id of sel) {
        const dst = roomById(id);
        const writes = DAY_IDS.map((cap, k) => W(dst, cap, serializeDay(src.week[k]))).filter((w, k) => !sameValue(w.capabilityId, dst.weekRaw[k], w.value));
        if (withLevels) for (const lv of [1, 2, 3]) if (src.levelsRaw[lv] && !sameValue(LEVELS[lv].cap, dst.levelsRaw[lv], src.levelsRaw[lv])) writes.push(W(dst, LEVELS[lv].cap, src.levelsRaw[lv]));
        runJob(`${dst.name} : planning copié`, writes);
      }
    };
  });
}

function openVacation() {
  const d = new Date(Date.now() + 7 * 86400000); d.setHours(17, 0, 0, 0);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const absT = rooms()[0]?.caps[C.ABSENCE_T]?.value;
  openSheet(`<h3>Vacances</h3><p class="help">Toute la maison passe en hors-gel${absT ? ` (${deg(num(absT))}°)` : ""} dès maintenant, puis le chauffage reprend son programme à ton retour.</p>
    <label class="field"><span>Retour le</span><input type="datetime-local" id="ret" value="${local}"></label>
    <p class="help">Astuce : mets l'heure de retour quelques heures avant ton arrivée, la maison aura le temps de chauffer.</p>
    <button class="btn primary block" data-go>Partir en vacances</button>`, (el) => {
    el.querySelector("[data-go]").onclick = async () => {
      const end = Math.floor(new Date(el.querySelector("#ret").value).getTime() / 1000);
      if (!end || end <= nowS() + 600) { alert("Choisis une date de retour dans le futur."); return; }
      closeSheet();
      await absenceJob("Mode vacances", nowS(), end);
    };
  });
}
async function absenceJob(label, start, end) {
  const job = { id: jobSeq++, label, writes: [], status: "sending", detail: "Envoi…" };
  S.jobs.push(job); renderJobs();
  try {
    await api("absence", "POST", { start, end });
    job.status = "done"; job.detail = start ? `Jusqu'au ${dateFr(end)}` : "Arrêté, le programme reprend";
    await refresh({ quiet: true });
    setTimeout(() => dismissJob(job.id), 3500);
  } catch (e) { job.status = "failed"; job.detail = e.message; }
  renderJobs(); render();
}

function openSettings() {
  openSheet(`<h3>Réglages</h3>
    <label class="field"><span>Adresse du relais</span><input id="s-url" type="url" placeholder="https://xxxx.supabase.co/functions/v1/chauffage" value="${esc(cfg.url)}" autocomplete="off"></label>
    <label class="field"><span>Code d'accès</span><input id="s-code" type="password" value="${esc(cfg.code)}" autocomplete="current-password"></label>
    <div class="switch"><span>Mode démo</span><button class="toggle" role="switch" aria-checked="${cfg.demo}" id="s-demo"></button></div>
    ${cfg.demo ? `<div class="switch"><span>Simuler une box figée</span><button class="toggle" role="switch" aria-checked="${!!cfg.demoStuck}" id="s-stuck"></button></div>` : ""}
    <h2 class="sec">Télétravail</h2>
    <div class="row"><label class="field"><span>Pièce</span><select id="s-wroom">${rooms().map((r) => `<option ${r.name === cfg.work.room ? "selected" : ""}>${esc(r.name)}</option>`).join("")}</select></label>
      <label class="field"><span>Température</span><input id="s-wtemp" type="number" step="0.5" min="12" max="26" value="${cfg.work.temp}"></label>
      <label class="field"><span>Heures</span><input id="s-whours" type="number" min="1" max="12" value="${cfg.work.hours}"></label></div>
    <h2 class="sec">Coup de chaud</h2>
    <div class="row"><label class="field"><span>Degrés en plus</span><input id="s-bdelta" type="number" step="0.5" min="0.5" max="5" value="${cfg.boost.delta}"></label>
      <label class="field"><span>Durée (min)</span><input id="s-bmin" type="number" step="15" min="15" max="240" value="${cfg.boost.minutes}"></label></div>
    <label class="field"><span>Alerte si plus de nouvelles des radiateurs depuis (heures)</span><input id="s-stale" type="number" min="1" max="24" value="${cfg.staleHours}"></label>
    <button class="btn primary block" data-save>Enregistrer</button>`, (el) => {
    const tog = (id) => el.querySelector(id)?.addEventListener("click", (e) => { const b = e.currentTarget; b.setAttribute("aria-checked", b.getAttribute("aria-checked") !== "true"); });
    tog("#s-demo"); tog("#s-stuck");
    el.querySelector("[data-save]").onclick = () => {
      const wasDemo = cfg.demo;
      cfg.url = el.querySelector("#s-url").value.trim();
      cfg.code = el.querySelector("#s-code").value;
      cfg.demo = el.querySelector("#s-demo").getAttribute("aria-checked") === "true";
      if (el.querySelector("#s-stuck")) cfg.demoStuck = el.querySelector("#s-stuck").getAttribute("aria-checked") === "true";
      cfg.work = { room: el.querySelector("#s-wroom").value || cfg.work.room, temp: +el.querySelector("#s-wtemp").value || 20, hours: +el.querySelector("#s-whours").value || 8 };
      cfg.boost = { delta: +el.querySelector("#s-bdelta").value || 2, minutes: +el.querySelector("#s-bmin").value || 60 };
      cfg.staleHours = +el.querySelector("#s-stale").value || 3;
      store.set("cfg", cfg);
      closeSheet();
      if (wasDemo !== cfg.demo) { S.setup = null; S.conso = null; S.fetchedAt = 0; store.del("lastState"); }
      render(); refresh();
    };
  });
}

// ---------- Accueil (premier lancement)
function welcomeView() {
  return `<div class="wrap welcome"><h1>Chauffage</h1>
    <p>Relie l'appli à ton relais Supabase pour piloter tes radiateurs.</p>
    <label class="field"><span>Adresse du relais</span><input id="w-url" type="url" placeholder="https://xxxx.supabase.co/functions/v1/chauffage" autocomplete="off"></label>
    <label class="field"><span>Code d'accès</span><input id="w-code" type="password" autocomplete="current-password"></label>
    <p id="w-err" class="help" style="color:var(--alert)"></p>
    <button class="btn primary block" id="w-go">Se connecter</button><p></p>
    ${window.DEMO ? `<button class="btn block" id="w-demo">Essayer avec les données de démo</button>` : ""}</div>`;
}
function bindWelcome() {
  $("#w-go").onclick = async () => {
    cfg.url = $("#w-url").value.trim(); cfg.code = $("#w-code").value; cfg.demo = false;
    $("#w-err").textContent = "Connexion…";
    try { await api("state"); store.set("cfg", cfg); render(); refresh(); }
    catch (e) { $("#w-err").textContent = e.message; cfg.url = ""; }
  };
  if ($("#w-demo")) $("#w-demo").onclick = () => { cfg.demo = true; store.set("cfg", cfg); render(); refresh(); };
}

// ---------- Actions globales
function setTab(t) { S.tab = t; store.set("tab", t); render(); window.scrollTo(0, 0); if (t === "conso" && S.conso == null) loadConso(); }

document.addEventListener("click", (e) => {
  if (sheetEl && sheetEl.contains(e.target)) return;
  const t = e.target.closest("[data-tab],[data-room],[data-act],[data-plan-room],[data-day],[data-level],[data-retry],[data-dismiss]");
  if (!t) return;
  if (t.dataset.tab) return setTab(t.dataset.tab);
  if (t.dataset.room) return openRoom(+t.dataset.room);
  if (t.dataset.planRoom) { S.planRoom = +t.dataset.planRoom; return render(); }
  if (t.dataset.day) return openDay(S.planRoom, +t.dataset.day);
  if (t.dataset.level) return openLevel(S.planRoom, +t.dataset.level);
  if (t.dataset.retry) return retryJob(+t.dataset.retry);
  if (t.dataset.dismiss) return dismissJob(+t.dataset.dismiss);
  const a = t.dataset.act;
  const rs = rooms();
  if (a === "refresh") refresh();
  if (a === "settings") openSettings();
  if (a === "conso-retry") { S.consoError = null; S.conso = null; render(); }
  if (a === "all-on") {
    const writes = rs.flatMap((r) => [...(!r.on ? writesPower(r, true) : []), ...(!r.prog ? [W(r, C.PROG, "1")] : [])]);
    if (!writes.length) return toast("Tout est déjà allumé en programme");
    runJob("Tout allumer (programme)", writes);
  }
  if (a === "all-off") {
    const on = rs.filter((r) => r.on);
    if (!on.length) return toast("Tout est déjà éteint");
    if (confirm(`Éteindre ${on.map((r) => r.name).join(", ")} ?`)) runJob("Tout éteindre", on.flatMap((r) => writesPower(r, false)));
  }
  if (a === "work") {
    const r = rs.find((x) => x.name.toLowerCase() === String(cfg.work.room).toLowerCase());
    if (r) runJob(`Télétravail : ${r.name} à ${deg(cfg.work.temp)}° pendant ${cfg.work.hours} h`, writesOverride(r, clampT(r, cfg.work.temp), cfg.work.hours * 60));
  }
  if (a === "vacation") openVacation();
  if (a === "absence-stop") absenceJob("Fin du mode vacances", null, null);
  if (a === "copy-plan") openCopyPlan(S.planRoom);
  if (a === "plan-enable") { const r = roomById(S.planRoom); runJob(`${r.name} : programme`, [...(!r.on ? writesPower(r, true) : []), ...writesMode(r, true)]); }
});

// Infobulle du graphique (toucher ou survol)
function chartTip(e) {
  const g = e.target.closest?.("g.b"); const tip = $("#tip"); const ch = $("#chart");
  if (!tip || !ch) return;
  if (!g) { tip.classList.add("hidden"); return; }
  const svg = ch.querySelector("svg"); const k = svg.getBoundingClientRect().width / 320;
  tip.textContent = g.dataset.tip; tip.classList.remove("hidden");
  tip.style.left = (+g.dataset.x * k) + "px"; tip.style.top = Math.max(20, +g.dataset.y * k) + "px";
}
document.addEventListener("pointermove", chartTip);
document.addEventListener("pointerdown", chartTip);

function toast(msg) {
  const job = { id: jobSeq++, label: msg, writes: [], status: "done", detail: "" };
  S.jobs.push(job); renderJobs(); setTimeout(() => dismissJob(job.id), 2500);
}

// Après chaque rendu, la fiche ouverte se met à jour avec les nouvelles données
const _render = render;
render = function () { _render(); if (roomSheetRedraw && sheetEl && sheetEl.dataset.kind === "room") roomSheetRedraw(); };

// ---------- Démarrage
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
render();
if (cfg.demo || cfg.url) refresh();
setInterval(() => { if (document.visibilityState === "visible" && (cfg.demo || cfg.url) && !S.jobs.some((j) => j.status === "verifying")) refresh({ quiet: true }); }, 60000);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && (cfg.demo || cfg.url)) refresh({ quiet: true }); });
})();
