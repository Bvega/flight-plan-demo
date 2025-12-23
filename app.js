/**
 * Flight Plan Demo PWA Kit (front-end only) + LAN sync
 * - EN/ES toggle
 * - Family view: #/f/B0170
 * - Display view: #/display
 * - Presenter controls: #/presenter
 *
 * Same-device sync: BroadcastChannel
 * Cross-device sync (laptop -> phone): SSE + REST via local node server
 */

const APP = {
  channelName: "flight-plan-demo",
  langKey: "fp_lang",
  stateKey: "fp_state_v1",
  defaultLang: "en",

  // Manual override set by user (Presenter UI)
  baseUrlOverrideKey: "fp_base_url_override",

  // Auto-detected LAN base URL (from /api/lan)
  baseUrlDetectedKey: "fp_base_url_detected"
};

const i18n = {
  en: {
    brandTitle: "Flight Plan",
    brandSubtitle: "Family Progress Tracker (Demo)",
    homeKicker: "Demo kit",
    homeTitle: "Mobile companion PWA",
    homeSubtitle: "Scan a QR to track a case. Minimal, clear, and privacy-first.",
    openFamily: "Open Family View",
    openDisplay: "Open Waiting Room Display",
    openPresenter: "Open Presenter Controls",
    trackingCode: "Tracking Code",
    go: "Go",
    delays: "Delays",
    pleaseRemember: "Please Remember",
    delaysBullets: [
      "We do our best to stay on schedule, but there may be delays.",
      "If we are experiencing a surgical delay, we will do our best to keep you informed.",
      "You may ask for updates at the registration desk at any time."
    ],
    rememberBullets: [
      "Please leave your phone volume on.",
      "If you need to leave the waiting room, you may ask for the patient's progress update before their procedure or check with the doctor after the procedure."
    ],
    updated: "Updated",
    delayOn: "Delay",
    delayOff: "No delays",
    outcome: "Outcome",
    discharge: "Discharge",
    inpatient: "Inpatient",
    ended: "Completed",
    notFound: "Case not found.",
    backHome: "Back",
    presenterTitle: "Presenter Controls",
    presenterSubtitle: "Simulate live updates. Phones sync automatically (LAN).",
    createCase: "Create case",
    create: "Create",
    setStatus: "Set status",
    toggleDelay: "Toggle delay",
    deleteEnded: "Purge ended cases",
    baseUrl: "Base URL (for scannable QR)",
    save: "Save",
    qrForCase: "QR for case",
    copyLink: "Copy link",
    open: "Open",
    tips: "Tips",
    tipsBullets: [
      "Open #/display on the main screen (TV).",
      "Open #/f/B0170 on your phone.",
      "Use Presenter to move the case through steps 1–7.",
      "Phones will sync automatically when you run the demo with node server.js."
    ]
  },
  es: {
    brandTitle: "Plan de Vuelo",
    brandSubtitle: "Rastreador para Familia (Demo)",
    homeKicker: "Kit demo",
    homeTitle: "PWA acompañante móvil",
    homeSubtitle: "Escanea un QR para seguir un caso. Minimalista, claro y enfocado en privacidad.",
    openFamily: "Abrir Vista Familiar",
    openDisplay: "Abrir Pantalla Sala de Espera",
    openPresenter: "Abrir Controles del Presentador",
    trackingCode: "Código de seguimiento",
    go: "Ir",
    delays: "Retrasos",
    pleaseRemember: "Recordatorio",
    delaysBullets: [
      "Hacemos lo posible por mantener el horario, pero pueden ocurrir retrasos.",
      "Si hay un retraso quirúrgico, haremos lo posible por mantenerle informado/a.",
      "Puede pedir actualizaciones en recepción en cualquier momento."
    ],
    rememberBullets: [
      "Mantenga el volumen del teléfono encendido.",
      "Si necesita salir de la sala de espera, puede pedir una actualización antes del procedimiento o preguntar al médico después."
    ],
    updated: "Actualizado",
    delayOn: "Con retraso",
    delayOff: "Sin retrasos",
    outcome: "Resultado",
    discharge: "Alta",
    inpatient: "Hospitalización",
    ended: "Completado",
    notFound: "Caso no encontrado.",
    backHome: "Volver",
    presenterTitle: "Controles del Presentador",
    presenterSubtitle: "Simula actualizaciones. El teléfono se sincroniza automáticamente (LAN).",
    createCase: "Crear caso",
    create: "Crear",
    setStatus: "Cambiar estado",
    toggleDelay: "Alternar retraso",
    deleteEnded: "Purgar casos finalizados",
    baseUrl: "URL base (para QR escaneable)",
    save: "Guardar",
    qrForCase: "QR del caso",
    copyLink: "Copiar enlace",
    open: "Abrir",
    tips: "Tips",
    tipsBullets: [
      "Abre #/display en la pantalla principal (TV).",
      "Abre #/f/B0170 en tu teléfono.",
      "Usa el panel para mover el caso por los pasos 1–7.",
      "El teléfono se sincroniza automáticamente al ejecutar node server.js."
    ]
  }
};

