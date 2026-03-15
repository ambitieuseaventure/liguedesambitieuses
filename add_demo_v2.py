#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Demo guided experience v2 — safe implementation.

Instead of a JS click interceptor (which broke navigation),
we use a transparent shield <div> positioned over the content area
(below topbar z-index, above page content z-index).

All demo UI (modal, tooltip, shield, toast) has higher z-index than the shield.
The sidebar (z:100) and topbar (z:50) are naturally above the shield (z:48).
"""

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# ══════════════════════════════════════════════════════════════════════
# 1.  CSS
# ══════════════════════════════════════════════════════════════════════
NEW_CSS = """
  /* ── DÉMO GUIDÉE : composants UI ── */

  /* Bouclier transparent (bloque les clics sur le contenu, invisible) */
  #demo-shield {
    display: none;
    position: fixed;
    top: 52px;          /* sous la barre démo */
    left: 240px;        /* à droite du sidebar */
    right: 0; bottom: 0;
    z-index: 48;        /* sous topbar (z:50) et sidebar (z:100), sur le contenu */
    cursor: default;
    background: transparent;
  }
  body.demo-mode #demo-shield { display: block; }
  @media(max-width:900px) { #demo-shield { left: 0; } }

  /* Modale de bienvenue */
  #demo-welcome-modal {
    display: none;
    position: fixed; inset: 0; z-index: 500;
    background: rgba(20,36,53,0.80); backdrop-filter: blur(8px);
    align-items: center; justify-content: center; padding: 20px;
  }
  #demo-welcome-modal.open { display: flex; }
  .dwc {
    background: white; border-radius: 22px; padding: 40px 44px;
    max-width: 520px; width: 100%;
    box-shadow: 0 40px 100px rgba(20,36,53,0.4);
    text-align: center;
  }
  .dwc-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(252,186,51,0.1); color: var(--gold-bright);
    border: 1px solid rgba(252,186,51,0.28); border-radius: 20px;
    padding: 5px 14px; font-size: 11.5px; font-weight: 700;
    font-family: 'DM Sans', sans-serif; margin-bottom: 18px;
  }
  .dwc-title {
    font-family: 'Playfair Display', serif; font-size: 25px;
    color: var(--navy-darkest); margin-bottom: 12px; line-height: 1.25;
  }
  .dwc-desc {
    font-size: 14px; color: var(--text-mid); font-family: 'DM Sans', sans-serif;
    line-height: 1.65; margin-bottom: 18px;
  }
  .dwc-features {
    background: #f4f7fa; border-radius: 12px; padding: 14px 18px;
    margin-bottom: 18px; text-align: left; list-style: none;
  }
  .dwc-features li {
    font-size: 13px; color: var(--text-dark); font-family: 'DM Sans', sans-serif;
    padding: 4px 0; display: flex; gap: 8px; line-height: 1.4;
  }
  .dwc-note {
    font-size: 12.5px; color: #6b7a8d; font-family: 'DM Sans', sans-serif;
    background: rgba(235,193,76,0.07); border: 1px solid rgba(235,193,76,0.22);
    border-radius: 9px; padding: 10px 16px; margin-bottom: 24px; line-height: 1.5;
  }
  .dwc-actions { display: flex; flex-direction: column; gap: 10px; }
  .dwc-btn-main {
    background: var(--gold-bright); color: var(--navy-darkest);
    border: none; border-radius: 11px; padding: 15px 32px;
    font-size: 15px; font-weight: 700; cursor: pointer;
    font-family: 'DM Sans', sans-serif; width: 100%; transition: opacity .2s;
  }
  .dwc-btn-main:hover { opacity: .87; }
  .dwc-btn-skip {
    background: none; border: none; color: var(--text-light);
    font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif;
    text-decoration: underline; transition: color .15s; padding: 0;
  }
  .dwc-btn-skip:hover { color: var(--text-dark); }

  /* Tooltip guidé */
  #demo-tooltip {
    display: none;
    position: fixed; z-index: 200;
    bottom: 28px; left: 264px;
    width: 330px;
    background: var(--navy-darkest); color: white;
    border-radius: 14px; padding: 18px 20px;
    box-shadow: 0 14px 44px rgba(20,36,53,0.45);
    border: 1px solid rgba(235,193,76,0.28);
    pointer-events: auto;
  }
  #demo-tooltip.open { display: block; }
  .dtt-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .dtt-icon { font-size: 19px; flex-shrink: 0; }
  .dtt-title {
    font-family: 'Playfair Display', serif; font-size: 15px;
    color: var(--gold); font-weight: 600; flex: 1; line-height: 1.2;
  }
  .dtt-close {
    width: 24px; height: 24px; border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.2); background: transparent;
    color: rgba(255,255,255,0.5); font-size: 12px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s; flex-shrink: 0;
    pointer-events: auto;
  }
  .dtt-close:hover { background: rgba(255,255,255,0.12); color: white; }
  .dtt-text {
    font-size: 13px; color: rgba(255,255,255,0.75); font-family: 'DM Sans', sans-serif;
    line-height: 1.55; margin-bottom: 14px;
  }
  .dtt-footer { display: flex; align-items: center; justify-content: space-between; }
  .dtt-progress { font-size: 11px; color: rgba(255,255,255,0.38); font-family: 'DM Sans', sans-serif; }
  .dtt-next {
    background: var(--gold-bright); color: var(--navy-darkest);
    border: none; border-radius: 7px; padding: 7px 16px;
    font-size: 12px; font-weight: 700; cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: opacity .2s;
    pointer-events: auto;
  }
  .dtt-next:hover { opacity: .85; }

  /* Toast "action bloquée" */
  #demo-toast {
    display: none;
    position: fixed; z-index: 300;
    bottom: 100px; left: 50%; transform: translateX(-50%);
    background: var(--navy-darkest); color: white;
    border-radius: 10px; padding: 11px 22px;
    font-size: 13px; font-family: 'DM Sans', sans-serif;
    border: 1px solid rgba(235,193,76,0.3);
    box-shadow: 0 8px 28px rgba(20,36,53,0.35);
    white-space: nowrap; pointer-events: none;
  }
  #demo-toast.show { display: block; }

