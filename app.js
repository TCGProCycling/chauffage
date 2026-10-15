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
const APP_VERSION = "5.2";

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
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15"/><path d="M5 19l7-7"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  thermo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0z"/></svg>',
  trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
};

// ---------- Stockage local (protégé : peut être indisponible)
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* rien */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* rien */ } },
};

const DEFAULT_CFG = { url: "", code: "", demo: false, staleHours: 24,
  work: { room: "Bureau", temp: 20, until: "18:00", base: 17 }, boost: { delta: 2, minutes: 60 },
  hc: "01:04-07:04, 14:04-16:04", tarif: { name: "Engie", hp: 0.23612, hc: 0.17514, abo: 238.6 }, optimAt: null,
  place: { name: "Rezé", lat: 47.1797, lon: -1.5494 } };
let cfg = Object.assign({}, DEFAULT_CFG, store.get("cfg", {}));
cfg.work = Object.assign({}, DEFAULT_CFG.work, cfg.work);
cfg.boost = Object.assign({}, DEFAULT_CFG.boost, cfg.boost);
cfg.place = Object.assign({}, DEFAULT_CFG.place, cfg.place);
cfg.tarif = Object.assign({}, DEFAULT_CFG.tarif, cfg.tarif);
if (!cfg.staleHours || cfg.staleHours === 3) cfg.staleHours = 24; // les radiateurs au repos envoient rarement leur température

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
      // Cozytouch laisse parfois « indisponible » sur un radiateur qui répond très bien (après un réappairage) :
      // on ne le dit injoignable que s'il n'a rien envoyé depuis 3 h
      available: d.isAvailable !== false || (rad && rad.isAvailable !== false) ||
        nowS() - Math.max(0, ...[...(d.capabilities || []), ...(rad?.capabilities || [])].map((x) => x.modificationDate || 0)) < 3 * 3600,
      name: v(C.NAME) || d.name,
      model: rad ? rad.longName : "",
      watts: rc[C.POWER_W] ? num(rc[C.POWER_W].value) : null,
      // Température masquée si la dernière mesure est trop ancienne
      // 0° (ou une valeur absurde) = le radiateur n'envoie pas de mesure, pas une vraie température
      lastTemp: tempOk && num(v(C.TEMP)) > 0.5 && num(v(C.TEMP)) < 45 ? num(v(C.TEMP)) : null,
      tempAt: c[C.TEMP]?.modificationDate || 0,
      get temp() { return this.tempAt && nowS() - this.tempAt < cfg.staleHours * 3600 ? this.lastTemp : null; },
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
    if (action.startsWith("history")) return this.history();
    if (action === "bilan") return { ok: true, bilan: this.history().bilan };
    if (["ack", "config", "subscribe", "unsubscribe"].includes(action)) return { ok: true };
    throw new Error("Action inconnue");
  },
  // Historique simulé à partir de tes vrais plannings (14 jours, un relevé toutes les 15 minutes)
  history() {
    if (this.hist) return this.hist;
    const rs = rooms();
    const mesures = [], jours = new Map();
    const t0 = Math.floor(nowS() / 900) * 900 - 14 * 86400;
    const state = new Map(rs.map((r) => [r.name, 17]));
    for (let t = t0; t <= nowS(); t += 900) {
      const d = new Date(t * 1000);
      const di = (d.getDay() + 6) % 7, min = d.getHours() * 60 + d.getMinutes();
      const outdoor = 9 + 4 * Math.sin((min - 540) / 1440 * 2 * Math.PI) - (t - t0) / 86400 * 0.25;
      const day = dayKey(t);
      for (const r of rs) {
        const target = r.on ? (r.levels[levelAt(r, di, min)] ?? r.target ?? 17) : null;
        let temp = state.get(r.name);
        const heating = target != null && temp < target - 0.1;
        const rate = /bain/i.test(r.name) ? 2.2 : /bureau/i.test(r.name) ? 1.1 : 1.4;
        const loss = /bureau/i.test(r.name) ? 0.07 : 0.03;
        temp = heating ? temp + rate * 0.25 : temp - loss * (temp - outdoor) * 0.25;
        state.set(r.name, temp);
        mesures.push({ at: new Date(t * 1000).toISOString(), room: r.name, temp: Math.round(temp * 10) / 10, temp_at: null, target, heating, is_on: r.on, prog: r.prog, outdoor: Math.round(outdoor * 10) / 10 });
        if (heating) {
          const j = jours.get(day + r.name) || { day, room: r.name, kwh: 0, cost: 0, kwh_hp: 0, kwh_hc: 0, kwh_night: null };
          const kwh = (r.watts || 1000) / 1000 * 0.25;
          j.kwh += kwh; if (isHC(min)) { j.kwh_hc += kwh; j.cost += kwh * cfg.tarif.hc; } else { j.kwh_hp += kwh; j.cost += kwh * cfg.tarif.hp; }
          jours.set(day + r.name, j);
        }
      }
    }
    const today = dayKey(nowS());
    const days = [...new Set([...jours.values()].map((j) => j.day))].filter((d) => d < today);
    for (const day of days) {
      const rad = [...jours.values()].filter((j) => j.day === day).reduce((a, j) => a + j.kwh, 0);
      const kwh = rad + 7.5;
      jours.set(day + HOUSE, { day, room: HOUSE, kwh, cost: null, kwh_hp: kwh * 0.66, kwh_hc: kwh * 0.34, kwh_night: kwh * 0.27 });
    }
    const list = [...jours.values()].filter((j) => j.day < today).sort((a, b) => a.day < b.day ? -1 : 1);
    const week = list.filter((j) => j.room !== HOUSE && j.day >= dayKey(nowS() - 7 * 86400));
    const kwh = week.reduce((a, j) => a + j.kwh, 0), cost = week.reduce((a, j) => a + j.cost, 0);
    this.hist = { mesures, jours: list, alertes: [{ key: "demo", at: new Date(Date.now() - 2 * 86400000).toISOString(), message: "Bureau n'arrive pas à chauffer : Le radiateur chauffe depuis 2 h mais la pièce reste à 16,2° pour 20° demandés. Fenêtre ouverte ?" }],
      bilan: { date: today, lines: [`Cette semaine : ${nf1.format(kwh)} kWh, ${nf2.format(cost)} € (exemple calculé sur un historique simulé).`, "Pièce la plus gourmande : Salle de bain."] } };
    return this.hist;
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
    loadFaults();
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

// ---------- Défauts signalés par les radiateurs
let faultsAt = 0;
async function loadFaults(force = false) {
  if (!force && Date.now() - faultsAt < 30 * 60000) return;
  faultsAt = Date.now();
  if (cfg.demo) {
    // En démo : lecture directe des codes, sans libellé
    const out = [];
    for (const d of S.setup?.devices || []) {
      const c = capsOf(d);
      for (const id of [150, 290, 303]) {
        try {
          for (const row of JSON.parse(c[id]?.value || "[]")) if (row.some((x) => x) && !row.includes(255) && !out.some((o) => o.deviceId === d.deviceId && o.code === row.slice(0, 4).join(".")))
            out.push({ deviceId: d.deviceId, name: c[C.NAME]?.value || d.longName || d.name, code: row.slice(0, 4).join("."), since: c[id].modificationDate });
        } catch { /* rien */ }
      }
    }
    S.faults = out; render(); return;
  }
  try { const d = await api("faults"); S.faults = d.faults || []; render(); }
  catch { faultsAt = 0; /* relais pas encore à jour : on réessaiera */ }
}
let faultAcks = store.get("faultAcks", []);
const faultKey = (f) => `${f.name}|${f.code}`;
const isAcked = (f) => faultAcks.includes(faultKey(f)) || (S.faults || []).some((g) => g.code === f.code && faultAcks.includes(faultKey(g)));
// La CozyBox recopie souvent le défaut d'un radiateur : on n'affiche qu'une fois chaque code
function faultsList() {
  const seen = new Set();
  const list = [...(S.faults || [])].sort((a, b) => (rooms().some((r) => r.id === b.deviceId) ? 1 : 0) - (rooms().some((r) => r.id === a.deviceId) ? 1 : 0));
  return list.filter((f) => !isAcked(f)).filter((f) => { const k = f.code; if (seen.has(k)) return false; seen.add(k); return true; })
    .map((f) => ({ ...f, room: rooms().find((r) => r.id === f.deviceId) }));
}

// ---------- Heures creuses
function parseHC(str) {
  const out = [];
  for (const part of String(str || "").split(/[,;]/)) {
    const m = part.match(/(\d{1,2})[h:](\d{2})?\s*(?:-|à|a)\s*(\d{1,2})[h:](\d{2})?/i);
    if (m) out.push([+m[1] * 60 + +(m[2] || 0), +m[3] * 60 + +(m[4] || 0)]);
  }
  return out;
}
function isHC(min) {
  return parseHC(cfg.hc).some(([a, b]) => (a <= b ? min >= a && min < b : min >= a || min < b));
}
const hcText = () => parseHC(cfg.hc).map(([a, b]) => `${hhmm(a)} à ${hhmm(b)}`).join(" et ");

// ---------- Météo (Open-Meteo, gratuit, sans clé)
async function loadWeather() {
  const c = store.get("weather", null);
  if (c && Date.now() - c.at < 30 * 60000 && c.lat === cfg.place.lat) { S.weather = c; return; }
  try {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${cfg.place.lat}&longitude=${cfg.place.lon}` +
      "&current=temperature_2m&daily=temperature_2m_mean,temperature_2m_min,temperature_2m_max&past_days=92&forecast_days=3&timezone=Europe%2FParis";
    const r = await fetch(u);
    const d = await r.json();
    const daily = {};
    (d.daily?.time || []).forEach((t, i) => { daily[t] = { mean: d.daily.temperature_2m_mean[i], min: d.daily.temperature_2m_min[i], max: d.daily.temperature_2m_max[i] }; });
    S.weather = { at: Date.now(), lat: cfg.place.lat, now: d.current?.temperature_2m, daily };
    store.set("weather", S.weather);
  } catch { /* météo facultative */ }
  render();
}
const dayKey = (ts) => { const d = new Date(ts * 1000); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

// ---------- Linky (via le relais)
async function loadLinky(force = false) {
  const c = store.get("linky", null);
  if (!force && c && Date.now() - c.at < 6 * 3600000) { S.linky = c.data; return; }
  if (cfg.demo) { S.linky = { configured: false, demo: true }; return; }
  try {
    const d = await api("linky" + (force ? "&force=1" : ""));
    S.linky = d; S.linkyError = null;
    if (d.configured && d.daily?.length) store.set("linky", { at: Date.now(), data: d }); else store.del("linky"); // pas de mémoire tant que Linky n'est pas branché
  } catch (e) { S.linkyError = e.message; }
  if (S.tab === "conso") render();
}
function linkySplit(curve) {
  let hp = 0, hc = 0;
  for (const p of curve || []) {
    const end = new Date(p.end.replace(" ", "T"));
    const step = p.step || 30;
    const start = new Date(end.getTime() - step * 60000);
    const kwh = (p.w || 0) * step / 60 / 1000;
    if (isHC(start.getHours() * 60 + start.getMinutes() + step / 2)) hc += kwh; else hp += kwh;
  }
  return { hp, hc };
}

// ---------- Conseils heures creuses
// Règle 1 : un passage en confort peu après la fin des heures creuses → avancer la montée en température dans les heures creuses.
// Règle 2 : une pièce en éco pendant les heures creuses de l'après-midi, qui repasse en confort en fin de journée → relance pendant les heures creuses.
function recommendations(room) {
  const hcs = parseHC(cfg.hc);
  const recos = [];
  if (!room.hasSchedule || !hcs.length) return recos;
  for (const [hcStart, hcEnd] of hcs) {
    // Règle 1 (heures creuses du matin seulement : on avance le réveil de la pièce)
    const r1 = { room, kind: "early", hcEnd, days: [], from: null };
    if (hcEnd < 11 * 60) {
    room.week.forEach((pts, di) => {
      const p = pts.find((x) => x.level === 1 && x.min > hcEnd && x.min <= hcEnd + 90);
      if (p && !pts.some((x) => x.min >= hcEnd - 30 && x.min < p.min && x.level === 1)) { r1.days.push(di); r1.from = p.min; }
    });
    if (r1.days.length) {
      r1.to = hcEnd - 30;
      r1.title = `${room.name} : démarrer le confort à ${hhmm(r1.to)} au lieu de ${hhmm(r1.from)}`;
      r1.text = `La montée en température est le moment qui consomme le plus. En la commençant avant ${hhmm(hcEnd)}, elle se fait au tarif heures creuses.`;
      recos.push(r1);
    }
    }
    // Règle 2 (créneau d'après-midi seulement)
    if (hcStart >= 11 * 60 && hcEnd <= 18 * 60) {
      const r2 = { room, kind: "boost", hcStart, hcEnd, days: [] };
      room.week.forEach((pts, di) => {
        const lvlIn = levelAt(room, di, hcStart + 30);
        const next = pts.find((x) => x.level === 1 && x.min > hcEnd && x.min <= 19 * 60 + 30);
        if (lvlIn !== 1 && next && !pts.some((x) => x.min >= hcStart && x.min < hcEnd)) { r2.days.push(di); r2.back = lvlIn; r2.next = next.min; }
      });
      if (r2.days.length) {
        r2.title = `${room.name} : relance douce de ${hhmm(hcEnd - 60)} à ${hhmm(hcEnd)}`;
        r2.text = `La pièce repasse en confort à ${hhmm(r2.next)}. Une heure de confort en heures creuses juste avant préchauffe les murs, la remontée du soir sera plus courte. À tester une semaine et à comparer.`;
        recos.push(r2);
      }
    }
  }
  return recos;
}
function applyReco(r) {
  const room = roomById(r.room.id);
  const writes = [];
  for (const di of r.days) {
    let pts = room.week[di].map((p) => ({ ...p }));
    if (r.kind === "early") {
      const p = pts.find((x) => x.level === 1 && x.min === r.from);
      if (p) p.min = r.to;
    } else {
      pts.push({ min: r.hcEnd - 60, level: 1 }, { min: r.hcEnd, level: r.back || 2 });
    }
    pts = pts.sort((a, b) => a.min - b.min).filter((p, i, a) => i === 0 || p.min !== a[i - 1].min);
    if (pts.length > 10) continue;
    writes.push(W(room, DAY_IDS[di], serializeDay(pts)));
  }
  if (writes.length) runJob(`${room.name} : conseil appliqué`, writes);
}
function recoCard(list) {
  if (!list.length) return "";
  return list.map((r, i) => `<div class="reco"><b>${esc(r.title)}</b><p class="help">${esc(r.text)} Jours concernés : ${r.days.map((d) => DAYS_SHORT[d]).join(", ")}.</p>
    <button class="btn" data-reco="${i}">Appliquer au planning</button></div>`).join("");
}

// ---------- Commandes : envoi, nouvelles tentatives, puis vérification sur les radiateurs
let jobSeq = 1;
const SKIP_VERIFY = new Set([C.OVERRIDE_TOTAL, C.OVERRIDE_LEFT]);
function sameValue(cap, a, b) {
  if (a == null) return false;
  if (DAY_IDS.includes(cap)) {
    const norm = (v) => { const pts = parseDay(v); return JSON.stringify(pts.filter((p, i) => i === 0 || p.level !== pts[i - 1].level)); };
    try { return norm(a) === norm(b); } catch { return a === b; }
  }
  if ([C.COMFORT_T, C.ECO_T, C.NIGHT_T].includes(cap)) {
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
      const bad = (res.results || []).filter((r) => !r.ok);
      const okCount = (res.results || []).length - bad.length;
      const what = bad.map((b) => CAP_LABEL[b.capabilityId] || `réglage ${b.capabilityId}`).join(", ");
      const why = (bad[0]?.reason || "").replace(/^refus /, "");
      throw new Error(`Cozytouch a refusé ${what}${why ? ` (${why})` : ""}${okCount ? `, le reste est passé` : ""}.`);
    }
    job.status = "verifying"; job.detail = "Envoyé, vérification sur les radiateurs…"; renderJobs();
    for (const wait of [4000, 10000, 25000, 45000]) {
      await sleep(wait);
      await refresh({ quiet: true });
      if (verify(writes)) { job.status = "done"; job.detail = "Appliqué"; break; }
    }
    // Réglages non pris : on les renvoie seuls, une fois, en douceur
    if (job.status !== "done") {
      const missing = writes.filter((w) => !verify([w]));
      if (missing.length && missing.length < writes.length + 1) {
        job.detail = `Nouvel essai pour ${missing.length} réglage${missing.length > 1 ? "s" : ""}…`; renderJobs();
        await sleep(5000);
        try { await api("write", "POST", { writes: missing }); } catch { /* vérifié juste après */ }
        for (const wait of [5000, 15000]) {
          await sleep(wait);
          await refresh({ quiet: true });
          if (verify(writes)) { job.status = "done"; job.detail = "Appliqué (après un nouvel essai)"; break; }
        }
        if (job.status !== "done") job.writes = writes.filter((w) => !verify([w]));
      }
    }
    if (job.status !== "done") {
      job.status = "unconfirmed";
      const what = job.writes.map((w) => CAP_LABEL[w.capabilityId] || `réglage ${w.capabilityId}`).join(", ");
      job.detail = `Pas encore appliqué : ${what}. Touche Réessayer pour renvoyer seulement ces réglages.`;
    }
  } catch (e) {
    job.status = "failed"; job.detail = e.message;
    refresh({ quiet: true }); // une partie a pu passer : on affiche l'état réel
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

const CAP_LABEL = { [C.POWER]: "la marche/arrêt", [C.TARGET]: "la consigne", [C.OVERRIDE]: "la dérogation",
  [C.OVERRIDE_TOTAL]: "la durée de dérogation", [C.OVERRIDE_LEFT]: "le temps restant", [C.PROG]: "le mode programme",
  [C.COMFORT_T]: "la température confort", [C.ECO_T]: "la température éco", [C.NIGHT_T]: "la température nuit" };
DAY_IDS.forEach((id, k) => { CAP_LABEL[id] = `le planning du ${DAYS[k].toLowerCase()}`; });

// Écritures types
const W = (room, cap, value) => ({ deviceId: room.id, capabilityId: cap, value: String(value) });
function writesPower(room, on) { return [W(room, C.POWER, on ? ON : OFF)]; }
function writesTarget(room, t) {
  if (room.prog) return [W(room, C.OVERRIDE_TOTAL, room.overrideTotal || 120), W(room, C.OVERRIDE, "1"), W(room, C.TARGET, t)];
  return [W(room, C.TARGET, t)];
}
function writesMode(room, prog) {
  const w = [W(room, C.PROG, prog ? "1" : "0")];
  if (room.override) w.unshift(W(room, C.OVERRIDE, "0"));
  return w;
}
function writesOverride(room, t, minutes) {
  const w = [];
  if (!room.on) w.push(W(room, C.POWER, ON));
  if (!room.prog) w.push(W(room, C.PROG, "1"));
  w.push(W(room, C.OVERRIDE_TOTAL, minutes), W(room, C.OVERRIDE, "1"), W(room, C.TARGET, t));
  return w;
}
function workActive(r) { return r && r.on && r.override && Math.abs((r.target ?? 0) - cfg.work.temp) < 0.01; }
function writesCancelOverride(room) { return [W(room, C.OVERRIDE, "0")]; }
const clampT = (room, t) => Math.min(room.max, Math.max(room.min, Math.round(t / room.step) * room.step));

// ---------- Rendu
function render() {
  const app = $("#app");
  // Ne pas effacer le questionnaire en cours de saisie lors d'une actualisation automatique
  if (S.tab === "optim" && (!habits.done || S.editHabits) && $("#h-wake")) return;
  if (!cfg.demo && !cfg.url) { app.innerHTML = welcomeView(); bindWelcome(); return; }
  const scrollY = window.scrollY;
  app.innerHTML = `<div class="wrap">${topView()}${S.tab === "rooms" ? roomsView() : S.tab === "plan" ? planView() : S.tab === "optim" ? optimView() : S.tab === "suivi" ? suiviView() : consoView()}</div>${navView()}`;
  window.scrollTo(0, scrollY);
}
function renderTop() { const el = $("#refresh"); if (el) el.classList.toggle("spin", S.loading); }

function topView() {
  const rs = rooms();
  const onCount = rs.filter((r) => r.on).length;
  let title = "Chauffage";
  let summary = "";
  if (S.tab === "rooms" && rs.length) {
    title = "Maison";
    const ts = rs.filter((r) => r.on && r.temp != null).map((r) => r.temp);
    const hot = rs.filter((r) => r.on && r.heating).length;
    summary = onCount === 0 ? "Tout est éteint" : `${ts.length ? deg(ts.reduce((a, b) => a + b, 0) / ts.length) + "° en moyenne · " : ""}${hot ? `${hot} pièce${hot > 1 ? "s chauffent" : " chauffe"}` : "rien ne chauffe"}`;
  } else if (S.tab === "plan") title = "Planning";
  else if (S.tab === "conso") title = "Consommation";
  else if (S.tab === "optim") title = "Optimiser";
  else if (S.tab === "suivi") title = "Suivi";
  const h = health();
  const sub = S.error ? `<span style="color:var(--alert)">${esc(S.error)}</span>` :
    S.fetchedAt ? `Données reçues ${ago(Math.round((Date.now() - S.fetchedAt) / 1000))}${S.fromCache ? " (hors ligne)" : ""}` : "Chargement…";
  let banners = "";
  if (cfg.demo && S.tab === "rooms") banners += `<div class="banner info"><div class="b-body"><strong>Mode démo.</strong> Ce sont tes vraies données du 12 octobre, mais rien n'est envoyé à tes radiateurs.</div></div>`;
  if (S.setup && h.stale && S.tab === "rooms") {
    banners += `<div class="banner alert">${I.warn}<div class="b-body"><strong>Tes radiateurs ne donnent plus de nouvelles</strong> depuis ${dateFr(h.last)}. Les commandes risquent de ne pas passer. Débranche la CozyBox 30 secondes puis rebranche-la.</div></div>`;
  }
  if (S.tab === "rooms") for (const f of faultsList()) {
    banners += `<div class="banner alert">${I.warn}<div class="b-body"><strong>${esc(f.room?.name || f.name)} : défaut ${esc(f.code)}</strong>${f.since ? ` depuis le ${new Date(f.since * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}` : ""}.
      ${f.label ? `<br>${esc(f.label)}` : ""}${f.cause ? `<br><span class="muted">Cause probable : ${esc(f.cause)}</span>` : ""}${f.repair ? `<br><span class="muted">Que faire : ${esc(f.repair)}</span>` : ""}
      ${!f.label ? `<br><span class="muted">Coupe le radiateur au disjoncteur une minute puis rallume-le. Si le défaut revient, signale ce code au service client Atlantic.</span>` : ""}
      <br><button class="btn" data-fault-ack="${esc(faultKey(f))}">Masquer ce défaut</button></div></div>`;
  }
  const abs = S.setup?.absence;
  if (abs?.startDate && abs?.endDate && abs.endDate > nowS()) {
    banners += `<div class="banner info">${I.bag}<div class="b-body"><strong>Mode vacances</strong> jusqu'au ${dateFr(abs.endDate)}.<br><button class="btn" data-act="absence-stop">Arrêter le mode vacances</button></div></div>`;
  }
  const out = S.weather?.now != null ? `<span class="pill">${I.thermo}${esc(cfg.place.name)} ${deg(S.weather.now)}°</span>` : "";
  return `<header class="top"><div class="status"><h1>${esc(title)}</h1>${summary ? `<p class="summary">${esc(summary)}</p>` : ""}<p class="muted">${out}<span>${sub}</span></p></div>
    <button class="iconbtn${S.loading ? " spin" : ""}" id="refresh" data-act="refresh" aria-label="Actualiser">${I.refresh}</button>
    <button class="iconbtn" data-act="settings" aria-label="Réglages">${I.gear}</button></header>${banners}`;
}

function navView() {
  const t = (id, label, icon) => `<button role="tab" aria-selected="${S.tab === id}" data-tab="${id}">${icon}${label}</button>`;
  return `<nav class="tabs" role="tablist"><div class="inner">${t("rooms", "Pièces", I.rooms)}${t("plan", "Planning", I.plan)}${t("optim", "Optimiser", I.leaf)}${t("conso", "Conso", I.conso)}${t("suivi", "Suivi", I.trend)}</div></nav>`;
}

function heatPct(t) { if (t == null) return 30; return Math.round(Math.min(100, Math.max(0, (t - 15) / 7 * 100))); }

// Niveau du programme en ce moment, et prochain changement de niveau
function curLevel(r) { const { day, min } = nowParts(); return levelAt(r, day, min); }
function nextDiff(r) {
  const { day, min } = nowParts();
  const cur = levelAt(r, day, min);
  for (let k = 0; k < 7; k++) {
    const di = (day + k) % 7;
    for (const p of r.week[di]) if ((k > 0 || p.min > min) && p.level !== cur) return { day: di, min: p.min, level: p.level, k };
  }
  return null;
}
const whenTxt = (nx) => nx.k === 0 ? `à ${hhmm(nx.min)}` : nx.k === 1 ? `demain à ${hhmm(nx.min)}` : `${DAYS[nx.day].toLowerCase()} à ${hhmm(nx.min)}`;
const isConstant = (r) => r.hasSchedule && !r.week.some((d) => d.some((p) => p.level === 1)) && Math.abs((r.levels[2] ?? 0) - (r.levels[3] ?? 1)) < 0.01;
function levelColor(r) {
  if (!r.on) return "var(--ink-2)";
  if (r.override || !r.prog) return r.target >= (r.levels[1] ?? 19) - 0.3 ? "var(--confort)" : "var(--eco)";
  return LEVELS[curLevel(r)]?.color || "var(--eco)";
}
function roomLine(r) {
  if (!r.available) return "Injoignable";
  if (!r.on) return "Éteint";
  if (workActive(r)) return `${r.heating ? "Vers" : "À"} ${deg(r.target)}° · télétravail`;
  if (r.override) return `${deg(r.target)}° · dérogation${r.overrideLeft ? " " + duration(r.overrideLeft) : ""}`;
  if (!r.prog) return `Manuel · ${deg(r.target)}°`;
  if (isConstant(r)) return `Constant ${deg(r.target)}°`;
  const l = curLevel(r), nx = nextDiff(r);
  return `${LEVELS[l]?.label || "Programme"} ${deg(r.target)}°${nx ? ` · ${LEVELS[nx.level].label.toLowerCase()} ${whenTxt(nx)}` : ""}`;
}
const GAUGE = [14, 24];
const gaugePct = (v) => Math.round(Math.min(1, Math.max(0, ((v ?? GAUGE[0]) - GAUGE[0]) / (GAUGE[1] - GAUGE[0]))) * 100);

function roomsView() {
  const rs = rooms();
  if (!rs.length) return `<div class="empty">${S.error ? "Impossible de lire tes radiateurs pour l'instant." : "Chargement de tes pièces…"}</div>`;
  if (!S.hist && !S.histError) loadHistory();
  const pend = pendingRoomIds();
  const work = rs.find((r) => r.name.toLowerCase() === String(cfg.work.room).toLowerCase());
  const workOn = workActive(work);
  const endAt = workOn && work.overrideLeft ? new Date(Date.now() + work.overrideLeft * 60000).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";
  const scenes = `<div class="scenes" role="group" aria-label="Scènes">
    ${work ? `<button class="scene${workOn ? " on" : ""}" data-act="work" aria-pressed="${workOn}">${I.laptop}<span>${workOn ? `Télétravail${endAt ? " · " + endAt : ""}` : "Télétravail"}</span></button>` : ""}
    <button class="scene" data-act="all-off">${I.moon}<span>Tout éteindre</span></button>
    <button class="scene" data-act="vacation">${I.bag}<span>Vacances</span></button>
    <button class="scene" data-act="all-on">${I.power}<span>Tout allumer</span></button></div>`;
  const tiles = rs.map((r) => {
    const hasFault = (S.faults || []).some((f) => f.deviceId === r.id && !isAcked(f));
    const badge = pend.has(r.id) ? '<span class="pend" aria-hidden="true"></span>'
      : hasFault ? `<span class="badge fault" title="Défaut signalé">${I.warn}</span>`
      : r.on && r.heating ? `<span class="hotpill">${I.flame}Chauffe</span>` : "";
    const col = levelColor(r);
    const gauge = r.on && r.temp != null ? `<span class="gauge" aria-hidden="true"><i style="width:${gaugePct(r.temp)}%;background:${col}"></i>${r.target != null ? `<b style="left:${gaugePct(r.target)}%"></b>` : ""}</span>` : "";
    return `<button class="tile${r.on ? "" : " off"}" data-room="${r.id}" aria-label="${esc(r.name)}, ${r.temp != null ? deg(r.temp) + " degrés" : "température inconnue"}, ${esc(roomLine(r))}">
      <span class="t-top"><span class="name">${esc(r.name)}</span>${badge}</span>
      <span class="temp num">${r.temp != null ? deg(r.temp) + "°" : `<span class="nodata">–</span>`}</span>
      ${gauge}
      <span class="line">${esc(roomLine(r))}</span>
      ${r.temp == null ? `<span class="stale">Mesure ancienne</span>` : nowS() - r.tempAt > 2 * 3600 ? `<span class="stale">Mesuré ${ago(nowS() - r.tempAt)}</span>` : ""}</button>`;
  }).join("");
  return scenes + `<div class="rooms">${tiles}</div>` + todayView(rs) + savingsNudge();
}
// La journée de chaque pièce, d'un coup d'œil
function todayView(rs) {
  const list = rs.filter((r) => r.hasSchedule);
  if (!list.length) return "";
  const { day, min } = nowParts();
  const rows = list.map((r) => {
    let bar;
    if (!r.on) bar = `<span class="today-bar"><i style="flex:1;background:var(--off)"></i></span>`;
    else {
      const segs = []; let cursor = 0, lvl = levelAt(r, day, 0);
      for (const p of r.week[day]) { if (p.min > cursor) segs.push([cursor, p.min, lvl]); cursor = Math.max(cursor, p.min); lvl = p.level; }
      segs.push([cursor, 1440, lvl]);
      bar = `<span class="today-bar">${segs.filter((x) => x[1] > x[0]).map((x) => `<i style="flex:${x[1] - x[0]};background:${LEVELS[x[2]]?.color || "var(--surface-2)"}"></i>`).join("")}</span>`;
    }
    return `<span class="today-name">${esc(r.name)}</span><span class="today-cell">${bar}<span class="now-line" style="left:${(min / 14.4).toFixed(1)}%"></span></span>`;
  }).join("");
  return `<div class="card"><div class="today-head"><h2 class="sec" style="margin:0">Aujourd'hui</h2><span class="muted">Il est ${hhmm(min)}</span></div>
    <div class="today">${rows}</div>
    <div class="legend">${[1, 2, 3].map((k) => `<span><i style="background:${LEVELS[k].color}"></i>${LEVELS[k].label}</span>`).join("")}<span><i style="background:var(--ink);width:2px"></i>Maintenant</span></div></div>`;
}
function savingsNudge() {
  if (!S.hist) return "";
  const sv = savings();
  if (sv.mode === "wait") return "";
  return `<button class="nudge" data-tab="suivi">${I.trend}<span><b>${sv.pct <= 0 ? "−" + -sv.pct : "+" + sv.pct} % ${sv.mode === "optim" ? "depuis le programme optimisé" : "cette semaine"}, à météo égale</b><span class="muted">Voir le suivi</span></span></button>`;
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
    ${room.week.some((d) => !d.length) ? `<div class="banner alert">${I.warn}<div class="b-body"><strong>Journées vides : ${room.week.map((d, k) => d.length ? null : DAYS_SHORT[k]).filter(Boolean).join(", ")}.</strong> Le radiateur n'a aucun horaire ces jours-là. Va dans Optimiser et applique à nouveau le programme de cette pièce, ou touche le jour pour lui donner des horaires.</div></div>` : ""}
    <div class="card"><div class="week">${rows}</div>
      <div class="hours" aria-hidden="true"><span></span><div><span>0 h</span><span>6 h</span><span>12 h</span><span>18 h</span><span>24 h</span></div></div>
      <div class="legend">${[1, 2, 3].map((k) => `<span><i style="background:${LEVELS[k].color}"></i>${LEVELS[k].label}</span>`).join("")}</div>
    </div>
    <p class="help">Touche un jour pour changer ses horaires, ou une température en haut pour la régler.</p>
    ${(() => { S.recos = recommendations(room); return S.recos.length ? `<div class="card"><h2 class="sec" style="margin-top:0">Conseils heures creuses</h2>${recoCard(S.recos)}</div>` : ""; })()}
    <button class="btn block" data-act="copy-plan">Copier ce planning vers une autre pièce</button>
    ${!room.prog ? `<p></p><button class="btn primary block" data-act="plan-enable">Activer le programme dans cette pièce</button>` : ""}`;
}

// ---------- Conso
function consoData() {
  if (!S.conso) return null;
  const byDay = new Map(), byRoom = new Map();
  const named = new Set(S.conso.map((z) => z.zoneLabel).filter(Boolean));
  const missing = rooms().map((r) => r.name).filter((n) => !named.has(n));
  for (const z of S.conso) if (!z.zoneLabel) z.zoneLabel = missing.length === 1 ? missing[0] : "Non attribué";
  for (const z of S.conso) {
    for (const p of z.consumptionPeriods || []) {
      const key = p.date;
      const d = byDay.get(key) || { date: key, hp: 0, hc: 0, cost: 0, hpCost: 0, hcCost: 0 };
      if (p.mode === 2) { d.hc += p.consumedQuantity || 0; d.hcCost += p.cost || 0; }
      else { d.hp += p.consumedQuantity || 0; d.hpCost += p.cost || 0; }
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
    const w = S.weather?.daily?.[dayKey(x.date)];
    const tip = `${lbl} : ${nf2.format(x.hp + x.hc)} kWh, ${nf2.format(x.cost)} €${w ? `, dehors ${deg(w.mean)}° en moyenne` : ""}`;
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
  const table = d.days.map((x) => { const w = S.weather?.daily?.[dayKey(x.date)]; return `<tr><td>${new Date(x.date * 1000).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</td><td>${nf2.format(x.hp)}</td><td>${nf2.format(x.hc)}</td><td>${nf2.format(x.cost)} €</td><td>${w ? deg(w.mean) + "°" : "–"}</td></tr>`; }).join("");
  return `<div class="card"><div class="kpis">
      <div class="kpi"><b class="num">${nf2.format(d.cost)} €</b><span>sur ${nb} jour${nb > 1 ? "s" : ""}</span></div>
      <div class="kpi"><b class="num">${nf1.format(d.kwh)} kWh</b><span>soit ${nf2.format(avg)} € par jour en moyenne</span></div></div></div>
    <div class="card"><h2 class="sec" style="margin-top:0">Par jour</h2>
      <div class="legend"><span><i style="background:var(--hp)"></i>Heures pleines</span><span><i style="background:var(--hc)"></i>Heures creuses</span></div>
      <div class="chart" id="chart"><svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Consommation par jour">${grid}${bars}</svg><div class="tip hidden" id="tip"></div></div>
      <details><summary>Voir le tableau</summary><table class="data"><thead><tr><th>Jour</th><th>Pleines (kWh)</th><th>Creuses (kWh)</th><th>Coût</th><th>Dehors</th></tr></thead><tbody>${table}</tbody></table></details>
    </div>
    <div class="card"><h2 class="sec" style="margin-top:0">Par pièce</h2><div class="rlist">${roomsList}</div>
      ${missing.length ? `<p class="help">Rien de mesuré pour : ${esc(missing.join(", "))} (éteint sur la période).</p>` : ""}</div>
    ${hcView(d)}
    ${linkyView(d)}
    <p class="help">Coûts calculés par Cozytouch avec ton tarif. Les chiffres du jour arrivent souvent avec un jour de décalage.</p>`;
}

function hcView(d) {
  const hp = d.days.reduce((s, x) => s + x.hp, 0), hc = d.days.reduce((s, x) => s + x.hc, 0);
  const hpCost = d.days.reduce((s, x) => s + x.hpCost, 0), hcCost = d.days.reduce((s, x) => s + x.hcCost, 0);
  const pHP = hp > 0.05 ? hpCost / hp : null, pHC = hc > 0.05 ? hcCost / hc : null;
  const share = hp + hc > 0 ? Math.round(hp / (hp + hc) * 100) : null;
  S.recos = rooms().flatMap(recommendations);
  const price = pHP && pHC ? `Le kWh te coûte environ ${nf2.format(pHP)} € en heures pleines contre ${nf2.format(pHC)} € en heures creuses, soit ${Math.round((1 - pHC / pHP) * 100)} % de moins.` : "";
  return `<div class="card"><h2 class="sec" style="margin-top:0">Heures creuses</h2>
    <p class="help">Tes heures creuses : ${esc(hcText())}. ${price}</p>
    ${share != null ? `<p><b class="num" style="font-size:28px">${share} %</b> <span class="muted">de la conso des radiateurs tombe en heures pleines.</span></p>` : ""}
    ${S.recos.length ? recoCard(S.recos) : `<p class="help">Ta programmation profite déjà bien des heures creuses : pas de changement à proposer pour l'instant.</p>`}
  </div>`;
}

function linkyView(d) {
  if (S.linky == null && !S.linkyError) { loadLinky(); return `<div class="card"><h2 class="sec" style="margin-top:0">Toute la maison</h2><p class="help">Lecture du compteur Linky…</p></div>`; }
  if (S.linkyError) return `<div class="card"><h2 class="sec" style="margin-top:0">Toute la maison</h2><p class="help">Linky indisponible : ${esc(S.linkyError)}</p><button class="btn" data-act="linky-retry">Réessayer</button></div>`;
  if (!S.linky.configured) return `<div class="card"><h2 class="sec" style="margin-top:0">Toute la maison</h2>
    <p class="help">${S.linky.demo ? "Le compteur Linky n'est pas lu en mode démo." : "Branche ton compteur Linky pour comparer la conso de toute la maison à celle des radiateurs : ajoute les secrets CHAUFFAGE_LINKY_TOKEN et CHAUFFAGE_LINKY_PRM dans Supabase (voir le guide)."}</p>${S.linky.demo ? "" : `<button class="btn" data-act="linky-retry">Vérifier à nouveau</button>`}</div>`;
  const L = S.linky;
  const days = L.daily.slice(-14);
  if (!days.length) return `<div class="card"><h2 class="sec" style="margin-top:0">Toute la maison</h2><p class="help">Pas encore de données Linky.</p></div>`;
  const total = days.reduce((s, x) => s + x.kwh, 0);
  // Part des radiateurs sur les jours communs
  const rad = new Map(d.days.map((x) => [dayKey(x.date), x.hp + x.hc]));
  const common = days.filter((x) => rad.has(x.date));
  const radShare = common.length ? Math.round(common.reduce((s, x) => s + rad.get(x.date), 0) / Math.max(0.01, common.reduce((s, x) => s + x.kwh, 0)) * 100) : null;
  const split = linkySplit(L.curve);
  const hpShare = split.hp + split.hc > 0 ? Math.round(split.hp / (split.hp + split.hc) * 100) : null;
  const max = Math.max(...days.map((x) => x.kwh), 0.1);
  const W_ = 320, H = 120, padB = 20, gap = 4, bw = (W_ - gap * (days.length - 1)) / days.length;
  const bars = days.map((x, i) => {
    const h = x.kwh / max * (H - padB - 6), X = i * (bw + gap), y = H - padB - h, r = Math.min(4, bw / 2);
    const lbl = new Date(x.date + "T12:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
    const w = S.weather?.daily?.[x.date];
    const tip = `${lbl} : ${nf1.format(x.kwh)} kWh${rad.has(x.date) ? `, dont ${nf1.format(rad.get(x.date))} kWh de radiateurs` : ""}${w ? `, dehors ${deg(w.mean)}°` : ""}`;
    return `<g class="b" data-tip="${esc(tip)}" data-x="${X + bw / 2}" data-y="${y}"><path d="M${X},${H - padB} v${-(h - r)} q0,-${r} ${r},-${r} h${bw - 2 * r} q${r},0 ${r},${r} v${h - r} z" fill="var(--hc)"/>
      <rect x="${X}" y="0" width="${bw + gap}" height="${H}" fill="transparent"/>${i % 2 === days.length % 2 ? "" : `<text x="${X + bw / 2}" y="${H - 5}" text-anchor="middle" font-size="9" fill="var(--ink-2)">${new Date(x.date + "T12:00").getDate()}</text>`}</g>`;
  }).join("");
  return `<div class="card"><h2 class="sec" style="margin-top:0">Toute la maison</h2>
    <div class="kpis"><div class="kpi"><b class="num">${nf1.format(total)} kWh</b><span>sur ${days.length} jours (Linky)</span></div>
    ${radShare != null ? `<div class="kpi"><b class="num">${radShare} %</b><span>pour les radiateurs Cozytouch</span></div>` : hpShare != null ? `<div class="kpi"><b class="num">${hpShare} %</b><span>en heures pleines (7 derniers jours)</span></div>` : ""}</div>
    ${radShare != null && hpShare != null ? `<p class="help">Sur les 7 derniers jours, ${hpShare} % de la conso de la maison tombe en heures pleines.</p>` : ""}
    <div class="chart" id="chart2"><svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Consommation de la maison par jour"><line x1="0" x2="${W_}" y1="${H - padB}" y2="${H - padB}" stroke="var(--line)"/>${bars}</svg><div class="tip hidden" id="tip2"></div></div>
    <p class="help">Données Enedis, mises à jour une fois par jour (la veille).</p></div>`;
}

// ---------- Optimiser : programme proposé à partir des habitudes
const USAGES = {
  bedroom: { label: "Chambre", t: { 1: 18, 2: 16, 3: 17 } },
  office: { label: "Bureau (chauffé à la demande avec le bouton Télétravail)", t: { 1: 20, 2: 17, 3: 17 } },
  living: { label: "Pièce de vie", t: { 1: 19, 2: 16, 3: 17 } },
  bath: { label: "Salle de bain", t: { 1: 22, 2: 17, 3: 17 } },
  guest: { label: "Chambre d'amis (rarement occupée)", t: { 1: 18, 2: 16, 3: 16 } },
  skip: { label: "Ne pas toucher à cette pièce", t: null },
};
const toMin = (s) => { const [h, m] = String(s || "0:0").split(":").map(Number); return (h || 0) * 60 + (m || 0); };
function guessUsage(name) {
  const n = name.toLowerCase();
  if (/bain|sdb|douche/.test(n)) return "bath";
  if (/bureau/.test(n)) return "office";
  if (/ami|invit/.test(n)) return "guest";
  if (/chambre/.test(n)) return "bedroom";
  return "living";
}
function defaultHabits() {
  return { week: { wake: "07:00", leave: "08:30", back: "18:30", bed: "23:00" }, weekend: { wake: "08:30", bed: "23:30", out: false },
    tt: [false, false, false, false, false], feel: "normal", usage: {}, anticip: "radiateur", done: false };
}
let habits = Object.assign(defaultHabits(), store.get("habits", {}));
const usageOf = (r) => habits.usage[r.id] || guessUsage(r.name);

function cleanPoints(pts) {
  const byMin = new Map();
  for (const p of pts) byMin.set(Math.max(0, Math.min(1425, Math.round(p.min / 15) * 15)), p.level);
  const sorted = [...byMin.entries()].sort((a, b) => a[0] - b[0]).map(([min, level]) => ({ min, level }));
  return sorted.filter((p, i) => i === 0 || p.level !== sorted[i - 1].level).slice(0, 10);
}
function proposal(room) {
  const u = usageOf(room);
  if (u === "skip" || !USAGES[u].t) return null;
  const t = { ...USAGES[u].t };
  if (u === "office") { t[1] = cfg.work.temp; t[2] = t[3] = cfg.work.base ?? 17; }
  if (u === "guest") t[3] = t[2]; // nuit = éco : la pièce reste à température constante
  if (habits.feel === "frileux" && u !== "office") t[1] = Math.min(u === "bath" ? 23 : 21, t[1] + 1);
  if (habits.feel === "frais" && u !== "office") t[1] = Math.max(17, t[1] - 1);
  // Avance de la montée en confort : apprise de la vitesse de chauffe si l'appli anticipe,
  // sinon le retard réellement mesuré (radiateur qui n'arrive pas à temps malgré son anticipation)
  const lead = habits.anticip === "appli" ? (leadFor(room)?.min ?? 30) : extraLead(room);
  const morningHC = parseHC(cfg.hc).filter(([, e]) => e < 11 * 60).map(([, e]) => e);
  const week = [];
  for (let d = 0; d < 7; d++) {
    const we = d >= 5;
    const wake = toMin(we ? habits.weekend.wake : habits.week.wake);
    const bed = toMin(we ? habits.weekend.bed : habits.week.bed);
    const home = we ? !habits.weekend.out : !!habits.tt[d];
    const leave = we ? 10 * 60 : toMin(habits.week.leave);
    const back = we ? 18 * 60 : toMin(habits.week.back);
    let p = [];
    if (u === "bedroom") p = [{ min: wake - lead, level: 1 }, { min: wake + 30, level: 2 }, { min: bed - 60, level: 1 }, { min: bed, level: 3 }];
    if (u === "bath") p = [{ min: wake - lead, level: 1 }, { min: wake + 45, level: 2 }, { min: bed - 90, level: 1 }, { min: bed - 30, level: 3 }];
    if (u === "office") p = null;
    if (u === "living") p = home ? [{ min: wake - lead, level: 1 }, { min: bed, level: 3 }]
      : [{ min: wake - lead, level: 1 }, { min: leave, level: 2 }, { min: back - lead, level: 1 }, { min: bed, level: 3 }];
    if (u === "guest") p = null;
    // Heures creuses du matin : la montée en confort démarre avant la fin du tarif réduit si le réveil est juste après
    if (p) for (const e of morningHC) for (const x of p) if (x.level === 1 && x.min > e && x.min <= e + 90) x.min = e - 30;
    // Niveau constant : deux points (01:00 et 23:00). Un point unique à 00:00 est mal accepté par certains radiateurs
    if (!p) { week.push([{ min: 420, level: 2 }, { min: 1380, level: 3 }]); continue; }
    week.push(cleanPoints(p));
  }
  return { usage: u, t, week };
}
// Consigne moyenne sur la semaine (pas de 15 min), pour estimer l'effet des changements
// Confort atteint ou pas, et avec quel retard, depuis la dernière application du programme
function comfortStats(r) {
  const comfort = r.levels[1];
  if (comfort == null || !S.hist?.mesures?.length) return null;
  const since = habits.applied?.[r.id]?.at || 0;
  const m = seriesOf(r.name).filter((x) => x.t >= since);
  const delays = []; let missed = 0, periods = 0, cold = 0;
  for (let i = 1; i < m.length; i++) {
    const x = m[i], prev = m[i - 1];
    if (x.t - prev.t > 25 * 60 || x.target == null || prev.target == null) continue;
    if (!(x.target >= comfort - 0.1 && prev.target < comfort - 0.5)) continue;
    let j = i, reached = null, maxT = -99, end = x.t;
    while (j < m.length && m[j].target != null && m[j].target >= comfort - 0.1 && m[j].t - x.t <= 6 * 3600) {
      if (m[j].temp != null) { maxT = Math.max(maxT, m[j].temp); if (reached == null && m[j].temp >= m[j].target - 0.3) reached = m[j].t; }
      end = m[j].t; j++;
    }
    if (end - x.t < 45 * 60) continue;
    periods++;
    if (reached == null) { missed++; if (maxT < comfort - 1) cold++; delays.push(Math.min(240, (end - x.t) / 60)); }
    else delays.push((reached - x.t) / 60);
  }
  return periods >= 2 ? { delay: median(delays), periods, missed, cold } : null;
}
function extraLead(r) {
  const prev = habits.applied?.[r.id]?.extra || 0;
  const st = comfortStats(r);
  const add = st && st.delay > 20 ? Math.ceil(st.delay / 15) * 15 : 0;
  return Math.min(120, prev + add);
}
function roomNotes(r) {
  const out = [];
  const st = comfortStats(r);
  if (st && st.cold >= 2 && st.cold / st.periods >= 0.5) out.push(`<b>Confort jamais atteint</b> : sur ${st.periods} périodes de confort, la pièce est restée ${st.cold} fois à plus d'un degré sous sa consigne. Monter la consigne n'y changera rien : vérifie fenêtre, porte ou puissance du radiateur.`);
  else if (st && st.delay > 20) out.push(habits.anticip === "appli" ? `La pièce met en moyenne ${duration(st.delay)} à atteindre son confort.` : `La pièce met en moyenne ${duration(st.delay)} à atteindre son confort malgré l'anticipation du radiateur : le programme proposé le démarre plus tôt.`);
  const facts = roomFacts(r);
  if (facts.length) out.push(`Mesuré : la pièce ${esc(facts.join(", "))}.`);
  return out;
}
function avgSetpoint(week, temps) {
  const fake = { week };
  let sum = 0, n = 0;
  for (let d = 0; d < 7; d++) for (let m = 0; m < 1440; m += 15) { const l = levelAt(fake, d, m); if (temps[l] != null) { sum += temps[l]; n++; } }
  return n ? sum / n : null;
}
function estimate(room, prop) {
  const cur = avgSetpoint(room.week, room.levels), next = avgSetpoint(prop.week, prop.t);
  if (cur == null || next == null) return null;
  return { cur, next, pct: Math.round((cur - next) * 7) }; // ADEME : environ 7 % par degré
}
function barHTML(week, di) {
  const fake = { week };
  const pts = week[di];
  const segs = []; let cursor = 0, lvl = levelAt(fake, di, 0);
  for (const p of pts) { if (p.min > cursor) segs.push([cursor, p.min, lvl]); cursor = Math.max(cursor, p.min); lvl = p.level; }
  segs.push([cursor, 1440, lvl]);
  return `<span class="bar slim">${segs.filter((s) => s[1] > s[0]).map((s) => `<i style="flex:${s[1] - s[0]};background:${LEVELS[s[2]]?.color || "var(--surface-2)"}"></i>`).join("")}</span>`;
}
function writesProposal(room, prop) {
  const w = [];
  for (const k of [1, 2, 3]) {
    let second = 0; try { second = JSON.parse(room.levelsRaw[k])[1] ?? 0; } catch { /* rien */ }
    const val = JSON.stringify([prop.t[k], second]);
    if (!sameValue(LEVELS[k].cap, room.levelsRaw[k], val)) w.push(W(room, LEVELS[k].cap, val));
  }
  prop.week.forEach((pts, k) => { const v = serializeDay(pts); if (!sameValue(DAY_IDS[k], room.weekRaw[k], v)) w.push(W(room, DAY_IDS[k], v)); });
  if (room.on && !room.prog) w.push(W(room, C.PROG, "1"));
  return w;
}

function optimView() {
  const rs = rooms().filter((r) => r.hasSchedule);
  if (!rs.length) return `<div class="empty">Chargement de tes pièces…</div>`;
  if (!habits.done || S.editHabits) return habitsForm(rs);
  const items = rs.map((r) => ({ r, prop: proposal(r) })).filter((x) => x.prop);
  const weights = items.map((x) => x.r.watts || 1000);
  const ests = items.map((x) => estimate(x.r, x.prop));
  const tot = weights.reduce((a, b) => a + b, 0);
  const global = Math.round(ests.reduce((s, e, i) => s + (e ? e.pct * weights[i] : 0), 0) / Math.max(1, tot));
  const cards = items.map(({ r, prop }, i) => {
    const e = ests[i];
    const w = writesProposal(r, prop);
    const temps = [1, 2, 3].map((k) => `<span class="chg"><i style="background:${LEVELS[k].color}"></i>${LEVELS[k].label} ${deg(r.levels[k])}°${Math.abs((r.levels[k] ?? 0) - prop.t[k]) > 0.01 ? ` <b>→ ${deg(prop.t[k])}°</b>` : ""}</span>`).join("");
    return `<div class="card opt">
      <div class="opt-head"><div><h2 class="sec" style="margin:0">${esc(r.name)}</h2><span class="muted">${esc(USAGES[prop.usage].label)}</span></div>
        ${e ? `<span class="gain ${e.pct > 0 ? "good" : e.pct < 0 ? "bad" : ""}">${e.pct > 0 ? "−" + e.pct : e.pct < 0 ? "+" + -e.pct : "≈ 0"} %</span>` : ""}</div>
      <div class="chgs">${temps}</div>
      <div class="cmp"><span class="lbl">Semaine</span><span class="tag">Actuel</span>${barHTML(r.week, 0)}<span></span><span class="tag">Proposé</span>${barHTML(prop.week, 0)}
        <span class="lbl">Week-end</span><span class="tag">Actuel</span>${barHTML(r.week, 5)}<span></span><span class="tag">Proposé</span>${barHTML(prop.week, 5)}</div>
      ${roomNotes(r).map((n) => `<p class="help note">${n}</p>`).join("")}
      <p class="help">${esc(prop.week[0].map((p) => `${hhmm(p.min)} ${LEVELS[p.level].label.toLowerCase()}`).join(", "))} en semaine.${!r.on ? " La pièce est éteinte : ce programme servira quand tu la rallumeras." : ""}</p>
      ${w.length ? `<button class="btn primary block" data-opt-apply="${r.id}">Appliquer à ${esc(r.name)}</button>` : `<p class="help"><b>Déjà appliqué.</b></p>`}
    </div>`;
  }).join("");
  return `<div class="card hero-opt"><span class="muted">Économie estimée sur le chauffage</span>
      <b class="num big">${global > 0 ? "−" + global : global < 0 ? "+" + -global : "≈ 0"} %</b>
      <p class="help">Calcul à partir de la consigne moyenne de chaque pièce sur la semaine, avec le repère de l'ADEME : environ 7 % de conso en moins par degré. C'est un ordre de grandeur, la conso réelle tranchera.</p>
      ${(() => { if (!S.hist) return ""; const sv = savings(); return sv.mode === "optim" ? `<p class="measured"><b>Mesuré : ${sv.pct <= 0 ? "−" + -sv.pct : "+" + sv.pct} %</b> à météo égale depuis le ${new Date(cfg.optimAt + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}.</p>`
        : cfg.optimAt ? `<p class="help">L'économie réelle s'affichera ici après quelques jours de chauffage, mesurée à météo égale.</p>` : ""; })()}
      <button class="btn" data-act="habits-edit">Modifier mes habitudes</button></div>
    ${cards}
    ${leversView()}`;
}
function leversView() {
  const tips = [
    ["19° dans les pièces de vie, 17° dans les chambres", "Ce sont les repères de l'ADEME. Chaque degré en moins, c'est environ 7 % de conso en moins."],
    ["Moins chauffer quand personne n'est là", "Une pièce vide à 16° plutôt qu'à 19° économise sans se voir, à condition de relancer le confort avant ton retour."],
    [`Monter en température pendant les heures creuses (${hcText()})`, "C'est la phase qui consomme le plus. Le programme proposé l'avance quand ton réveil tombe juste après la fin du tarif réduit."],
    ["Vacances : mode hors-gel", "Pour toute absence de plus d'un jour, le bouton Vacances coupe le confort et le relance avant ton retour."],
    ["Laisser faire la détection de fenêtre", "Tes radiateurs Atlantic se mettent en pause quand une fenêtre s'ouvre : aère 5 à 10 minutes, fenêtre grande ouverte."],
  ];
  return `<div class="card"><h2 class="sec" style="margin-top:0">Les bons réflexes</h2>${tips.map(([t, d]) => `<div class="tip-row"><b>${esc(t)}</b><p class="help">${esc(d)}</p></div>`).join("")}</div>`;
}
function habitsForm(rs) {
  const h = habits;
  const time = (id, v, label) => `<label class="field"><span>${label}</span><input type="time" step="900" id="${id}" value="${esc(v)}"></label>`;
  return `<div class="card"><h2 class="sec" style="margin-top:0">Parle-moi de tes journées</h2>
      <p class="help">Quelques questions sur ton rythme. L'appli en déduit un programme pièce par pièce, que tu valides avant qu'il soit envoyé.</p></div>
    <div class="card"><h2 class="sec" style="margin-top:0">En semaine</h2>
      <div class="grid2">${time("h-wake", h.week.wake, "Lever")}${time("h-bed", h.week.bed, "Coucher")}${time("h-leave", h.week.leave, "Départ de la maison")}${time("h-back", h.week.back, "Retour")}</div>
      <p class="help" style="margin-top:4px">Les jours où tu télétravailles :</p>
      <div class="daypick">${DAYS_SHORT.slice(0, 5).map((d, k) => `<label><input type="checkbox" data-tt="${k}" ${h.tt[k] ? "checked" : ""}>${d}</label>`).join("")}</div></div>
    <div class="card"><h2 class="sec" style="margin-top:0">Le week-end</h2>
      <div class="grid2">${time("h-wwake", h.weekend.wake, "Lever")}${time("h-wbed", h.weekend.bed, "Coucher")}</div>
      <label class="daypick"><label><input type="checkbox" id="h-out" ${h.weekend.out ? "checked" : ""}>Souvent dehors la journée</label></label></div>
    <div class="card"><h2 class="sec" style="margin-top:0">Ton ressenti</h2>
      <div class="seg" role="group">${[["frileux", "Frileux"], ["normal", "Normal"], ["frais", "J'aime le frais"]].map(([v, l]) => `<button type="button" aria-pressed="${h.feel === v}" data-feel="${v}">${l}</button>`).join("")}</div></div>
    <div class="card"><h2 class="sec" style="margin-top:0">Qui anticipe la montée en température ?</h2>
      <div class="seg" role="group">${[["radiateur", "Les radiateurs"], ["appli", "L'appli"]].map(([v, l]) => `<button type="button" aria-pressed="${(h.anticip || "radiateur") === v}" data-anticip="${v}">${l}</button>`).join("")}</div>
      <p class="help">Les radiateurs : l'option « Anticipation » de Cozytouch est activée, le confort est programmé à l'heure du lever et le radiateur démarre assez tôt pour y être. L'appli : coupe cette option, l'appli avance elle-même la montée selon la vitesse de chauffe mesurée dans chaque pièce (30 min tant qu'elle apprend). Ne combine pas les deux, la pièce chaufferait trop tôt.</p></div>
    <div class="card"><h2 class="sec" style="margin-top:0">À quoi sert chaque pièce ?</h2>
      ${rs.map((r) => `<label class="field"><span>${esc(r.name)}</span><select data-usage="${r.id}">${Object.entries(USAGES).map(([k, v]) => `<option value="${k}" ${usageOf(r) === k ? "selected" : ""}>${esc(v.label)}</option>`).join("")}</select></label>`).join("")}</div>
    <button class="btn primary block" data-act="habits-save">Voir le programme proposé</button><p></p>`;
}
function saveHabits() {
  const v = (id) => $("#" + id)?.value;
  habits.week = { wake: v("h-wake"), bed: v("h-bed"), leave: v("h-leave"), back: v("h-back") };
  habits.weekend = { wake: v("h-wwake"), bed: v("h-wbed"), out: $("#h-out").checked };
  habits.tt = [0, 1, 2, 3, 4].map((k) => $(`[data-tt="${k}"]`).checked);
  habits.feel = $("[data-feel][aria-pressed='true']")?.dataset.feel || "normal";
  habits.anticip = $("[data-anticip][aria-pressed='true']")?.dataset.anticip || "radiateur";
  document.querySelectorAll("[data-usage]").forEach((s) => { habits.usage[s.dataset.usage] = s.value; });
  habits.done = true; S.editHabits = false;
  store.set("habits", habits);
  render(); window.scrollTo(0, 0);
}


// ---------- Suivi (version 5) : historique enregistré par le relais toutes les 15 minutes
// Tarifs réglementés EDF (Tarif Bleu TTC, 9 kVA) en vigueur depuis le 1er août 2026, pour la comparaison
const TRV = { date: "1er août 2026", base: 0.1985, hp: 0.2142, hc: 0.1589, abo: 238.56,
  tempo: { abo: 236.40, bleu: [0.1654, 0.1356], blanc: [0.1921, 0.1536], rouge: [0.7295, 0.1615] } };
// Part de la conso d'un foyer chauffé à l'électricité qui tombe sur chaque couleur Tempo (ordre de grandeur sur un hiver)
const TEMPO_MIX = { bleu: 0.70, blanc: 0.18, rouge: 0.12 };
const HOUSE = "__maison__";

async function loadHistory(force = false) {
  if (S.histLoading) return;
  if (!force && S.hist && Date.now() - S.histAt < 10 * 60000) return;
  S.histLoading = true;
  try { S.hist = await api("history&days=14"); S.histAt = Date.now(); S.histError = null; }
  catch (e) { S.histError = e.message; }
  S.histLoading = false;
  if (S.tab === "suivi" || S.tab === "optim" || S.tab === "rooms") render();
}

// Relevés d'une pièce, triés, en secondes
function seriesOf(name) {
  return (S.hist?.mesures || []).filter((m) => m.room === name).map((m) => ({ ...m, t: Date.parse(m.at) / 1000 }));
}
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const k = Math.floor(s.length / 2); return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };

// Vitesse de chauffe apprise : degrés gagnés par heure quand le radiateur chauffe pour rattraper sa consigne
function heatRate(name) {
  const m = seriesOf(name);
  const rates = [];
  let run = null;
  const close = () => {
    if (run && run.gap0 >= 1 && run.t1 - run.t0 >= 45 * 60 && run.v1 - run.v0 >= 0.3) rates.push((run.v1 - run.v0) / ((run.t1 - run.t0) / 3600));
    run = null;
  };
  for (const x of m) {
    const cont = run && x.t - run.tLast <= 25 * 60;
    if (x.heating && x.temp != null && x.target != null) {
      if (!cont) { close(); run = { t0: x.t, v0: x.temp, t1: x.t, v1: x.temp, tLast: x.t, gap0: x.target - x.temp }; continue; }
      run.t1 = x.t; run.v1 = x.temp; run.tLast = x.t;
      if (x.temp >= x.target - 0.2) close(); // consigne atteinte : la montée est finie
    } else {
      if (cont && x.temp != null) { run.t1 = x.t; run.v1 = x.temp; }
      close();
    }
  }
  close();
  return rates.length >= 2 ? { rate: median(rates), n: rates.length } : null;
}
// Vitesse de refroidissement, ramenée à l'écart avec l'extérieur (repère d'isolation ou de fenêtre ouverte)
function coolRate(name) {
  const m = seriesOf(name);
  const ks = [];
  let run = null;
  const close = () => {
    if (run && run.t1 - run.t0 >= 2 * 3600 && run.v0 - run.v1 >= 0.3 && run.gap > 4) ks.push((run.v0 - run.v1) / ((run.t1 - run.t0) / 3600) / run.gap);
    run = null;
  };
  for (let i = 0; i < m.length; i++) {
    const x = m[i], prev = m[i - 1];
    const ok = !x.heating && x.temp != null && x.outdoor != null;
    if (!ok || (prev && x.t - prev.t > 25 * 60) || (run && x.temp > run.v1 + 0.15)) { close(); if (!ok) continue; }
    if (!run) run = { t0: x.t, v0: x.temp, t1: x.t, v1: x.temp, gap: x.temp - x.outdoor };
    else { run.t1 = x.t; run.v1 = x.temp; }
  }
  close();
  return ks.length >= 2 ? median(ks) : null;
}
// Temps de chauffe par jour (7 derniers jours)
function dutyOf(name) {
  const since = Date.now() / 1000 - 7 * 86400;
  const m = seriesOf(name).filter((x) => x.t >= since);
  if (m.length < 96) return null;
  const span = (m[m.length - 1].t - m[0].t) / 86400;
  return { hours: m.filter((x) => x.heating).length / m.length * 24, days: span };
}
// Avance nécessaire pour passer de l'éco au confort, arrondie au quart d'heure
function leadFor(room) {
  const h = heatRate(room.name);
  if (!h || h.rate <= 0.05) return null;
  const delta = (room.levels[1] ?? 19) - (room.levels[2] ?? 16);
  if (delta <= 0) return null;
  return { min: Math.min(150, Math.max(15, Math.ceil(delta / h.rate * 4) * 15)), rate: h.rate, delta };
}

// Conso par jour des radiateurs : historique du relais, complété par Cozytouch
function radiatorDays() {
  const out = new Map();
  for (const j of S.hist?.jours || []) if (j.room !== HOUSE && j.kwh != null) out.set(j.day, (out.get(j.day) || 0) + j.kwh);
  const d = consoData();
  for (const x of d?.days || []) { const k = dayKey(x.date); if (!out.has(k)) out.set(k, x.hp + x.hc); }
  return out;
}
const djuOf = (day) => { const w = S.weather?.daily?.[day]; return w?.mean != null ? Math.max(0, 18 - w.mean) : null; };
function perDju(days) {
  let kwh = 0, dju = 0, n = 0;
  for (const [day, v] of days) { const g = djuOf(day); if (g == null) continue; kwh += v; dju += g; n++; }
  return { kwh, dju, n, ratio: dju >= 10 ? kwh / dju : null };
}
function savings() {
  const today = dayKey(nowS());
  const all = [...radiatorDays().entries()].filter(([d]) => d < today).sort((a, b) => a[0] < b[0] ? -1 : 1);
  if (cfg.optimAt) {
    const before = perDju(all.filter(([d]) => d < cfg.optimAt));
    const after = perDju(all.filter(([d]) => d > cfg.optimAt));
    if (before.ratio && after.ratio && before.n >= 3 && after.n >= 3) return { mode: "optim", before, after, pct: Math.round((after.ratio / before.ratio - 1) * 100) };
    return { mode: "wait", before, after };
  }
  const cut = dayKey(nowS() - 7 * 86400);
  const before = perDju(all.filter(([d]) => d < cut).slice(-7));
  const after = perDju(all.filter(([d]) => d >= cut));
  if (before.ratio && after.ratio) return { mode: "week", before, after, pct: Math.round((after.ratio / before.ratio - 1) * 100) };
  return { mode: "wait", before, after };
}

// Découpage de la conso de la maison : historique, ou à défaut la courbe Linky des 7 derniers jours
function houseSplit() {
  const rows = (S.hist?.jours || []).filter((j) => j.room === HOUSE && j.kwh_hp != null && j.kwh_hc != null);
  if (rows.length >= 3) return { days: rows.length, hp: rows.reduce((s, j) => s + j.kwh_hp, 0), hc: rows.reduce((s, j) => s + j.kwh_hc, 0), night: rows.reduce((s, j) => s + (j.kwh_night || 0), 0) };
  const curve = S.linky?.curve || [];
  const minutes = curve.reduce((a, p) => a + (p.step || 30), 0);
  if (minutes < 2 * 1440) return null;
  let hp = 0, hc = 0, night = 0;
  for (const p of curve) {
    const step = p.step || 30;
    const end = new Date(p.end.replace(" ", "T"));
    const start = (end.getHours() * 60 + end.getMinutes() + 1440 - step) % 1440;
    const kwh = (p.w || 0) * step / 60 / 1000;
    if (isHC(start + step / 2)) hc += kwh; else hp += kwh;
    if (start >= 1320 || start < 360) night += kwh;
  }
  return { days: Math.round(minutes / 1440), hp, hc, night };
}
function contract() {
  const s = houseSplit();
  if (!s || s.hp + s.hc < 1) return null;
  const tot = s.hp + s.hc, day = tot - s.night;
  const t = cfg.tarif;
  const tempoDay = TEMPO_MIX.bleu * TRV.tempo.bleu[0] + TEMPO_MIX.blanc * TRV.tempo.blanc[0] + TEMPO_MIX.rouge * TRV.tempo.rouge[0];
  const tempoNight = TEMPO_MIX.bleu * TRV.tempo.bleu[1] + TEMPO_MIX.blanc * TRV.tempo.blanc[1] + TEMPO_MIX.rouge * TRV.tempo.rouge[1];
  const yearAbo = (abo) => abo * s.days / 365;
  const offers = [
    { key: "mine", name: `Ton contrat (${t.name || "actuel"})`, cost: s.hp * t.hp + s.hc * t.hc + yearAbo(t.abo) },
    { key: "trvhc", name: "Tarif Bleu EDF heures creuses", cost: s.hp * TRV.hp + s.hc * TRV.hc + yearAbo(TRV.abo) },
    { key: "base", name: "Tarif Bleu EDF base", cost: tot * TRV.base + yearAbo(TRV.abo) },
    { key: "tempo", name: "Tempo EDF (estimation)", cost: day * tempoDay + s.night * tempoNight + yearAbo(TRV.tempo.abo), approx: true },
  ];
  const mine = offers[0].cost;
  for (const o of offers) o.diff = o.cost - mine;
  // Part d'heures creuses à partir de laquelle l'option heures creuses bat l'option base (Tarif Bleu)
  const breakEven = (TRV.hp - TRV.base) / (TRV.hp - TRV.hc);
  return { ...s, tot, offers, hcShare: s.hc / tot, breakEven };
}

// Conseils tirés des relevés
function dataAdvice() {
  const out = [];
  const rs = rooms();
  if (!S.hist?.mesures?.length) return out;
  const duty = rs.map((r) => ({ r, d: dutyOf(r.name) })).filter((x) => x.d);
  if (duty.length) {
    const est = duty.map((x) => ({ ...x, kwh: x.d.hours * (x.r.watts || 1000) / 1000 })).sort((a, b) => b.kwh - a.kwh);
    const top = est[0];
    if (top.kwh > 0.5) out.push({ title: `${top.r.name} chauffe ${nf1.format(top.d.hours)} h par jour`, text: `C'est la pièce qui tire le plus (environ ${nf1.format(top.kwh)} kWh par jour avec ses ${top.r.watts || 1000} W). Un degré de moins sur son confort, c'est environ 7 % de moins sur ce poste.` });
  }
  const ks = rs.map((r) => ({ r, k: coolRate(r.name) })).filter((x) => x.k != null);
  if (ks.length >= 3) {
    const med = median(ks.map((x) => x.k));
    for (const x of ks) if (x.k > med * 1.7) out.push({ title: `${x.r.name} perd sa chaleur plus vite que les autres pièces`, text: "Quand le radiateur s'arrête, la température y baisse nettement plus vite qu'ailleurs, à écart égal avec l'extérieur. Vérifie la fenêtre (joint, entrebâillement), une porte vers une pièce froide ou une bouche d'aération." });
  }
  for (const r of rs) {
    const m = seriesOf(r.name).filter((x) => x.is_on && x.temp != null && x.target != null && !x.heating);
    if (m.length < 96) continue;
    const warm = m.filter((x) => x.temp - x.target > 1.5).length / m.length;
    if (warm > 0.4) out.push({ title: `${r.name} est souvent plus chaude que sa consigne`, text: `${Math.round(warm * 100)} % du temps, la pièce dépasse sa consigne de plus de 1,5° sans que son radiateur chauffe : la chaleur vient d'ailleurs (soleil, pièce voisine). Son radiateur ne consomme alors rien, il n'y a rien à gagner à baisser ses réglages.` });
  }
  const tt = rs.find((r) => r.name.toLowerCase() === String(cfg.work.room).toLowerCase());
  if (tt) {
    const m = seriesOf(tt.name);
    const ttDays = new Set(m.filter((x) => x.target != null && Math.abs(x.target - cfg.work.temp) < 0.01).map((x) => x.at.slice(0, 10)));
    if (m.length > 96 * 5) out.push({ title: `Télétravail : ${ttDays.size} jour${ttDays.size > 1 ? "s" : ""} sur les 14 derniers`, text: `${tt.name} n'a été chauffé à ${deg(cfg.work.temp)}° que ces jours-là, et reste à ${deg(cfg.work.base ?? 17)}° le reste du temps.` });
  }
  return out;
}

// Graphique des températures sur 48 h
function tempChart(name, hours = 48) {
  const since = Date.now() / 1000 - hours * 3600;
  const m = seriesOf(name).filter((x) => x.t >= since);
  if (m.length < 4) return `<p class="help">Pas encore assez de relevés pour cette pièce. Le premier graphique apparaît après quelques heures.</p>`;
  const W_ = 320, H = 150, padL = 26, padB = 18, padT = 8;
  const vals = m.flatMap((x) => [x.temp, x.target, x.outdoor]).filter((v) => v != null);
  const lo = Math.floor(Math.min(...vals) - 1), hi = Math.ceil(Math.max(...vals) + 1);
  const X = (t) => padL + (t - since) / (hours * 3600) * (W_ - padL);
  const Y = (v) => padT + (hi - v) / (hi - lo) * (H - padB - padT);
  const line = (k, step) => {
    let d = "", prev = null;
    for (const x of m) {
      if (x[k] == null) { prev = null; continue; }
      const px = X(x.t).toFixed(1), py = Y(x[k]).toFixed(1);
      d += prev == null ? `M${px},${py}` : step ? `H${px}V${py}` : `L${px},${py}`;
      prev = x;
    }
    return d;
  };
  const heat = m.map((x, i) => x.heating && m[i + 1] ? `<rect x="${X(x.t).toFixed(1)}" y="${H - padB - 4}" width="${Math.max(1, X(m[i + 1].t) - X(x.t)).toFixed(1)}" height="4" fill="var(--hp)"/>` : "").join("");
  const grid = [];
  for (let v = lo; v <= hi; v += Math.max(1, Math.round((hi - lo) / 4))) grid.push(`<line x1="${padL}" x2="${W_}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${padL - 4}" y="${Y(v) + 3}" text-anchor="end" font-size="9" fill="var(--ink-2)">${v}°</text>`);
  const ticks = [];
  const d0 = new Date(since * 1000); d0.setMinutes(0, 0, 0);
  for (let t = d0.getTime() / 1000 + 3600; t < Date.now() / 1000; t += 3600) {
    const h = new Date(t * 1000).getHours();
    if (h % (hours > 24 ? 12 : 6) === 0) ticks.push(`<line x1="${X(t)}" x2="${X(t)}" y1="${padT}" y2="${H - padB}" stroke="var(--line)" stroke-dasharray="2 3"/><text x="${X(t)}" y="${H - 5}" text-anchor="middle" font-size="9" fill="var(--ink-2)">${h === 0 ? new Date(t * 1000).toLocaleDateString("fr-FR", { weekday: "short" }) : h + " h"}</text>`);
  }
  return `<div class="legend"><span><i style="background:var(--accent)"></i>Pièce</span><span><i style="background:var(--ink-2)"></i>Consigne</span><span><i style="background:var(--ink-3, #9AA5AE)"></i>Dehors</span><span><i style="background:var(--hp)"></i>Chauffe</span></div>
    <div class="chart"><svg viewBox="0 0 ${W_} ${H}" role="img" aria-label="Températures de ${esc(name)} sur ${hours} heures">${grid.join("")}${ticks.join("")}${heat}
      <path d="${line("outdoor")}" fill="none" stroke="var(--ink-3, #9AA5AE)" stroke-width="1.2" stroke-dasharray="1 3" stroke-linecap="round"/>
      <path d="${line("target", true)}" fill="none" stroke="var(--ink-2)" stroke-width="1.5" stroke-dasharray="4 3"/>
      <path d="${line("temp")}" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linejoin="round"/></svg></div>`;
}

function suiviView() {
  if (S.hist == null && !S.histError) { loadHistory(); if (S.conso == null) loadConso(); return `<div class="empty">Chargement de l'historique…</div>`; }
  if (S.conso == null && !S.consoError) loadConso();
  if (S.linky == null && !S.linkyError && !cfg.demo) loadLinky();
  if (S.histError) {
    const setup = /Tables|absentes|Action inconnue|Base Supabase/.test(S.histError);
    return `<div class="card"><h2 class="sec" style="margin-top:0">Historique pas encore branché</h2>
      <p class="help">${setup ? "Le relais doit être mis à jour et les tables créées dans Supabase : suis l'étape « Version 5 » du guide." : `Historique indisponible : ${esc(S.histError)}`}</p>
      <button class="btn" data-act="hist-retry">Réessayer</button></div>`;
  }
  const H = S.hist;
  const rs = rooms();
  const first = H.mesures[0]?.at;
  let html = "";
  if (!H.mesures.length) html += `<div class="banner info"><div class="b-body"><strong>L'historique démarre.</strong> Le relais enregistre tes pièces toutes les 15 minutes. Les premiers graphiques apparaissent dans quelques heures, les conseils après quelques jours.</div></div>`;

  // Bilan de la semaine
  const b = H.bilan;
  html += `<div class="card"><h2 class="sec" style="margin-top:0">Bilan de la semaine</h2>
    ${b?.lines ? `<p class="muted" style="margin-top:0">Calculé le ${new Date(b.date + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>${b.lines.map((l) => `<p style="margin:0 0 6px">${esc(l)}</p>`).join("")}`
      : `<p class="help">Le premier bilan arrive dimanche soir, par notification${cfg.demo ? "" : " et par e-mail si tu l'as réglé"}.</p>`}
    <button class="btn" data-act="bilan-now">Calculer maintenant</button></div>`;

  // Économies à météo égale
  const sv = savings();
  const fmtR = (p) => p.ratio ? `${nf2.format(p.ratio)} kWh par degré-jour` : "–";
  let svBody;
  if (sv.mode === "wait") svBody = `<p class="help">${cfg.optimAt ? `Il faut au moins 3 jours de chauffage avant et après le ${new Date(cfg.optimAt + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}, date du programme optimisé, et assez de froid pour comparer.` : "Pas encore assez de jours froids pour comparer deux semaines."} La mesure se fait à météo égale : la conso est divisée par les degrés-jours (l'écart entre 18° et la température moyenne dehors).</p>`;
  else svBody = `<p><b class="num" style="font-size:28px">${sv.pct <= 0 ? "−" + -sv.pct : "+" + sv.pct} %</b> <span class="muted">${sv.mode === "optim" ? "depuis le programme optimisé, à météo égale" : "cette semaine par rapport à la précédente, à météo égale"}</span></p>
    <p class="help">${sv.mode === "optim" ? "Avant" : "Semaine précédente"} : ${fmtR(sv.before)} sur ${sv.before.n} jours. ${sv.mode === "optim" ? "Après" : "Cette semaine"} : ${fmtR(sv.after)} sur ${sv.after.n} jours. Diviser par les degrés-jours neutralise la météo : une semaine plus froide ne fausse pas la comparaison.</p>`;
  html += `<div class="card"><h2 class="sec" style="margin-top:0">Économies réelles</h2>${svBody}</div>`;

  // Températures 48 h
  if (H.mesures.length) {
    if (!S.histRoom || !rs.find((r) => r.name === S.histRoom)) S.histRoom = rs[0]?.name;
    html += `<div class="card"><h2 class="sec" style="margin-top:0">Températures sur 48 h</h2>
      <div class="chips" role="group" aria-label="Pièce">${rs.map((r) => `<button aria-pressed="${r.name === S.histRoom}" data-hroom="${esc(r.name)}">${esc(r.name)}</button>`).join("")}</div>
      ${tempChart(S.histRoom)}</div>`;
  }

  // Préchauffage appris
  const leads = rs.map((r) => ({ r, l: leadFor(r) }));
  html += `<div class="card"><h2 class="sec" style="margin-top:0">Préchauffage</h2>
    ${leads.some((x) => x.l) ? `<div class="rlist">${leads.map(({ r, l }) => `<div class="r"><span>${esc(r.name)}</span><span class="num">${l ? `<b>${nf1.format(l.rate)}° par heure</b> <span class="muted">${duration(l.min)} pour +${deg(l.delta)}°</span>` : `<span class="muted">en apprentissage</span>`}</span></div>`).join("")}</div>
      <p class="help">Mesuré quand le radiateur rattrape sa consigne. ${habits.anticip === "appli" ? "L'onglet Optimiser avance la montée en confort d'autant." : "Tes radiateurs gèrent l'anticipation eux-mêmes : ces chiffres servent de contrôle. Tu peux confier l'anticipation à l'appli dans Optimiser."}</p>`
      : `<p class="help">L'appli apprend à quelle vitesse chaque pièce monte en température. Il lui faut au moins deux montées en confort par pièce.</p>`}</div>`;

  // Conseils tirés des relevés
  const adv = dataAdvice();
  if (adv.length) html += `<div class="card"><h2 class="sec" style="margin-top:0">Ce que disent tes relevés</h2>${adv.map((a) => `<div class="tip-row"><b>${esc(a.title)}</b><p class="help">${esc(a.text)}</p></div>`).join("")}</div>`;

  // Contrat
  const c = contract();
  const t = cfg.tarif;
  html += `<div class="card"><h2 class="sec" style="margin-top:0">Ton contrat est-il le bon ?</h2>
    <p class="help">Ton tarif : ${nf2.format(t.hp * 100)} c€ en heures pleines, ${nf2.format(t.hc * 100)} c€ en heures creuses, abonnement ${nf2.format(t.abo)} € par an. Modifiable dans la roue crantée.</p>
    ${c ? `<p class="help">Sur ${c.days} jours de compteur Linky (${nf1.format(c.tot)} kWh, dont ${Math.round(c.hcShare * 100)} % en heures creuses), abonnement compris :</p>
      <div class="rlist">${c.offers.map((o) => `<div class="r"><span>${esc(o.name)}</span><span class="num"><b>${nf2.format(o.cost)} €</b> ${o.key === "mine" ? "" : `<span class="${o.diff < -0.005 ? "good" : "muted"}">${o.diff < 0 ? "−" : "+"}${Math.round(Math.abs(o.diff) / c.offers[0].cost * 100)} %</span>`}</span></div>`).join("")}</div>
      <p class="help">${c.hcShare >= c.breakEven ? `Avec ${Math.round(c.hcShare * 100)} % en heures creuses, l'option heures creuses est la bonne : au Tarif Bleu, elle bat l'option base dès ${Math.round(c.breakEven * 100)} %.` : `Avec ${Math.round(c.hcShare * 100)} % en heures creuses, l'option base serait plus adaptée : au Tarif Bleu, l'option heures creuses n'est gagnante qu'à partir de ${Math.round(c.breakEven * 100)} %.`}
      Tarifs EDF au ${TRV.date}. Tempo est une estimation : le prix dépend du nombre de jours rouges, et un jour rouge coûte ${nf2.format(TRV.tempo.rouge[0] * 100)} c€ le kWh en journée.</p>`
      : `<p class="help">${S.linky?.configured ? "La courbe de charge Linky n'est pas encore disponible. Active « l'enregistrement de la consommation horaire » dans ton espace Enedis : la comparaison apparaît un ou deux jours après." : "Branche ton compteur Linky (voir le guide) : la comparaison se fait sur ta vraie courbe de consommation, heure par heure."}</p>`}</div>`;

  // Alertes récentes
  if (H.alertes?.length) html += `<div class="card"><h2 class="sec" style="margin-top:0">Dernières alertes</h2>${H.alertes.slice(0, 8).map((a) => `<div class="tip-row"><b>${esc(a.message)}</b><p class="help">${dateFr(Date.parse(a.at) / 1000)}</p></div>`).join("")}</div>`;
  html += `<p class="help">${first ? `Historique enregistré depuis le ${new Date(first).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}. ` : ""}${pushState() === "on" ? "Les alertes arrivent en notification sur ce téléphone." : `<button class="btn" data-act="push-on">Recevoir les alertes en notification</button>`}</p>`;
  return html;
}

// ---------- Notifications
function pushState() {
  if (cfg.demo) return "demo";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  return store.get("pushOn", false) && Notification.permission === "granted" ? "on" : "off";
}
function b64ToU8(b64) {
  const s = atob((b64 + "=".repeat((4 - b64.length % 4) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}
async function enablePush() {
  const st = pushState();
  if (st === "demo") return toast("Pas de notifications en mode démo");
  if (st === "unsupported") return toast("Ce navigateur ne gère pas les notifications. Ouvre l'appli dans Chrome.");
  if (st === "denied") return toast("Notifications bloquées : autorise-les dans les réglages du site, dans Chrome");
  try {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return toast("Notifications refusées");
    const reg = await navigator.serviceWorker.ready;
    const { publicKey } = await api("vapid");
    let sub = await reg.pushManager.getSubscription();
    if (sub && store.get("pushKey", "") !== publicKey) { await sub.unsubscribe(); sub = null; }
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(publicKey) });
    await api("subscribe", "POST", { sub: sub.toJSON() });
    store.set("pushOn", true); store.set("pushKey", publicKey);
    toast("Alertes activées sur ce téléphone");
  } catch (e) { toast("Activation impossible : " + e.message); }
  render();
}
async function disablePush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) { await api("unsubscribe", "POST", { endpoint: sub.endpoint }).catch(() => {}); await sub.unsubscribe(); }
  } catch { /* rien */ }
  store.set("pushOn", false); toast("Alertes coupées sur ce téléphone"); render();
}

// Le relais a besoin de tes heures creuses et des défauts masqués pour ses calculs et ses alertes
async function syncRelay() {
  if (cfg.demo || !cfg.url) return;
  try {
    if (store.get("hcSynced", "") !== cfg.hc) { await api("config", "POST", { hc: cfg.hc }); store.set("hcSynced", cfg.hc); }
    const done = store.get("acksSynced", []);
    for (const k of faultAcks.filter((k) => !done.includes(k))) { await api("ack", "POST", { key: k }); done.push(k); store.set("acksSynced", done); }
  } catch { /* relais pas encore à jour : on réessaiera au prochain lancement */ }
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
const DIAL = [12, 24];
function dialSVG(r, t) {
  const f = (v) => Math.min(1, Math.max(0, (v - DIAL[0]) / (DIAL[1] - DIAL[0])));
  const pt = (v) => { const a = (135 + f(v) * 270) * Math.PI / 180; return [140 + 110 * Math.cos(a), 140 + 110 * Math.sin(a)]; };
  const [sx, sy] = pt(DIAL[0]), [ex, ey] = pt(DIAL[1]), [tx, ty] = pt(t);
  const col = t >= (r.levels[1] ?? 19) - 0.3 ? "var(--confort)" : t <= (r.levels[3] ?? 0) + 0.3 && (r.levels[3] ?? 0) < (r.levels[2] ?? 0) ? "var(--nuit)" : "var(--eco)";
  const cur = r.temp != null ? pt(r.temp) : null;
  return `<svg viewBox="0 0 280 280" role="img" aria-label="Consigne ${deg(t)} degrés${r.temp != null ? `, il fait ${deg(r.temp)} degrés` : ""}">
    <path d="M${sx.toFixed(1)} ${sy.toFixed(1)}A110 110 0 1 1 ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="var(--surface-2)" stroke-width="22" stroke-linecap="round"/>
    ${f(t) > 0.005 ? `<path d="M${sx.toFixed(1)} ${sy.toFixed(1)}A110 110 0 ${f(t) * 270 > 180 ? 1 : 0} 1 ${tx.toFixed(1)} ${ty.toFixed(1)}" fill="none" stroke="${col}" stroke-width="22" stroke-linecap="round"/>` : ""}
    ${cur ? `<circle cx="${cur[0].toFixed(1)}" cy="${cur[1].toFixed(1)}" r="7" fill="var(--ink)"/>` : ""}
    <circle cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="16" fill="var(--surface)" stroke="${col}" stroke-width="6"/></svg>`;
}
// Minutes jusqu'au prochain lever (pour « Nuit maintenant »), à l'heure près, entre 1 et 12 h
function minutesToWake() {
  const now = new Date();
  const tomorrow = (now.getDay() + 7) % 7; // 0 = dimanche
  const weekendTomorrow = tomorrow === 5 || tomorrow === 6; // demain samedi ou dimanche
  const wake = toMin(weekendTomorrow ? habits.weekend.wake : habits.week.wake);
  let m = wake + 1440 - (now.getHours() * 60 + now.getMinutes());
  if (m > 1440) m -= 1440;
  return Math.min(720, Math.max(60, Math.round(m / 60) * 60));
}
function roomFacts(r) {
  const out = [];
  const d = dutyOf(r.name);
  if (d) out.push(`chauffe ${nf1.format(d.hours)} h par jour, environ ${nf1.format(d.hours * (r.watts || 1000) / 1000)} kWh`);
  const h = heatRate(r.name);
  if (h) out.push(`monte de ${nf1.format(h.rate)}° par heure`);
  return out;
}
function openRoom(id) {
  let pendingTarget = null, timer = null;
  const draw = () => {
    const r = roomById(id); if (!r) return "";
    const t = pendingTarget ?? r.target ?? 19;
    const nx = r.prog && !r.override ? nextDiff(r) : null;
    const mode = !r.available ? "injoignable" : !r.on ? "éteint" : r.override ? "dérogation" : r.prog ? "en programme" : "en manuel";
    const since = Date.now() / 1000 - 24 * 3600;
    const m24 = seriesOf(r.name).filter((x) => x.t >= since);
    const heated = m24.length > 8 ? m24.filter((x) => x.heating).length * 15 : null;
    const facts = roomFacts(r);
    let next = "";
    if (r.on && r.override) next = `Dérogation${r.overrideLeft ? `, encore ${duration(r.overrideLeft)}` : ""}, puis retour au programme.`;
    else if (nx) next = `${LEVELS[curLevel(r)]?.label || "Programme"} jusqu'à ${hhmm(nx.min)}${nx.k ? (nx.k === 1 ? " demain" : " " + DAYS[nx.day].toLowerCase()) : ""}, puis ${LEVELS[nx.level].label.toLowerCase()} à ${deg(r.levels[nx.level])}°.`;
    else if (r.on && !r.prog) next = "En manuel : la consigne reste fixe.";
    return `<div class="fiche-head"><div><h3>${esc(r.name)}</h3><p class="muted" style="margin:0">${esc(r.model)}${r.watts && !/\d\s*W\b/i.test(r.model) ? ` ${r.watts} W` : ""} · ${mode}</p></div>
        <button class="powerpill${r.on ? " on" : ""}" data-r="power" aria-pressed="${r.on}">${I.power}${r.on ? "Allumé" : "Éteint"}</button></div>
      ${r.on ? `
      <div class="dial-row"><button class="round" data-r="minus" aria-label="Baisser la consigne">−</button>
        <div class="dial">${dialSVG(r, t)}<div class="dial-c"><span class="muted"><b>${pendingTarget != null ? "Envoi…" : "Consigne"}</b></span><b class="num">${deg(t)}°</b><span class="muted">${r.temp != null ? `il fait ${deg(r.temp)}°` : r.lastTemp != null ? `dernière mesure ${deg(r.lastTemp)}°` : "température inconnue"}</span></div></div>
        <button class="round" data-r="plus" aria-label="Monter la consigne">+</button></div>
      ${next ? `<p class="help center">${esc(next)}</p>` : ""}
      ${r.prog && !r.override ? `<p class="help center">Changer la consigne crée une dérogation de ${duration(r.overrideTotal)}.</p>` : ""}
      <div class="seg" role="group" aria-label="Mode"><button aria-pressed="${!r.prog}" data-r="manual">Manuel</button><button aria-pressed="${r.prog}" data-r="prog">Programme</button></div>
      <div class="quick">
        <button class="q warm" data-r="boost"><b>Coup de chaud</b><span>+${deg(cfg.boost.delta)}° pendant ${duration(cfg.boost.minutes)}</span></button>
        ${r.override ? `<button class="q" data-r="cancel-override"><b>Reprendre</b><span>le programme maintenant</span></button>`
          : `<button class="q night" data-r="night"><b>Nuit maintenant</b><span>${deg(r.levels[3] ?? 17)}° jusqu'au lever</span></button>`}
      </div>` : `<p class="help">Éteint depuis ${r.powerAt ? dateFr(r.powerAt) : "un moment"}. Touche « Éteint » pour le rallumer.</p>`}
      ${m24.length >= 4 ? `<div class="card flat"><div class="today-head"><b>Dernières 24 h</b>${heated != null ? `<span class="muted">a chauffé ${duration(heated)}</span>` : ""}</div>${tempChart(r.name, 24)}${facts.length ? `<p class="help">En moyenne, la pièce ${esc(facts.join(", "))}.</p>` : ""}</div>` : ""}
      <button class="btn block" data-r="planning">Voir le planning</button>`;
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
    if (a === "night") {
      const t = clampT(r, r.levels[3] ?? 17), minutes = minutesToWake();
      runJob(`${r.name} : nuit à ${deg(t)}° pendant ${duration(minutes)}`, writesOverride(r, t, minutes));
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
      <label class="field"><span>Jusqu'à</span><input id="s-wuntil" type="time" step="900" value="${esc(cfg.work.until || "18:00")}"></label></div>
    <label class="field"><span>Température du bureau le reste du temps</span><input id="s-wbase" type="number" step="0.5" min="7" max="20" value="${cfg.work.base ?? 17}"></label>
    <h2 class="sec">Coup de chaud</h2>
    <div class="row"><label class="field"><span>Degrés en plus</span><input id="s-bdelta" type="number" step="0.5" min="0.5" max="5" value="${cfg.boost.delta}"></label>
      <label class="field"><span>Durée (min)</span><input id="s-bmin" type="number" step="15" min="15" max="240" value="${cfg.boost.minutes}"></label></div>
    <h2 class="sec">Tarif et météo</h2>
    <label class="field"><span>Heures creuses</span><input id="s-hc" type="text" value="${esc(cfg.hc)}" placeholder="01:04-07:04, 14:04-16:04"></label>
    <div class="row"><label class="field"><span>Heures pleines (€/kWh)</span><input id="s-thp" type="number" step="0.00001" min="0" value="${cfg.tarif.hp}"></label>
      <label class="field"><span>Heures creuses (€/kWh)</span><input id="s-thc" type="number" step="0.00001" min="0" value="${cfg.tarif.hc}"></label></div>
    <div class="row"><label class="field"><span>Abonnement (€/an)</span><input id="s-tabo" type="number" step="0.01" min="0" value="${cfg.tarif.abo}"></label>
      <label class="field"><span>Fournisseur</span><input id="s-tname" type="text" value="${esc(cfg.tarif.name)}"></label></div>
    <label class="field"><span>Commune (pour la météo)</span><input id="s-place" type="text" value="${esc(cfg.place.name)}"></label>
    <label class="field"><span>Alerte si plus de nouvelles des radiateurs depuis (heures)</span><input id="s-stale" type="number" min="1" max="72" value="${cfg.staleHours}"></label>
    <p class="help">Un radiateur au repos n'envoie sa température que lorsqu'elle change : quelques heures sans mesure sont normales.</p>
    <label class="field"><span>Programme optimisé appliqué le (point de départ des économies)</span><input id="s-optim" type="date" value="${esc(cfg.optimAt || "")}"></label>
    <h2 class="sec">Alertes</h2>
    ${(() => { const st = pushState(); return st === "on" ? `<p class="help">Les alertes arrivent en notification sur ce téléphone : radiateur injoignable, défaut, pièce qui n'arrive pas à chauffer, conso inhabituelle, CozyBox muette, et le bilan du dimanche.</p><div class="row"><button class="btn" data-push="test">Envoyer un test</button><button class="btn" data-push="off">Couper</button></div>`
      : st === "demo" ? `<p class="help">Pas de notifications en mode démo.</p>` : st === "unsupported" ? `<p class="help">Ce navigateur ne gère pas les notifications. Ouvre l'appli installée depuis Chrome.</p>`
      : st === "denied" ? `<p class="help">Les notifications sont bloquées pour ce site. Dans Chrome : cadenas à gauche de l'adresse, puis Autorisations, puis Notifications.</p>`
      : `<button class="btn block" data-push="on">${I.bell}Recevoir les alertes sur ce téléphone</button>`; })()}
    <p></p><button class="btn primary block" data-save>Enregistrer</button>
    <p class="help" style="text-align:center">Version ${APP_VERSION}</p>`, (el) => {
    el.querySelectorAll("[data-push]").forEach((b) => b.onclick = async () => {
      const k = b.dataset.push; closeSheet();
      if (k === "on") enablePush();
      if (k === "off") disablePush();
      if (k === "test") api("testpush", "POST", {}).then((d) => toast(d.sent ? "Notification envoyée" : "Aucun téléphone abonné : réactive les alertes")).catch((e) => toast(e.message));
    });
    const tog = (id) => el.querySelector(id)?.addEventListener("click", (e) => { const b = e.currentTarget; b.setAttribute("aria-checked", b.getAttribute("aria-checked") !== "true"); });
    tog("#s-demo"); tog("#s-stuck");
    el.querySelector("[data-save]").onclick = () => {
      const wasDemo = cfg.demo;
      cfg.url = el.querySelector("#s-url").value.trim();
      cfg.code = el.querySelector("#s-code").value;
      cfg.demo = el.querySelector("#s-demo").getAttribute("aria-checked") === "true";
      if (el.querySelector("#s-stuck")) cfg.demoStuck = el.querySelector("#s-stuck").getAttribute("aria-checked") === "true";
      cfg.work = { room: el.querySelector("#s-wroom").value || cfg.work.room, temp: +el.querySelector("#s-wtemp").value || 20,
        until: el.querySelector("#s-wuntil").value || "18:00", base: +el.querySelector("#s-wbase").value || 17 };
      cfg.boost = { delta: +el.querySelector("#s-bdelta").value || 2, minutes: +el.querySelector("#s-bmin").value || 60 };
      cfg.staleHours = Math.max(6, +el.querySelector("#s-stale").value || 24);
      cfg.hc = el.querySelector("#s-hc").value.trim() || cfg.hc;
      cfg.tarif = { name: el.querySelector("#s-tname").value.trim() || "actuel", hp: +el.querySelector("#s-thp").value || cfg.tarif.hp,
        hc: +el.querySelector("#s-thc").value || cfg.tarif.hc, abo: +el.querySelector("#s-tabo").value || cfg.tarif.abo };
      cfg.optimAt = el.querySelector("#s-optim").value || null;
      const place = el.querySelector("#s-place").value.trim();
      if (place && place !== cfg.place.name) {
        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=fr&countryCode=FR`)
          .then((r) => r.json()).then((g) => {
            const x = g.results?.[0];
            if (x) { cfg.place = { name: x.name, lat: x.latitude, lon: x.longitude }; store.set("cfg", cfg); store.del("weather"); loadWeather(); }
            else toast("Commune introuvable");
          }).catch(() => {});
      }
      store.set("cfg", cfg);
      closeSheet();
      if (wasDemo !== cfg.demo) { S.setup = null; S.conso = null; S.fetchedAt = 0; store.del("lastState"); }
      render(); refresh(); syncRelay();
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
    try { await api("state"); store.set("cfg", cfg); render(); refresh(); loadWeather(); }
    catch (e) { $("#w-err").textContent = e.message; cfg.url = ""; }
  };
  if ($("#w-demo")) $("#w-demo").onclick = () => { cfg.demo = true; store.set("cfg", cfg); render(); refresh(); loadWeather(); };
}

// ---------- Actions globales
function setTab(t) { S.tab = t; store.set("tab", t); render(); window.scrollTo(0, 0); if (t === "conso" && S.conso == null) loadConso(); if (t === "suivi" || t === "optim") loadHistory(); }

document.addEventListener("click", (e) => {
  if (sheetEl && sheetEl.contains(e.target)) return;
  const t = e.target.closest("[data-tab],[data-room],[data-act],[data-plan-room],[data-day],[data-level],[data-retry],[data-dismiss],[data-reco],[data-opt-apply],[data-feel],[data-anticip],[data-fault-ack],[data-hroom]");
  if (!t) return;
  if (t.dataset.tab) return setTab(t.dataset.tab);
  if (t.dataset.room) return openRoom(+t.dataset.room);
  if (t.dataset.hroom) { S.histRoom = t.dataset.hroom; return render(); }
  if (t.dataset.planRoom) { S.planRoom = +t.dataset.planRoom; return render(); }
  if (t.dataset.day) return openDay(S.planRoom, +t.dataset.day);
  if (t.dataset.level) return openLevel(S.planRoom, +t.dataset.level);
  if (t.dataset.retry) return retryJob(+t.dataset.retry);
  if (t.dataset.dismiss) return dismissJob(+t.dataset.dismiss);
  if (t.dataset.optApply) {
    const r = roomById(+t.dataset.optApply); const prop = proposal(r);
    if (r && prop && confirm(`Envoyer le programme proposé à ${r.name} ?`)) {
      runJob(`${r.name} : programme optimisé`, writesProposal(r, prop));
      habits.applied = { ...(habits.applied || {}), [r.id]: { at: nowS(), extra: habits.anticip === "appli" ? 0 : extraLead(r) } };
      store.set("habits", habits);
      if (!cfg.optimAt) { cfg.optimAt = dayKey(nowS()); store.set("cfg", cfg); } // point de départ de la mesure des économies
    }
    return;
  }
  if (t.dataset.faultAck) {
    if (confirm("Masquer ce défaut ? Il ne réapparaîtra que si un nouveau code arrive.")) {
      faultAcks = [...new Set([...faultAcks, t.dataset.faultAck])]; store.set("faultAcks", faultAcks); render(); syncRelay();
    }
    return;
  }
  if (t.dataset.anticip) { document.querySelectorAll("[data-anticip]").forEach((b) => b.setAttribute("aria-pressed", b === t)); return; }
  if (t.dataset.feel) { document.querySelectorAll("[data-feel]").forEach((b) => b.setAttribute("aria-pressed", b === t)); return; }
  if (t.dataset.reco) { const r = S.recos?.[+t.dataset.reco]; if (r && confirm(`${r.title} ?`)) applyReco(r); return; }
  const a = t.dataset.act;
  const rs = rooms();
  if (a === "refresh") refresh();
  if (a === "settings") openSettings();
  if (a === "conso-retry") { S.consoError = null; S.conso = null; render(); }
  if (a === "habits-save") return saveHabits();
  if (a === "habits-edit") { S.editHabits = true; render(); window.scrollTo(0, 0); return; }
  if (a === "hist-retry") { S.histError = null; S.hist = null; render(); }
  if (a === "push-on") enablePush();
  if (a === "bilan-now") {
    api("bilan", "POST", { mail: false }).then((d) => { if (S.hist) S.hist.bilan = d.bilan; toast("Bilan calculé"); render(); }).catch((e) => toast(e.message));
  }
  if (a === "linky-retry") { S.linkyError = null; S.linky = null; loadLinky(true); render(); }
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
    if (!r) return;
    if (workActive(r)) {
      if (confirm(`Arrêter le télétravail ? ${r.name} repasse à sa température habituelle.`)) runJob(`Fin du télétravail : ${r.name}`, writesCancelOverride(r));
      return;
    }
    const { min } = nowParts();
    const end = toMin(cfg.work.until || "18:00");
    if (end - min < 30) return toast(`Il est déjà presque ${cfg.work.until} : rien à lancer`);
    // La dérogation Cozytouch se règle à l'heure : on arrondit à l'heure la plus proche, entre 1 et 12 h
    const minutes = Math.min(12 * 60, Math.max(60, Math.round((end - min) / 60) * 60));
    const endAt = new Date(Date.now() + minutes * 60000).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    runJob(`Télétravail : ${r.name} à ${deg(cfg.work.temp)}° jusqu'à ${endAt}`, writesOverride(r, clampT(r, cfg.work.temp), minutes));
  }
  if (a === "vacation") openVacation();
  if (a === "absence-stop") absenceJob("Fin du mode vacances", null, null);
  if (a === "copy-plan") openCopyPlan(S.planRoom);
  if (a === "plan-enable") { const r = roomById(S.planRoom); runJob(`${r.name} : programme`, [...(!r.on ? writesPower(r, true) : []), ...writesMode(r, true)]); }
});

// Infobulle du graphique (toucher ou survol)
function chartTip(e) {
  const g = e.target.closest?.("g.b");
  document.querySelectorAll(".chart .tip").forEach((t) => t.classList.add("hidden"));
  if (!g) return;
  const ch = g.closest(".chart"); const tip = ch?.querySelector(".tip");
  if (!tip) return;
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
// Ouverture depuis une notification : onglet demandé
{ const t = new URLSearchParams(location.search).get("tab"); if (["rooms", "plan", "optim", "conso", "suivi"].includes(t)) { S.tab = t; store.set("tab", t); history.replaceState(null, "", location.pathname); } }
if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", (e) => { if (e.data?.tab) setTab(e.data.tab); });
render();
if (cfg.demo || cfg.url) { refresh(); loadWeather(); syncRelay(); if (S.tab === "suivi" || S.tab === "optim") loadHistory(); }
setInterval(() => { if (document.visibilityState === "visible" && (cfg.demo || cfg.url) && !S.jobs.some((j) => j.status === "verifying")) refresh({ quiet: true }); }, 60000);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && (cfg.demo || cfg.url)) refresh({ quiet: true }); });
})();
