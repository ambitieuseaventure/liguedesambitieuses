#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Add guided demo features:
- Welcome popup when entering demo mode
- Per-page guided tooltips
- Click interceptor (read-only: blocks all non-navigation interactions)
- Force Visionnaire level in demo mode
"""

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# ══════════════════════════════════════════════════════════════════════
# 1. CSS
# ══════════════════════════════════════════════════════════════════════
NEW_CSS = """
  /* ── DÉMO : Modale de bienvenue ── */
  #demo-welcome-modal {
    display: none; position: fixed; inset: 0; z-index: 450;
    background: rgba(20,36,53,0.78); backdrop-filter: blur(8px);
    align-items: center; justify-content: center; padding: 20px;
  }
  #demo-welcome-modal.visible { display: flex; }
  .demo-welcome-card {
    background: white; border-radius: 22px; padding: 40px 44px;
    max-width: 520px; width: 100%;
    box-shadow: 0 40px 100px rgba(20,36,53,0.4);
    text-align: center;
  }
  .demo-welcome-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(252,186,51,0.1); color: var(--gold-bright);
    border: 1px solid rgba(252,186,51,0.28); border-radius: 20px;
    padding: 5px 14px; font-size: 11.5px; font-weight: 700;
    font-family: 'DM Sans', sans-serif; margin-bottom: 18px;
  }
  .demo-welcome-title {
    font-family: 'Playfair Display', serif; font-size: 26px;
    color: var(--navy-darkest); margin-bottom: 12px; line-height: 1.25;
  }
  .demo-welcome-desc {
    font-size: 14px; color: var(--text-mid); font-family: 'DM Sans', sans-serif;
    line-height: 1.65; margin-bottom: 20px;
  }
  .demo-welcome-features {
    background: #f4f7fa; border-radius: 12px; padding: 14px 18px;
    margin-bottom: 18px; text-align: left; list-style: none;
  }
  .demo-welcome-features li {
    font-size: 13px; color: var(--text-dark); font-family: 'DM Sans', sans-serif;
    padding: 5px 0; display: flex; align-items: flex-start; gap: 8px; line-height: 1.4;
  }
  .demo-welcome-note {
    font-size: 12.5px; color: #6b7a8d; font-family: 'DM Sans', sans-serif;
    background: rgba(235,193,76,0.07); border: 1px solid rgba(235,193,76,0.22);
    border-radius: 9px; padding: 10px 16px; margin-bottom: 26px; line-height: 1.5;
  }
  .demo-welcome-actions { display: flex; flex-direction: column; gap: 10px; align-items: center; }
  .demo-welcome-btn-primary {
    background: var(--gold-bright); color: var(--navy-darkest);
    border: none; border-radius: 11px; padding: 15px 32px;
    font-size: 15px; font-weight: 700; cursor: pointer;
    font-family: 'DM Sans', sans-serif; width: 100%; transition: opacity .2s;
  }
  .demo-welcome-btn-primary:hover { opacity: .87; }
  .demo-welcome-btn-skip {
    background: none; border: none; color: var(--text-light);
    font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif;
    text-decoration: underline; transition: color .15s; padding: 0;
  }
  .demo-welcome-btn-skip:hover { color: var(--text-dark); }

  /* ── DÉMO : Tooltip guidé ── */
  #demo-tooltip {
    display: none; position: fixed; z-index: 400;
    bottom: 28px; left: 264px;
    width: 330px;
    background: var(--navy-darkest); color: white;
    border-radius: 14px; padding: 18px 20px;
    box-shadow: 0 14px 44px rgba(20,36,53,0.45);
    border: 1px solid rgba(235,193,76,0.28);
  }
  .demo-tooltip-header {
    display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
  }
  .demo-tooltip-icon { font-size: 19px; flex-shrink: 0; }
  .demo-tooltip-title {
    font-family: 'Playfair Display', serif; font-size: 15px;
    color: var(--gold); font-weight: 600; flex: 1; line-height: 1.2;
  }
  .demo-tooltip-close {
    width: 24px; height: 24px; border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.2); background: transparent;
    color: rgba(255,255,255,0.5); font-size: 12px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s; flex-shrink: 0; line-height: 1;
  }
  .demo-tooltip-close:hover { background: rgba(255,255,255,0.12); color: white; }
  .demo-tooltip-text {
    font-size: 13px; color: rgba(255,255,255,0.75); font-family: 'DM Sans', sans-serif;
    line-height: 1.55; margin-bottom: 14px;
  }
  .demo-tooltip-footer { display: flex; align-items: center; justify-content: space-between; }
  .demo-tooltip-progress {
    font-size: 11px; color: rgba(255,255,255,0.38); font-family: 'DM Sans', sans-serif;
  }
  .demo-tooltip-next {
    background: var(--gold-bright); color: var(--navy-darkest);
    border: none; border-radius: 7px; padding: 7px 16px;
    font-size: 12px; font-weight: 700; cursor: pointer;
    font-family: 'DM Sans', sans-serif; transition: opacity .2s;
  }
  .demo-tooltip-next:hover { opacity: .85; }

  /* ── DÉMO : Toast "action bloquée" ── */
  #demo-block-toast {
    display: none; position: fixed; z-index: 460;
    bottom: 90px; left: 50%; transform: translateX(-50%);
    background: var(--navy-darkest); color: white;
    border-radius: 10px; padding: 11px 22px;
    font-size: 13px; font-family: 'DM Sans', sans-serif;
    border: 1px solid rgba(235,193,76,0.3);
    box-shadow: 0 8px 28px rgba(20,36,53,0.35);
    white-space: nowrap; pointer-events: none;
  }

