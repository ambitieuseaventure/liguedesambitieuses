#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Refactor the demo page: instead of a self-contained replica,
use the REAL member pages with a fixed demo navigation bar at top.
"""

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# ── 1. Replace old demo-specific CSS with minimal demo-mode CSS ────────
OLD_CSS_START = "\n  /* ── PAGE DÉMO ESPACE MEMBRE ── */\n  #page-demo { margin-left:-240px; width:100vw; }"
OLD_CSS_END   = "  .demo-section-content { padding: 24px 28px; }\n"

idx_s = html.index(OLD_CSS_START)
idx_e = html.index(OLD_CSS_END) + len(OLD_CSS_END)

NEW_CSS = """
  /* ── MODE DÉMO : barre pub-nav fixe au-dessus de l'espace membre ── */
  #demo-pub-bar {
    display: none;
    position: fixed; top: 0; left: 0; right: 0; z-index: 300;
    background: var(--navy-darkest);
    border-bottom: 2px solid var(--gold-bright);
    height: 52px;
    align-items: center;
    padding: 0 20px;
    gap: 14px;
  }
  .demo-bar-back {
    background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.85);
    border: 1px solid rgba(255,255,255,0.15); border-radius: 7px;
    padding: 7px 14px; font-size: 12px; font-weight: 600; cursor: pointer;
    font-family: 'DM Sans', sans-serif; white-space: nowrap; flex-shrink: 0;
    transition: background .15s;
  }
  .demo-bar-back:hover { background: rgba(255,255,255,0.18); }
  .demo-bar-tag {
    background: var(--gold-bright); color: var(--navy-darkest);
    font-size: 10px; font-weight: 700; padding: 3px 9px;
    border-radius: 20px; white-space: nowrap; flex-shrink: 0;
    font-family: 'DM Sans', sans-serif;
  }
  .demo-bar-links {
    flex: 1; display: flex; gap: 20px; justify-content: center;
  }
  .demo-bar-links a {
    color: rgba(255,255,255,0.65); text-decoration: none; font-size: 13px;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: color .15s;
  }
  .demo-bar-links a:hover { color: var(--gold-light); }
  .demo-bar-cta {
    background: var(--gold-bright); color: var(--navy-darkest);
    border: none; border-radius: 7px; padding: 8px 16px;
    font-size: 12px; font-weight: 700; cursor: pointer;
    font-family: 'DM Sans', sans-serif; white-space: nowrap; flex-shrink: 0;
    transition: opacity .2s;
  }
  .demo-bar-cta:hover { opacity: .85; }
  /* Push everything down when demo bar is visible */
  body.demo-mode .sidebar { top: 52px !important; height: calc(100vh - 52px) !important; }
  body.demo-mode .hamburger { top: 66px !important; }
  body.demo-mode .main { padding-top: 52px; }
  body.demo-mode #topbar { top: 52px; }