"""

CSS_ANCHOR = "  </style>\n</head>"
assert CSS_ANCHOR in html, "CSS anchor not found"
html = html.replace(CSS_ANCHOR, NEW_CSS + "  </style>\n</head>", 1)
print("✓ CSS added")

# ══════════════════════════════════════════════════════════════════════
# 2.  HTML – shield + welcome modal + tooltip + toast
#     Inserted after demo-pub-bar closing </div>
# ══════════════════════════════════════════════════════════════════════
DEMO_HTML = """
<!-- ── BOUCLIER DÉMO (bloque les clics sur le contenu) ── -->
<div id="demo-shield" onclick="demoShieldClick()"></div>

<!-- ── MODALE DE BIENVENUE DÉMO ── -->
<div id="demo-welcome-modal">
  <div class="dwc">
    <div class="dwc-badge">◆ Niveau Visionnaire · Mode démo</div>
    <h2 class="dwc-title">Bienvenue dans l'espace<br>membre Visionnaire ✦</h2>
    <p class="dwc-desc">Explore l'espace membre de La Ligue des Ambitieuses, tel qu'il apparaîtra après ton abonnement.</p>
    <ul class="dwc-features">
      <li>🏠 Dashboard priorisé pour savoir quoi faire chaque semaine</li>
      <li>🎓 Formations complètes à suivre à ton rythme</li>
      <li>🤝 Communauté de 200+ entrepreneuses bienveillantes</li>
      <li>📅 Masterclasses, Q&amp;R live et événements</li>
      <li>🎯 Coaching individuel &amp; outils exclusifs Visionnaire</li>
    </ul>
    <p class="dwc-note">💡 La démo est en mode lecture seule — aucune action n'est réalisable. Des infobulles guideront ta découverte.</p>
    <div class="dwc-actions">
      <button class="dwc-btn-main" onclick="demoStartTour()">Commencer la visite guidée →</button>
      <button class="dwc-btn-skip" onclick="demoSkipTour()">Explorer librement (sans guide)</button>
    </div>
  </div>
</div>