const steps = [
  { id: 1, colorVar: "--c1", icon: "⏳", en: "Waiting Room",            es: "Sala de espera" },
  { id: 2, colorVar: "--c2", icon: "🧾", en: "Pre-Procedure / Holding", es: "Pre-procedimiento / Preparación" },
  { id: 3, colorVar: "--c3", icon: "🏥", en: "In Procedure (OR)",       es: "En procedimiento (Quirófano)" },
  { id: 4, colorVar: "--c4", icon: "▶️", en: "Procedure Started",       es: "Procedimiento iniciado" },
  { id: 5, colorVar: "--c5", icon: "⏹️", en: "Procedure Ended",         es: "Procedimiento finalizado" },
  { id: 6, colorVar: "--c6", icon: "🛏️", en: "PACU (Recovery)",         es: "Recuperación (PACU)" },
  { id: 7, colorVar: "--c7", icon: "🚪", en: "Discharge / Inpatient",   es: "Alta / Hospitalización" }
];

function getLang(){ return localStorage.getItem(APP.langKey) || APP.defaultLang; }
function t(key){ const l = getLang(); return (i18n[l] && i18n[l][key]) || i18n.en[key] || key; }
function cssVar(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function stepLabel(stepId){ const l = getLang(); const s = steps.find(x=>x.id===stepId); return !s ? "" : (l==="es" ? s.es : s.en); }
function nowIso(){ return new Date().toISOString(); }

// Same-device sync
const bc = ("BroadcastChannel" in window) ? new BroadcastChannel("flight-plan-demo") : null;
function broadcast(msg){ if(bc) bc.postMessage(msg); }
if(bc){
  bc.onmessage = (ev)=>{
    const msg = ev.data;
    if(msg && msg.type === "state"){
      localStorage.setItem(APP.stateKey, JSON.stringify(msg.state));
      render();
    }
    if(msg && msg.type === "lang"){
      localStorage.setItem(APP.langKey, msg.lang);
      render();
    }
  };
}

// Cross-device LAN sync
function isHttpOrigin(){ return location.origin && location.origin.startsWith("http"); }
function isLocalhostHost(){
  const h = (location.hostname || "").toLowerCase();
  return h === "localhost" || h === "127.0.0.1";
}

async function serverGetState(){
  if(!isHttpOrigin()) return null;
  try{
    const res = await fetch("/api/state", { cache:"no-store" });
    if(!res.ok) return null;
    const data = await res.json();
    if(data && data.cases) return data;
    return null;
  }catch(e){ return null; }
}

let pushing = false;
async function serverPushState(state){
  if(!isHttpOrigin() || pushing) return;
  pushing = true;
  try{
    await fetch("/api/state", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(state) });
  }catch(e){}
  pushing = false;
}

function startSse(){
  if(!isHttpOrigin()) return;
  try{
    const es = new EventSource("/api/stream");
    es.onmessage = (ev)=>{
      try{
        const msg = JSON.parse(ev.data);
        if(msg && msg.type==="state" && msg.state && msg.state.cases){
          localStorage.setItem(APP.stateKey, JSON.stringify(msg.state));
          render();
        }
      }catch(e){}
    };
  }catch(e){}
}

/**
 * If running on localhost AND user hasn't overridden the base URL,
 * ask the local server for LAN IP candidates and store a detected base URL.
 */