"""

html = html[:idx_s] + NEW_CSS + html[idx_e:]
print("✓ CSS replaced")

# ── 2. Replace the large page-demo HTML div with an empty placeholder ──
OLD_HTML_START = "  <!-- ── PAGE DÉMO ESPACE MEMBRE ── -->\n  <div class=\"page\" id=\"page-demo\">"
OLD_HTML_END   = "  </div><!-- end page-demo -->"

idx_s = html.index(OLD_HTML_START)
idx_e = html.index(OLD_HTML_END) + len(OLD_HTML_END)

# We keep an empty page-demo so showPage() map reference doesn't break
NEW_HTML = "  <!-- page-demo: handled by enterDemoMode() -->\n  <div class=\"page\" id=\"page-demo\" style=\"display:none\"></div>"

html = html[:idx_s] + NEW_HTML + html[idx_e:]
print("✓ page-demo HTML replaced with empty placeholder")

# ── 3. Remove showDemoSection() function ──────────────────────────────
OLD_DEMO_FN = """  function showDemoSection(s, title) {
    document.querySelectorAll('.demo-section').forEach(function(el){ el.classList.remove('active'); });
    document.querySelectorAll('.demo-pside-item').forEach(function(el){ el.classList.remove('active'); });
    var sec = document.getElementById('demo-sec-' + s);
    if (sec) sec.classList.add('active');
    var nav = document.getElementById('demo-nav-' + s);
    if (nav) nav.classList.add('active');
    var ttl = document.getElementById('demo-topbar-title');
    if (ttl) ttl.textContent = title || s;
    var pmain = document.querySelector('.demo-pmain');
    if (pmain) pmain.scrollTop = 0;
  }

  function profileSwitchTab"""
NEW_DEMO_FN = "  function profileSwitchTab"

assert OLD_DEMO_FN in html, "showDemoSection function not found!"
html = html.replace(OLD_DEMO_FN, NEW_DEMO_FN, 1)
print("✓ showDemoSection() removed")

# ── 4. Add #demo-pub-bar HTML after <body> ─────────────────────────────
GO_LANDING = "exitDemoMode();showPage('landing');"
GO_OFFRE   = "exitDemoMode();showPage('landing');setTimeout(function(){var el=document.getElementById('offre');if(el)el.scrollIntoView({behavior:'smooth'});},80)"
GO_POURQUOI = "exitDemoMode();showPage('landing');setTimeout(function(){var el=document.getElementById('pourquoi');if(el)el.scrollIntoView({behavior:'smooth'});},80)"
GO_INCLUS  = "exitDemoMode();showPage('landing');setTimeout(function(){var el=document.getElementById('inclus');if(el)el.scrollIntoView({behavior:'smooth'});},80)"

DEMO_BAR_HTML = f"""
<!-- ── BARRE DE NAVIGATION DÉMO (mode démo uniquement) ── -->
<div id="demo-pub-bar">
  <button class="demo-bar-back" onclick="{GO_LANDING}">← Retour au site</button>
  <span class="demo-bar-tag">◆ Mode démo · Visionnaire</span>
  <div class="demo-bar-links">
    <a onclick="{GO_POURQUOI}">Pourquoi la Ligue ?</a>
    <a onclick="{GO_INCLUS}">Ce qui est inclus</a>
    <a onclick="{GO_OFFRE}">Tarifs</a>
    <a onclick="exitDemoMode();showPage('blog')">Blog</a>
    <a onclick="exitDemoMode();showPage('bibliotheque')">La Bibliothèque</a>
    <a onclick="exitDemoMode();showPage('contact')">Contact</a>
  </div>
  <button class="demo-bar-cta" onclick="{GO_OFFRE}">Rejoindre La Ligue →</button>
</div>