"""

CSS_ANCHOR = "  </style>\n</head>"
assert CSS_ANCHOR in html, "CSS anchor not found"
html = html.replace(CSS_ANCHOR, NEW_CSS + "  </style>\n</head>", 1)
print("✓ CSS added")

# ══════════════════════════════════════════════════════════════════════
# 2. HTML – welcome modal + tooltip + toast (after demo-pub-bar)
# ══════════════════════════════════════════════════════════════════════
DEMO_MODALS = """
<!-- ── MODALE DE BIENVENUE DÉMO ── -->
<div id="demo-welcome-modal">
  <div class="demo-welcome-card">
    <div class="demo-welcome-badge">◆ Niveau Visionnaire · Mode démo</div>
    <h2 class="demo-welcome-title">Bienvenue dans l'espace<br>membre Visionnaire ✦</h2>
    <p class="demo-welcome-desc">Tu es sur le point d'explorer l'espace membre de La Ligue des Ambitieuses, tel qu'il apparaîtra après ton abonnement Visionnaire.</p>
    <ul class="demo-welcome-features">
      <li>🏠 Dashboard priorisé pour savoir quoi faire chaque semaine</li>
      <li>🎓 Formations complètes à suivre à ton rythme</li>
      <li>🤝 Communauté de 200+ entrepreneuses bienveillantes</li>
      <li>📅 Masterclasses, sessions Q&amp;R live et événements</li>
      <li>🎯 Coaching individuel et outils exclusifs Visionnaire</li>
    </ul>
    <p class="demo-welcome-note">💡 Cette démo est en mode lecture seule — aucune action n'est réalisable. Des infobulles guideront ta découverte page par page.</p>
    <div class="demo-welcome-actions">
      <button class="demo-welcome-btn-primary" onclick="startDemoTour()">Commencer la visite guidée →</button>
      <button class="demo-welcome-btn-skip" onclick="skipDemoTour()">Explorer librement (sans guide)</button>
    </div>
  </div>
</div>

<!-- ── TOOLTIP GUIDÉ ── -->
<div id="demo-tooltip">
  <div class="demo-tooltip-header">
    <span class="demo-tooltip-icon" id="demo-tt-icon">🏠</span>
    <span class="demo-tooltip-title" id="demo-tt-title">Ton tableau de bord</span>
    <button class="demo-tooltip-close" onclick="hideDemoTooltip()" title="Masquer le guide">✕</button>
  </div>
  <p class="demo-tooltip-text" id="demo-tt-text"></p>
  <div class="demo-tooltip-footer">
    <span class="demo-tooltip-progress" id="demo-tt-progress">Étape 1 / 8</span>
    <button class="demo-tooltip-next" id="demo-tt-next" onclick="demoTooltipNext()">Page suivante →</button>
  </div>
</div>

<!-- ── TOAST ACTION BLOQUÉE ── -->
<div id="demo-block-toast">🔒 Cette fonctionnalité est disponible après abonnement</div>