async function ensureDetectedLanBaseUrl(){
  if(!isHttpOrigin()) return;
  if(!isLocalhostHost()) return;

  const override = localStorage.getItem(APP.baseUrlOverrideKey);
  if(override && override.trim()) return;

  const detected = localStorage.getItem(APP.baseUrlDetectedKey);
  if(detected && detected.trim()) return;

  try{
    const res = await fetch("/api/lan", { cache:"no-store" });
    if(!res.ok) return;
    const data = await res.json();
    const ips = Array.isArray(data.ips) ? data.ips : [];
    const port = data.port || 8000;

    const ip = ips.find(Boolean);
    if(!ip) return;

    const lan = `http://${ip}:${port}`;
    localStorage.setItem(APP.baseUrlDetectedKey, lan);
  }catch(e){}
}

function setLang(lang){
  localStorage.setItem(APP.langKey, lang);
  broadcast({ type:"lang", lang });
  render();
}

function seedState(){
  const st = {
    cases: {
      "B0170": { code:"B0170", status:1, delay:false, outcome:null, endedAt:null, createdAt:nowIso(), updatedAt:nowIso() },
      "B0171": { code:"B0171", status:2, delay:false, outcome:null, endedAt:null, createdAt:nowIso(), updatedAt:nowIso() },
      "B0172": { code:"B0172", status:4, delay:true,  outcome:null, endedAt:null, createdAt:nowIso(), updatedAt:nowIso() }
    }
  };
  localStorage.setItem(APP.stateKey, JSON.stringify(st));
  return st;
}
function loadState(){
  try{
    const raw = localStorage.getItem(APP.stateKey);
    if(!raw) return seedState();
    const st = JSON.parse(raw);
    if(!st || !st.cases) return seedState();
    return st;
  }catch(e){ return seedState(); }
}
function saveState(state){
  localStorage.setItem(APP.stateKey, JSON.stringify(state));
  broadcast({ type:"state", state });
  serverPushState(state);
}

function parseRoute(){
  const hash = location.hash || "";
  const path = hash.startsWith("#") ? hash.slice(1) : hash;
  const parts = path.split("/").filter(Boolean);
  if(parts[0] === "display") return { view:"display" };
  if(parts[0] === "presenter") return { view:"presenter" };
  if(parts[0] === "f" && parts[1]) return { view:"family", code: parts[1].toUpperCase() };
  return { view:"home" };
}

/**
 * Base URL used to build scannable QR links.
 * Priority:
 * 1) Manual override from Presenter UI
 * 2) Auto-detected LAN base URL (from /api/lan) when running on localhost
 * 3) Current origin (when already on LAN host)
 */
function baseUrl(){
  const override = localStorage.getItem(APP.baseUrlOverrideKey);
  if(override && override.trim()) return override.trim().replace(/\/$/,'');

  const detected = localStorage.getItem(APP.baseUrlDetectedKey);
  if(detected && detected.trim()) return detected.trim().replace(/\/$/,'');

  if(location.origin && location.origin.startsWith("http")) return location.origin.replace(/\/$/,'');
  return "";
}