<!-- ── TOOLTIP GUIDÉ ── -->
<div id="demo-tooltip">
  <div class="dtt-header">
    <span class="dtt-icon" id="dtt-icon">🏠</span>
    <span class="dtt-title" id="dtt-title">Ton tableau de bord</span>
    <button class="dtt-close" onclick="demoHideTooltip()" title="Fermer le guide">✕</button>
  </div>
  <p class="dtt-text" id="dtt-text"></p>
  <div class="dtt-footer">
    <span class="dtt-progress" id="dtt-progress">Étape 1 / 9</span>
    <button class="dtt-next" id="dtt-next" onclick="demoNextPage()">Page suivante →</button>
  </div>
</div>

<!-- ── TOAST ACTION BLOQUÉE ── -->
<div id="demo-toast">🔒 Cette fonctionnalité est disponible après abonnement</div>

"""

DEMO_HTML_ANCHOR = "</div>\n\n<button class=\"hamburger\" onclick=\"toggleSidebar()\">☰</button>"
assert DEMO_HTML_ANCHOR in html, "HTML anchor not found"
html = html.replace(
    DEMO_HTML_ANCHOR,
    "</div>\n" + DEMO_HTML + "\n<button class=\"hamburger\" onclick=\"toggleSidebar()\">☰</button>",
    1
)
print("✓ Demo HTML elements added")

# ══════════════════════════════════════════════════════════════════════
# 3.  Update enterDemoMode() – show welcome modal + set Visionnaire
# ══════════════════════════════════════════════════════════════════════
OLD_ENTER_END = """    if (window.innerWidth <= 900) sidebar.classList.remove('open');
  }

  function exitDemoMode()"""
NEW_ENTER_END = """    if (window.innerWidth <= 900) sidebar.classList.remove('open');
    // Force Visionnaire level
    if (typeof setCurrentSubscription === 'function') {
      setCurrentSubscription('visionnaire');
      if (typeof updateSidebarLockState === 'function') updateSidebarLockState();
    }
    // Reset tour state and show welcome
    _demoTourIdx = 0;
    _demoGuided = true;
    openDemoWelcome();
  }

  function exitDemoMode()"""
assert OLD_ENTER_END in html, "enterDemoMode end not found"
html = html.replace(OLD_ENTER_END, NEW_ENTER_END, 1)
print("✓ enterDemoMode() updated")

# ══════════════════════════════════════════════════════════════════════
# 4.  Update showPage() – show tooltip per page when in demo mode
# ══════════════════════════════════════════════════════════════════════
OLD_SHOWPAGE_END = """    if (window.innerWidth <= 900) sidebar.classList.remove('open');
  }

  function enterDemoMode()"""
NEW_SHOWPAGE_END = """    if (window.innerWidth <= 900) sidebar.classList.remove('open');
    if (document.body.classList.contains('demo-mode') && _demoGuided) {
      setTimeout(function() { demoShowTooltip(page); }, 250);
    }
  }

  function enterDemoMode()"""
assert OLD_SHOWPAGE_END in html, "showPage end not found"
html = html.replace(OLD_SHOWPAGE_END, NEW_SHOWPAGE_END, 1)
print("✓ showPage() updated")

# ══════════════════════════════════════════════════════════════════════
# 5.  Add demo JS functions (before profileSwitchTab)
# ══════════════════════════════════════════════════════════════════════
DEMO_JS = r"""
  // ── DÉMO GUIDÉE ──────────────────────────────────────────────────
  var _demoTourIdx  = 0;
  var _demoGuided   = true;
  var _demoToastTmr = null;
  var _demoTourPages = [
    'dashboard','classroom','community','resources',
    'evenements','coaching','hotline','plan','profil'
  ];
  var _demoTips = {
    dashboard:  { icon:'🏠', title:'Ton tableau de bord',     text:'Chaque semaine commence ici\u00a0: formations en cours, focus du jour, agenda et to-do list — tout en un seul endroit, prioris\u00e9 pour toi.' },
    classroom:  { icon:'🎓', title:'Tes formations',           text:'Des parcours guid\u00e9s et complets pour avancer sur tes priorit\u00e9s. Tu progresses \u00e0 ton rythme, dans l\'ordre qui te convient.' },
    community:  { icon:'🤝', title:'La communaut\u00e9',       text:'200+ entrepreneuses qui avancent comme toi. Partage tes victoires, pose tes questions et trouve du soutien au quotidien.' },
    resources:  { icon:'📚', title:'Les ressources',           text:'Templates, guides et outils \u00e0 t\u00e9l\u00e9charger pour aller plus vite. Mis \u00e0 jour r\u00e9guli\u00e8rement avec du contenu exclusif.' },
    evenements: { icon:'📅', title:'Les \u00e9v\u00e9nements', text:'Masterclasses, sessions Q\u00a0&\u00a0R en live et ateliers pratiques\u00a0\u2014 un calendrier riche pour ne jamais avancer seule.' },
    coaching:   { icon:'🎯', title:'Coaching 1-1',             text:'Sessions individuelles avec Sarah Martin pour d\u00e9bloquer tes points de friction. Exclusif au niveau Visionnaire.' },
    hotline:    { icon:'📞', title:'Hotline Business',         text:'Un appel rapide avec une experte pour r\u00e9soudre une situation pr\u00e9cise\u00a0\u2014 en moins de 24\u00a0h. Exclusif Visionnaire.' },
    plan:       { icon:'📋', title:"Plan d\u2019action",       text:"Tes objectifs traduits en actions concr\u00e8tes semaine par semaine. Fini la question \u00ab\u00a0par o\u00f9 je commence\u00a0?\u00a0\u00bb" },
    profil:     { icon:'👤', title:'Ton profil',               text:'Personnalise ton espace, choisis tes domaines de focus et suis l\u2019\u00e9volution de ta progression.' }
  };

  function openDemoWelcome() {
    document.getElementById('demo-welcome-modal').classList.add('open');
  }

  function demoStartTour() {
    document.getElementById('demo-welcome-modal').classList.remove('open');
    _demoGuided = true;
    _demoTourIdx = 0;
    demoShowTooltip('dashboard');
  }

  function demoSkipTour() {
    document.getElementById('demo-welcome-modal').classList.remove('open');
    _demoGuided = false;
    document.getElementById('demo-tooltip').classList.remove('open');
  }

  function demoShowTooltip(page) {
    var tip = _demoTips[page];
    if (!tip) return;
    var idx = _demoTourPages.indexOf(page);
    if (idx >= 0) _demoTourIdx = idx;
    document.getElementById('dtt-icon').textContent  = tip.icon;
    document.getElementById('dtt-title').textContent = tip.title;
    document.getElementById('dtt-text').textContent  = tip.text;
    document.getElementById('dtt-progress').textContent =
      'Étape ' + (_demoTourIdx + 1) + '\u00a0/\u00a0' + _demoTourPages.length;
    var btn = document.getElementById('dtt-next');
    if (_demoTourIdx >= _demoTourPages.length - 1) {
      btn.textContent = 'Terminer la visite ✓';
      btn.onclick = demoHideTooltip;
    } else {
      btn.textContent = 'Page suivante →';
      btn.onclick = demoNextPage;
    }
    document.getElementById('demo-tooltip').classList.add('open');
  }

  function demoHideTooltip() {
    document.getElementById('demo-tooltip').classList.remove('open');
    _demoGuided = false;
  }

  function demoNextPage() {
    _demoTourIdx = Math.min(_demoTourIdx + 1, _demoTourPages.length - 1);
    showPage(_demoTourPages[_demoTourIdx]);
  }

  function demoShieldClick() {
    clearTimeout(_demoToastTmr);
    var t = document.getElementById('demo-toast');
    t.classList.add('show');
    _demoToastTmr = setTimeout(function() { t.classList.remove('show'); }, 2200);
  }

"""

PROFILE_TAB_ANCHOR = "\n  function profileSwitchTab"
assert PROFILE_TAB_ANCHOR in html, "profileSwitchTab anchor not found"
html = html.replace(PROFILE_TAB_ANCHOR, DEMO_JS + "\n  function profileSwitchTab", 1)
print("✓ Demo JS functions added")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("\n✅ Demo v2 applied successfully!")