"""

BODY_ANCHOR = "<body>\n\n<button class=\"hamburger\""
assert BODY_ANCHOR in html, "body anchor not found!"
html = html.replace(BODY_ANCHOR, "<body>\n" + DEMO_BAR_HTML + "<button class=\"hamburger\"", 1)
print("✓ #demo-pub-bar HTML added")

# ── 5. Update showPage() to handle 'demo' via enterDemoMode() ─────────
# Remove '|| page === 'demo'' from the public pages condition
OLD_PUBLIC = "if (page === 'landing' || page === 'blog' || page === 'bibliotheque' || page === 'contact' || page === 'demo') {"
NEW_PUBLIC = "if (page === 'landing' || page === 'blog' || page === 'bibliotheque' || page === 'contact') {"
assert OLD_PUBLIC in html, "public pages condition not found!"
html = html.replace(OLD_PUBLIC, NEW_PUBLIC, 1)
print("✓ Removed 'demo' from public pages condition")

# Add early return for 'demo' at the start of showPage()
# and exitDemoMode() for public pages
OLD_SHOWPAGE_START = """  function showPage(page) {
    // Fermer les modales de la bibliothèque pour libérer le scroll
    if (typeof bibCloseDetail === 'function') bibCloseDetail();
    if (typeof bibCloseCart === 'function') bibCloseCart();
    if (typeof bibCloseEmailModal === 'function') bibCloseEmailModal();
    document.querySelectorAll('.page').forEach(p => {"""
NEW_SHOWPAGE_START = """  function showPage(page) {
    // Mode démo : entrée spéciale
    if (page === 'demo') { enterDemoMode(); return; }
    // Fermer les modales de la bibliothèque pour libérer le scroll
    if (typeof bibCloseDetail === 'function') bibCloseDetail();
    if (typeof bibCloseCart === 'function') bibCloseCart();
    if (typeof bibCloseEmailModal === 'function') bibCloseEmailModal();
    document.querySelectorAll('.page').forEach(p => {"""
assert OLD_SHOWPAGE_START in html, "showPage() start anchor not found!"
html = html.replace(OLD_SHOWPAGE_START, NEW_SHOWPAGE_START, 1)
print("✓ Added early 'demo' return in showPage()")

# Add exitDemoMode() call in the public pages branch of showPage()
OLD_PUBLIC_BRANCH = """      topbar.style.display = 'none';
      sidebar.style.display = 'none';
      document.body.classList.remove('member-page');
      if (page === 'bibliotheque') { bibRenderPublic(); }"""
NEW_PUBLIC_BRANCH = """      exitDemoMode();
      topbar.style.display = 'none';
      sidebar.style.display = 'none';
      document.body.classList.remove('member-page');
      if (page === 'bibliotheque') { bibRenderPublic(); }"""
assert OLD_PUBLIC_BRANCH in html, "public branch not found!"
html = html.replace(OLD_PUBLIC_BRANCH, NEW_PUBLIC_BRANCH, 1)
print("✓ Added exitDemoMode() in public pages branch")

# ── 6. Add enterDemoMode() and exitDemoMode() functions ───────────────
ENTER_EXIT_FN = """
  function enterDemoMode() {
    // Hide all pages
    document.querySelectorAll('.page').forEach(function(p) {
      p.classList.remove('active');
      p.style.display = 'none';
    });
    // Show the real dashboard page
    var dashboard = document.getElementById('page-dashboard');
    if (dashboard) { dashboard.style.display = 'block'; dashboard.classList.add('active'); window.scrollTo(0, 0); }
    // Show member layout (sidebar + topbar)
    var topbar = document.getElementById('topbar');
    var sidebar = document.getElementById('sidebar');
    topbar.style.display = 'flex';
    sidebar.style.display = 'flex';
    document.body.classList.add('member-page');
    // Activate demo mode (pushes UI below the demo bar)
    document.body.classList.add('demo-mode');
    document.getElementById('demo-pub-bar').style.display = 'flex';
    // Update topbar title
    document.getElementById('topbar-title').textContent = 'Accueil';
    // Reset sidebar active item
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    var dashNav = document.querySelector('.nav-item[onclick*="dashboard"]');
    if (dashNav) dashNav.classList.add('active');
    // Render focus du jour
    if (typeof window.renderDashboardFocusDuJour === 'function') {
      window.renderDashboardFocusDuJour();
    }
    if (window.innerWidth <= 900) sidebar.classList.remove('open');
  }

  function exitDemoMode() {
    document.body.classList.remove('demo-mode');
    var bar = document.getElementById('demo-pub-bar');
    if (bar) bar.style.display = 'none';
  }

"""

# Insert before profileSwitchTab
PROFILE_SWITCH_ANCHOR = "\n  function profileSwitchTab"
assert PROFILE_SWITCH_ANCHOR in html, "profileSwitchTab anchor not found!"
html = html.replace(PROFILE_SWITCH_ANCHOR, ENTER_EXIT_FN + "  function profileSwitchTab", 1)
print("✓ enterDemoMode() and exitDemoMode() added")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("\n✅ Refactoring complete!")