"""

HTML_ANCHOR = "</div>\n\n<button class=\"hamburger\" onclick=\"toggleSidebar()\">☰</button>"
assert HTML_ANCHOR in html, "HTML anchor (after demo-pub-bar) not found"
html = html.replace(HTML_ANCHOR, "</div>\n" + DEMO_MODALS + "\n<button class=\"hamburger\" onclick=\"toggleSidebar()\">☰</button>", 1)
print("✓ Welcome modal + tooltip + toast HTML added")

# ══════════════════════════════════════════════════════════════════════
# 3. Update enterDemoMode() – show welcome modal + force Visionnaire
# ══════════════════════════════════════════════════════════════════════
OLD_ENTER = """    if (window.innerWidth <= 900) sidebar.classList.remove('open');
  }

  function exitDemoMode()"""
NEW_ENTER = """    if (window.innerWidth <= 900) sidebar.classList.remove('open');
    // Force Visionnaire level for demo
    if (typeof setCurrentSubscription === 'function') {
      setCurrentSubscription('visionnaire');
      if (typeof updateSidebarLockState === 'function') updateSidebarLockState();
    }
    // Reset demo tooltip state
    demoTooltipsEnabled = true;
    demoTourCurrentIndex = 0;
    // Show welcome modal
    openDemoWelcome();
  }

  function exitDemoMode()"""
assert OLD_ENTER in html, "enterDemoMode() end not found"
html = html.replace(OLD_ENTER, NEW_ENTER, 1)
print("✓ enterDemoMode() updated")

# ══════════════════════════════════════════════════════════════════════
# 4. Update showPage() – show tooltip when navigating in demo mode
# ══════════════════════════════════════════════════════════════════════
OLD_SHOWPAGE_END = """    if (window.innerWidth <= 900) sidebar.classList.remove('open');
  }

  function enterDemoMode()"""
NEW_SHOWPAGE_END = """    if (window.innerWidth <= 900) sidebar.classList.remove('open');
    // Demo mode: show contextual tooltip for this page
    if (document.body.classList.contains('demo-mode') && demoTooltipsEnabled) {
      setTimeout(function() { showDemoTooltip(page); }, 220);
    }
  }

  function enterDemoMode()"""
assert OLD_SHOWPAGE_END in html, "showPage() end not found"
html = html.replace(OLD_SHOWPAGE_END, NEW_SHOWPAGE_END, 1)
print("✓ showPage() updated with tooltip hook")

# ══════════════════════════════════════════════════════════════════════
# 5. Add demo JS functions (before profileSwitchTab)
# ══════════════════════════════════════════════════════════════════════
DEMO_JS = """
  // ── DONNÉES DES TOOLTIPS DE DÉMO ──
  var demoTooltipsEnabled = true;
  var demoTourCurrentIndex = 0;
  var demoTourOrder = ['dashboard','classroom','community','resources','evenements','coaching','hotline','plan','profil'];
  var demoPageTooltips = {
    dashboard:  { icon:'🏠', title:'Ton tableau de bord',       text:'Chaque semaine commence ici\u00a0: formations en cours, focus du jour, agenda et to-do list — tout en un seul endroit, priorisé pour toi.' },
    classroom:  { icon:'🎓', title:'Tes formations',             text:'Des parcours guidés et complets pour avancer sur tes priorités. Tu progresses à ton rythme, dans l\'ordre qui te convient.' },
    community:  { icon:'🤝', title:'La communauté',              text:'200+ entrepreneuses qui avancent comme toi. Partage tes victoires, pose tes questions et trouve du soutien au quotidien.' },
    resources:  { icon:'📚', title:'Les ressources',             text:'Templates, guides et outils à télécharger pour aller plus vite. Mis à jour régulièrement avec du contenu exclusif.' },
    evenements: { icon:'📅', title:'Les événements',             text:'Masterclasses, sessions Q&R en live et ateliers pratiques — un calendrier riche pour ne jamais avancer seule.' },
    coaching:   { icon:'🎯', title:'Coaching 1-1',               text:'Sessions individuelles avec Sarah Martin pour débloquer tes points de friction. Exclusif au niveau Visionnaire.' },
    hotline:    { icon:'📞', title:'Hotline Business',           text:'Un appel rapide avec une experte pour débloquer une situation précise — en moins de 24h. Exclusif Visionnaire.' },
    plan:       { icon:'📋', title:"Plan d\u2019action",         text:"Tes objectifs traduits en actions concrètes semaine par semaine. Fini la question \u00ab\u00a0par où je commence\u00a0?\u00a0\u00bb" },
    profil:     { icon:'👤', title:'Ton profil',                 text:'Personnalise ton espace, choisis tes domaines de focus et suis l\'évolution de ta progression depuis ton profil.' }
  };

  function openDemoWelcome() {
    var modal = document.getElementById('demo-welcome-modal');
    if (modal) modal.classList.add('visible');
  }

  function startDemoTour() {
    var modal = document.getElementById('demo-welcome-modal');
    if (modal) modal.classList.remove('visible');
    demoTooltipsEnabled = true;
    demoTourCurrentIndex = 0;
    showDemoTooltip('dashboard');
  }

  function skipDemoTour() {
    var modal = document.getElementById('demo-welcome-modal');
    if (modal) modal.classList.remove('visible');
    demoTooltipsEnabled = false;
    var tt = document.getElementById('demo-tooltip');
    if (tt) tt.style.display = 'none';
  }

  function showDemoTooltip(page) {
    var info = demoPageTooltips[page];
    var tt = document.getElementById('demo-tooltip');
    if (!info || !tt) return;
    var idx = demoTourOrder.indexOf(page);
    if (idx >= 0) demoTourCurrentIndex = idx;
    document.getElementById('demo-tt-icon').textContent  = info.icon;
    document.getElementById('demo-tt-title').textContent = info.title;
    document.getElementById('demo-tt-text').textContent  = info.text;
    document.getElementById('demo-tt-progress').textContent = 'Étape ' + (demoTourCurrentIndex + 1) + '\u00a0/\u00a0' + demoTourOrder.length;
    var nextBtn = document.getElementById('demo-tt-next');
    if (demoTourCurrentIndex >= demoTourOrder.length - 1) {
      nextBtn.textContent = 'Terminer la visite ✓';
      nextBtn.onclick = function() { hideDemoTooltip(); };
    } else {
      nextBtn.textContent = 'Page suivante →';
      nextBtn.onclick = demoTooltipNext;
    }
    tt.style.display = 'block';
  }

  function hideDemoTooltip() {
    var tt = document.getElementById('demo-tooltip');
    if (tt) tt.style.display = 'none';
    demoTooltipsEnabled = false;
  }

  function demoTooltipNext() {
    demoTourCurrentIndex = Math.min(demoTourCurrentIndex + 1, demoTourOrder.length - 1);
    showPage(demoTourOrder[demoTourCurrentIndex]);
  }

  var _demoToastTimer = null;
  function showDemoBlockToast() {
    var toast = document.getElementById('demo-block-toast');
    if (!toast) return;
    toast.style.display = 'block';
    clearTimeout(_demoToastTimer);
    _demoToastTimer = setTimeout(function() { toast.style.display = 'none'; }, 2200);
  }