function familyUrl(code){
  return `${baseUrl()}/#/f/${encodeURIComponent(code)}`;
}
function formatTime(iso){
  try{ return new Date(iso).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
  catch(e){ return ""; }
}

function statusTheme(stepId){
  const s = steps.find(x=>x.id===stepId) || steps[0];
  return { color: cssVar(s.colorVar), icon: s.icon, label: stepLabel(stepId) };
}

function el(tag, attrs={}, children=[]){
  const node = document.createElement(tag);
  for(const [k,v] of Object.entries(attrs)){
    if(k==="class") node.className = v;
    else if(k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if(v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for(const child of children){
    if(child===null || child===undefined) continue;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

function topbar(view){
  const lang = getLang();
  const sel = el("select", { "aria-label":"Language", onchange:(e)=>setLang(e.target.value) }, [
    el("option", { value:"en", selected: lang==="en" ? "selected":null }, ["EN"]),
    el("option", { value:"es", selected: lang==="es" ? "selected":null }, ["ES"])
  ]);

  const compact = (view === "family");

  const actionButtons = compact
    ? [
        el("div", { class:"pill" }, [ el("span", {}, ["🌐"]), sel ]),
        el("div", { class:"pill" }, [ el("button", { onclick:()=>location.hash="#/" }, [ "🏠" ]) ])
      ]
    : [
        el("div", { class:"pill" }, [ el("span", {}, ["🌐"]), sel ]),
        el("div", { class:"pill" }, [ el("button", { onclick:()=>location.hash="#/presenter" }, ["🎛️ ", t("openPresenter")]) ]),
        el("div", { class:"pill" }, [ el("button", { onclick:()=>location.hash="#/display" }, ["🖥️ ", t("openDisplay")]) ]),
        el("div", { class:"pill" }, [ el("button", { onclick:()=>location.hash="#/f/B0170" }, ["📱 ", t("openFamily")]) ]),
        el("div", { class:"pill" }, [ el("button", { onclick:()=>location.hash="#/" }, [ "🏠" ]) ])
      ];

  return el("div", { class: compact ? "topbar compact" : "topbar" }, [
    el("div", { class:"brand" }, [
      el("div", { class:"badge" }, [ el("span", { style:"font-size:20px" }, ["✈️"]) ]),
      el("div", {}, [
        el("div", { class:"title" }, [ t("brandTitle") ]),
        el("div", { class:"subtitle" }, [ t("brandSubtitle") ])
      ])
    ]),
    el("div", { class:"actions" }, actionButtons)
  ]);
}

function viewHome(root){
  const codeInput = el("input", { class:"input", value:"B0170" });
  const goBtn = el("button", { class:"btn primary", onclick:()=>{ const code = codeInput.value.toUpperCase().trim(); if(code) location.hash = `#/f/${encodeURIComponent(code)}`; }}, [ t("go") ]);
  root.appendChild(el("div", { class:"container" }, [
    el("div", { class:"grid two" }, [
      el("div", { class:"card section" }, [
        el("div", { class:"kicker" }, [ t("homeKicker") ]),
        el("div", { class:"h1" }, [ t("homeTitle") ]),
        el("div", { class:"h2" }, [ t("homeSubtitle") ]),
        el("div", { style:"height:14px" }),
        el("div", { class:"row" }, [
          el("div", { class:"tag" }, [ el("span", { class:"dot" }), "EN/ES" ]),
          el("div", { class:"tag" }, [ el("span", { class:"dot" }), "LAN Sync" ]),
          el("div", { class:"tag" }, [ el("span", { class:"dot" }), "QR-only" ])
        ]),
        el("div", { style:"height:16px" }),
        el("div", { class:"notice" }, [
          el("div", { class:"kicker" }, [ t("trackingCode") ]),
          el("div", { class:"row", style:"margin-top:8px" }, [ codeInput, goBtn ]),
          el("div", { class:"smallNote", style:"margin-top:10px" }, [ "Try: B0170, B0171, B0172" ])
        ])
      ]),
      el("div", { class:"card section" }, [
        el("div", { class:"panelTitle" }, [ el("h3", {}, [ t("tips") ]) ]),
        el("ul", { class:"list" }, (i18n[getLang()].tipsBullets || []).map(x=>el("li", {}, [x]))),
      ])
    ]),
    el("div", { class:"footer" }, [ "Flight Plan Demo Kit • Local-only prototype" ])
  ]));
}

function viewFamily(root, code){
  const st = loadState();
  const c = st.cases[code];
  if(!c){
    root.appendChild(el("div", { class:"container" }, [
      el("div", { class:"card section" }, [
        el("div", { class:"h1" }, [ t("notFound") ]),
        el("a", { class:"btn", href:"#/" }, [ "← ", t("backHome") ])
      ])
    ]));
    return;
  }
  const theme = statusTheme(c.status);
  const header = el("div", { class:"statusHeader", style:`background:${theme.color};` }, [
    el("div", {}, [
      el("div", { class:"label" }, [ t("trackingCode") ]),
      el("div", { class:"code" }, [ c.code ])
    ]),
    el("div", { class:"tag", style:"background:rgba(255,255,255,.18); border-color:rgba(255,255,255,.25); color:#fff;" }, [
      el("span", {}, [ c.delay ? "⚠️" : "✅" ]),
      el("span", {}, [ c.delay ? t("delayOn") : t("delayOff") ])
    ])
  ]);
  const body = el("div", { class:"statusBody" }, [
    el("div", { class:"bigStatus" }, [
      el("div", { class:"iconCircle" }, [ el("span", { style:"font-size:22px" }, [ theme.icon ]) ]),
      el("div", {}, [
        el("div", { class:"name" }, [ theme.label ]),
        el("div", { class:"meta" }, [ `${t("updated")}: ${formatTime(c.updatedAt)}` ])
      ])
    ]),
    el("div", { class:"progress" }, steps.map(s=>{
      const active = (s.id === c.status);
      const barColor = cssVar(s.colorVar);
      return el("div", { class: active ? "step active" : "step" }, [
        el("div", { class:"n" }, [ `#${s.id}` ]),
        el("div", { class:"t" }, [ getLang()==="es" ? s.es : s.en ]),
        el("div", { class:"bar" }, [ el("div", { style:`background:${barColor};` }) ])
      ]);
    })),
    c.endedAt ? el("div", { class:"notice", style:"margin-top:14px" }, [
      el("strong", {}, [ "✔ ", t("ended"), ". " ]),
      (c.outcome ? `${t("outcome")}: ${t(c.outcome)}.` : "")
    ]) : null,
  ]);
  root.appendChild(el("div", { class:"container" }, [ el("div", { class:"statusCard" }, [ header, body ]) ]));
}

function viewDisplay(root){
  const st = loadState();
  const activeCases = Object.values(st.cases).filter(c=>!c.endedAt).sort((a,b)=>a.code.localeCompare(b.code));
  root.appendChild(el("div", { class:"kiosk" }, [
    el("div", { class:"container", style:"max-width:1400px" }, [
      el("div", { class:"grid two" }, [
        el("div", { class:"card section" }, [
          el("div", { class:"panelTitle" }, [ el("h3", {}, [ "Active Cases" ]), el("div", { class:"smallNote" }, [ `${activeCases.length} live` ]) ]),
          el("div", { class:"tiles" }, activeCases.map(c=>{
            const th = statusTheme(c.status);
            const top = el("div", { class:"tileTop", style:`background:${th.color};` }, [
              el("div", {}, [ el("div", { class:"code" }, [ c.code ]), el("div", { class:"small" }, [ th.label ]) ]),
              el("div", { class:"small" }, [ c.delay ? "⚠️" : "✅" ])
            ]);
            const dots = el("div", { class:"miniProgress" }, steps.map(s=>{
              const d = el("span", { class: (s.id<=c.status ? "miniDot on":"miniDot") });
              if(s.id<=c.status) d.style.background = cssVar(s.colorVar);
              return d;
            }));
            const body = el("div", { class:"tileBody" }, [ el("div", {}, [ `${t("updated")}: ${formatTime(c.updatedAt)}` ]), dots ]);
            return el("div", { class:"tile" }, [ top, body ]);
          }))
        ]),
        el("div", { class:"split" }, [
          el("div", { class:"card section" }, [
            el("div", { class:"panelTitle" }, [ el("h3", {}, [ t("delays") ]) ]),
            el("ul", { class:"list" }, (i18n[getLang()].delaysBullets || []).map(x=>el("li", {}, [x]))),
          ]),
          el("div", { class:"card section" }, [
            el("div", { class:"panelTitle" }, [ el("h3", {}, [ t("pleaseRemember") ]) ]),
            el("ul", { class:"list" }, (i18n[getLang()].rememberBullets || []).map(x=>el("li", {}, [x]))),
          ])
        ])
      ]),
      el("div", { class:"footer" }, [ "Display view • TV-friendly layout • Status-only" ])
    ])
  ]));
}

async function copyToClipboard(text){
  try{ await navigator.clipboard.writeText(text); return true; }
  catch(e){
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); document.body.removeChild(ta); return true;
  }
}

/**
 * Dynamic QR image source built from the ACTUAL link we want to open.
 * This fixes the issue where old static PNGs still encode localhost.
 *
 * Uses a simple QR image endpoint that returns a QR PNG.
 * If the network blocks it, the "Copy link" button still works.
 */
function qrImgSrcForLink(link){
  const size = 260; // a bit larger for camera readability
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(link)}`;
}

function viewPresenter(root){
  const st = loadState();
  const codes = Object.keys(st.cases).sort();

  const overrideVal = localStorage.getItem(APP.baseUrlOverrideKey) || "";
  const detectedVal = localStorage.getItem(APP.baseUrlDetectedKey) || "";
  const suggested = (overrideVal || detectedVal || "").trim();

  const baseInput = el("input", {
    class:"input",
    value: suggested,
    placeholder: detectedVal ? detectedVal : "http://192.168.1.25:8000"
  });

  const useDetectedBtn = el("button", {
    class:"btn",
    onclick:()=>{
      const d = (localStorage.getItem(APP.baseUrlDetectedKey) || "").trim();
      if(!d) return;
      localStorage.setItem(APP.baseUrlOverrideKey, d.replace(/\/$/,''));
      render();
    }
  }, [ "✨ Use detected" ]);

  const saveBaseBtn = el("button", { class:"btn primary", onclick:()=>{
    const v = baseInput.value.trim();
    if(v) localStorage.setItem(APP.baseUrlOverrideKey, v.replace(/\/$/,''));
    else localStorage.removeItem(APP.baseUrlOverrideKey);
    render();
  }}, [ t("save") ]);

  const clearBaseBtn = el("button", { class:"btn", onclick:()=>{
    localStorage.removeItem(APP.baseUrlOverrideKey);
    render();
  }}, [ "Clear" ]);

  const newCode = el("input", { class:"input", placeholder:"B0200" });
  const createBtn = el("button", { class:"btn primary", onclick:()=>{
    const c = newCode.value.toUpperCase().trim();
    if(!c) return;
    const st2 = loadState();
    st2.cases[c] = { code:c, status:1, delay:false, outcome:null, endedAt:null, createdAt:nowIso(), updatedAt:nowIso() };
    saveState(st2);
    newCode.value = "";
  }}, [ "➕ ", t("create") ]);

  const caseSelect = el("select", { class:"input", style:"max-width:220px" }, codes.map(c=>el("option", { value:c }, [c])));
  const statusSelect = el("select", { class:"input", style:"max-width:360px" }, steps.map(s=>el("option", { value:String(s.id) }, [ `#${s.id} — ${getLang()==="es" ? s.es : s.en}` ])));

  function setStatus(){
    const code = caseSelect.value;
    const status = parseInt(statusSelect.value,10);
    const st2 = loadState();
    if(!st2.cases[code]) return;
    st2.cases[code].status = status;
    st2.cases[code].updatedAt = nowIso();
    saveState(st2);
  }
  function toggleDelay(){
    const code = caseSelect.value;
    const st2 = loadState();
    if(!st2.cases[code]) return;
    st2.cases[code].delay = !st2.cases[code].delay;
    st2.cases[code].updatedAt = nowIso();
    saveState(st2);
  }
  function endCase(outcome){
    const code = caseSelect.value;
    const st2 = loadState();
    if(!st2.cases[code]) return;
    st2.cases[code].status = 7;
    st2.cases[code].outcome = outcome;
    st2.cases[code].endedAt = nowIso();
    st2.cases[code].updatedAt = nowIso();
    saveState(st2);
  }
  function purgeEnded(){
    const st2 = loadState();
    for(const k of Object.keys(st2.cases)){
      if(st2.cases[k].endedAt) delete st2.cases[k];
    }
    saveState(st2);
  }

  const setBtn = el("button", { class:"btn", onclick:setStatus }, [ "✅ ", t("setStatus") ]);
  const delayBtn = el("button", { class:"btn", onclick:toggleDelay }, [ "⚠️ ", t("toggleDelay") ]);
  const endDis = el("button", { class:"btn danger", onclick:()=>endCase("discharge") }, [ "🚪 ", t("discharge") ]);
  const endIn  = el("button", { class:"btn danger", onclick:()=>endCase("inpatient") }, [ "🛏️ ", t("inpatient") ]);
  const purgeBtn= el("button", { class:"btn", onclick:purgeEnded }, [ "🧹 ", t("deleteEnded") ]);

  const qrBox = el("div", { class:"card section" });

  function refreshQr(){
    qrBox.innerHTML = "";
    const code = caseSelect.value || "B0170";
    const link = familyUrl(code);

    const img = el("img", {
      src: qrImgSrcForLink(link),
      alt: `QR for ${code}`,
      style:"width:260px; height:260px; border-radius:16px; border:1px solid var(--border); background:#fff;"
    });

    const copyBtn = el("button", { class:"btn", onclick:()=>copyToClipboard(link) }, [ "📋 ", t("copyLink") ]);
    const openBtn = el("a", { class:"btn primary", href:`#/f/${encodeURIComponent(code)}` }, [ "📱 ", t("open") ]);

    const warn = (isLocalhostHost() && !(localStorage.getItem(APP.baseUrlOverrideKey) || "").trim())
      ? el("div", { class:"notice", style:"margin-top:10px" }, [
          el("div", { class:"kicker" }, [ "LAN QR Tip" ]),
          el("div", { class:"smallNote", style:"margin-top:6px" }, [
            "Scanning must use your LAN IP (not localhost). Use “Use detected” or paste your LAN URL above and Save."
          ])
        ])
      : null;

    qrBox.appendChild(el("div", { class:"panelTitle" }, [
      el("h3", {}, [ `${t("qrForCase")} ${code}` ]),
      el("div", { class:"smallNote" }, [ link ])
    ]));

    qrBox.appendChild(el("div", { class:"row" }, [
      img,
      el("div", { style:"min-width:260px; max-width:520px" }, [
        el("div", { class:"notice" }, [
          el("div", { class:"kicker" }, [ t("baseUrl") ]),
          el("div", { class:"smallNote", style:"margin-top:6px" }, [ link ])
        ]),
        el("div", { class:"row", style:"margin-top:10px" }, [ copyBtn, openBtn ]),
        warn
      ])
    ]));
  }
  caseSelect.addEventListener("change", refreshQr);

  root.appendChild(el("div", { class:"container" }, [
    el("div", { class:"grid two" }, [
      el("div", { class:"card section" }, [
        el("div", { class:"h1" }, [ t("presenterTitle") ]),
        el("div", { class:"h2" }, [ t("presenterSubtitle") ]),
        el("div", { style:"height:14px" }),
        el("div", { class:"notice" }, [
          el("div", { class:"kicker" }, [ t("baseUrl") ]),
          el("div", { class:"row", style:"margin-top:8px" }, [
            baseInput,
            saveBaseBtn,
            clearBaseBtn,
            detectedVal ? useDetectedBtn : null
          ].filter(Boolean)),
          detectedVal ? el("div", { class:"smallNote", style:"margin-top:8px" }, [
            `Detected: ${detectedVal}`
          ]) : el("div", { class:"smallNote", style:"margin-top:8px" }, [
            "No LAN IP detected yet. Run: node server.js (so /api/lan is available)."
          ])
        ]),
        el("div", { style:"height:14px" }),
        el("div", { class:"notice" }, [
          el("div", { class:"kicker" }, [ t("createCase") ]),
          el("div", { class:"row", style:"margin-top:8px" }, [ newCode, createBtn ])
        ]),
        el("div", { style:"height:14px" }),
        el("div", { class:"notice" }, [
          el("div", { class:"kicker" }, [ "Live case controls" ]),
          el("div", { class:"row", style:"margin-top:8px" }, [ caseSelect, statusSelect, setBtn, delayBtn, endDis, endIn, purgeBtn ])
        ]),
        el("div", { style:"height:14px" }),
        el("div", { class:"panelTitle" }, [ el("h3", {}, [ t("tips") ]) ]),
        el("ul", { class:"list" }, (i18n[getLang()].tipsBullets || []).map(x=>el("li", {}, [x])))
      ]),
      qrBox
    ]),
    el("div", { class:"footer" }, [ "Presenter controls • Cross-device sync enabled" ])
  ]));
  refreshQr();
}

function render(){
  const appRoot = document.getElementById("app");
  if(!appRoot) return;

  const route = parseRoute();

  appRoot.innerHTML = "";
  appRoot.appendChild(topbar(route.view));

  const body = el("div", { id:"view" });
  appRoot.appendChild(body);

  if(route.view==="home") viewHome(body);
  if(route.view==="family") viewFamily(body, route.code);
  if(route.view==="display") viewDisplay(body);
  if(route.view==="presenter") viewPresenter(body);
}

window.addEventListener("hashchange", render);
window.addEventListener("load", async ()=>{
  await ensureDetectedLanBaseUrl();

  const st = await serverGetState();
  if(st){
    localStorage.setItem(APP.stateKey, JSON.stringify(st));
  }else{
    const local = loadState();
    await serverPushState(local);
  }
  startSse();
  render();
});