"""

PROFILE_SWITCH_ANCHOR = "\n  function profileSwitchTab"
assert PROFILE_SWITCH_ANCHOR in html, "profileSwitchTab anchor not found"
html = html.replace(PROFILE_SWITCH_ANCHOR, DEMO_JS + "\n  function profileSwitchTab", 1)
print("✓ Demo JS functions added")

# ══════════════════════════════════════════════════════════════════════
# 6. Click interceptor – add as new <script> before deferred scripts
# ══════════════════════════════════════════════════════════════════════
CLICK_INTERCEPTOR = """<script>
// ── DÉMO : Intercepteur de clics (lecture seule) ──
document.addEventListener('click', function(e) {
  if (!document.body.classList.contains('demo-mode')) return;

  // Toujours autoriser : barre démo, modale bienvenue, tooltip, toast
  if (e.target.closest('#demo-pub-bar, #demo-welcome-modal, #demo-tooltip, #demo-block-toast')) return;

  // Toujours autoriser : sidebar (navigation)
  if (e.target.closest('#sidebar')) return;

  // Toujours autoriser : tout clic qui appelle showPage() (navigation entre pages)
  var navEl = e.target.closest('[onclick*="showPage"]');
  if (navEl) return;

  // Bloquer : éléments interactifs dans le contenu membre
  var interactive = e.target.closest(
    'button, input, textarea, select, a[download], ' +
    '[onclick*="openAdd"], [onclick*="submit"], [onclick*="create"], ' +
    '[onclick*="download"], [onclick*="upload"], [onclick*="start"], ' +
    '[onclick*="save"], [onclick*="edit"], [onclick*="delete"], ' +
    '[onclick*="openProfile"], [onclick*="sendMessage"], [onclick*="openTodo"], ' +
    '[onclick*="toggleTodo"], [onclick*="agendaAdd"], [onclick*="openEvent"]'
  );
  if (interactive) {
    e.preventDefault();
    e.stopPropagation();
    showDemoBlockToast();
    return;
  }
}, true);
</script>
"""

DEFERRED_ANCHOR = '<script defer src="assets/notebook-enhanced.js"'
assert DEFERRED_ANCHOR in html, "deferred scripts anchor not found"
html = html.replace(DEFERRED_ANCHOR, CLICK_INTERCEPTOR + '<script defer src="assets/notebook-enhanced.js"', 1)
print("✓ Click interceptor added")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("\n✅ Guided demo features applied!")
