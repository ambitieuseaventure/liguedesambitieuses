#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Add the page-demo (live member space demo) to index.html"""

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# ── 1. CSS ──────────────────────────────────────────────────────────────
CSS = """
  /* ── PAGE DÉMO ESPACE MEMBRE ── */
  #page-demo { margin-left:-240px; width:100vw; }
  .demo-mode-bar {
    background: var(--navy-darkest);
    border-bottom: 1.5px solid rgba(235,193,76,0.35);
    padding: 11px 32px;
    display: flex; align-items: center; gap: 16px;
    flex-wrap: wrap;
  }
  .demo-mode-tag {
    background: var(--gold-bright); color: var(--navy-darkest);
    font-weight: 700; font-size: 11px; padding: 4px 10px;
    border-radius: 20px; white-space: nowrap; flex-shrink: 0;
    font-family: 'DM Sans', sans-serif; letter-spacing: .02em;
  }
  .demo-mode-info {
    color: rgba(255,255,255,0.7); font-size: 13px; flex: 1;
    font-family: 'DM Sans', sans-serif; line-height: 1.4;
  }
  .demo-mode-cta {
    background: var(--gold-bright); color: var(--navy-darkest);
    border: none; border-radius: 8px; padding: 9px 20px;
    font-size: 13px; font-weight: 700; cursor: pointer;
    font-family: 'DM Sans', sans-serif; white-space: nowrap; flex-shrink: 0;
    transition: opacity .2s;
  }
  .demo-mode-cta:hover { opacity: .85; }
  .demo-shell {
    display: flex;
    height: calc(100vh - 115px);
    overflow: hidden;
  }
  .demo-pside {
    width: 220px; flex-shrink: 0;
    background: var(--navy-darkest);
    display: flex; flex-direction: column;
    overflow-y: auto;
    box-shadow: 4px 0 20px rgba(20,36,53,0.3);
  }
  .demo-pside-logo {
    padding: 20px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    display: flex; align-items: center; gap: 10px; flex-shrink: 0;
    cursor: pointer;
  }
  .demo-pside-logo img { width: 36px; height: 36px; object-fit: contain; }
  .demo-pside-logo .brand {
    font-family: 'DM Sans', sans-serif; font-size: 9px;
    letter-spacing: .15em; text-transform: uppercase;
    color: rgba(235,193,76,0.65); display: block;
  }
  .demo-pside-logo .product {
    font-family: 'Playfair Display', serif; font-size: 12px;
    font-weight: 700; color: var(--gold); line-height: 1.2;
    margin-top: 1px;
  }
  .demo-pside-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
  .demo-pside-item {
    display: flex; align-items: center; gap: 11px;
    padding: 11px 18px; cursor: pointer;
    color: rgba(255,255,255,0.65); font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    transition: background .15s, color .15s;
    border-left: 3px solid transparent;
  }
  .demo-pside-item:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.9); }
  .demo-pside-item.active {
    background: rgba(235,193,76,0.1); color: var(--gold);
    border-left-color: var(--gold-bright);
  }
  .demo-pside-sep {
    border: none; border-top: 1px solid rgba(255,255,255,0.07);
    margin: 8px 16px;
  }
  .demo-pside-user {
    padding: 14px 16px; border-top: 1px solid rgba(255,255,255,0.08);
    display: flex; align-items: center; gap: 10px; flex-shrink: 0;
  }
  .demo-pside-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: linear-gradient(135deg, var(--gold), var(--gold-bright));
    color: var(--navy-darkest); font-weight: 700; font-size: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .demo-pside-username { font-size: 13px; color: white; font-weight: 600; font-family: 'DM Sans', sans-serif; }
  .demo-pside-tier { font-size: 11px; color: var(--gold); font-family: 'DM Sans', sans-serif; margin-top: 1px; }
  .demo-pmain { flex: 1; overflow-y: auto; background: var(--bg); display: flex; flex-direction: column; }
  .demo-ptopbar {
    background: white; border-bottom: 1px solid rgba(20,36,53,0.1);
    padding: 13px 28px; display: flex; align-items: center;
    justify-content: space-between; position: sticky; top: 0;
    z-index: 10; box-shadow: 0 2px 8px rgba(20,36,53,0.05); flex-shrink: 0;
  }
  .demo-ptopbar-title {
    font-family: 'Playfair Display', serif; font-size: 20px;
    font-weight: 600; color: var(--text-dark);
  }
  .demo-ptopbar-actions { display: flex; align-items: center; gap: 12px; }
  .demo-sections { flex: 1; }
  .demo-section { display: none; }
  .demo-section.active { display: block; }
  .demo-formation-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px; padding: 24px 28px;
  }
  .demo-formation-card {
    background: white; border-radius: 14px; overflow: hidden;
    box-shadow: 0 3px 12px rgba(20,36,53,0.08); cursor: pointer;
    transition: box-shadow .2s, transform .2s;
  }
  .demo-formation-card:hover { box-shadow: 0 8px 24px rgba(20,36,53,0.14); transform: translateY(-2px); }
  .demo-formation-thumb {
    height: 90px; display: flex; align-items: center; justify-content: center;
    font-size: 34px;
  }
  .demo-formation-body { padding: 14px; }
  .demo-formation-title { font-size: 14px; font-weight: 700; color: var(--navy-darkest); font-family: 'DM Sans', sans-serif; margin-bottom: 4px; }
  .demo-formation-sub { font-size: 12px; color: var(--text-light); font-family: 'DM Sans', sans-serif; margin-bottom: 10px; }
  .demo-formation-pct { font-size: 11px; font-weight: 700; color: var(--gold-bright); font-family: 'DM Sans', sans-serif; margin-bottom: 4px; }
  .demo-community-feed { padding: 24px 28px; max-width: 700px; }
  .demo-post {
    background: white; border-radius: 14px; padding: 18px 20px;
    margin-bottom: 14px; box-shadow: 0 2px 8px rgba(20,36,53,0.06);
  }
  .demo-post-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .demo-post-avatar {
    width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, #24425b, #142435);
    color: var(--gold); font-weight: 700; font-size: 13px;
    display: flex; align-items: center; justify-content: center;
  }
  .demo-post-author { font-size: 13px; font-weight: 700; color: var(--navy-darkest); font-family: 'DM Sans', sans-serif; }
  .demo-post-date { font-size: 11px; color: var(--text-light); font-family: 'DM Sans', sans-serif; }
  .demo-post-text { font-size: 13.5px; color: var(--text-dark); font-family: 'DM Sans', sans-serif; line-height: 1.6; }
  .demo-post-actions { margin-top: 12px; display: flex; gap: 16px; }
  .demo-post-action {
    font-size: 12px; color: var(--text-light); font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: color .15s;
  }
  .demo-post-action:hover { color: var(--gold-bright); }
  .demo-section-content { padding: 24px 28px; }

"""

CSS_ANCHOR = "  </style>\n</head>"
assert CSS_ANCHOR in html, "CSS anchor not found!"
html = html.replace(CSS_ANCHOR, CSS + "  </style>\n</head>", 1)
print("✓ CSS inserted")

# ── 2. HTML page-demo ──────────────────────────────────────────────────
NAV_LINKS = """        <div class="pub-nav-links">
          <a href="javascript:void(0)" onclick="showPage('landing');setTimeout(function(){var el=document.getElementById('pourquoi');if(el)el.scrollIntoView({behavior:'smooth'});},80)">Pourquoi la Ligue ?</a>
          <a href="javascript:void(0)" onclick="showPage('landing');setTimeout(function(){var el=document.getElementById('apropos');if(el)el.scrollIntoView({behavior:'smooth'});},80)">Notre histoire</a>
          <a href="javascript:void(0)" onclick="showPage('landing');setTimeout(function(){var el=document.getElementById('offre');if(el)el.scrollIntoView({behavior:'smooth'});},80)">Tarifs</a>
          <a href="javascript:void(0)" onclick="showPage('blog')">Blog</a>
          <a href="javascript:void(0)" onclick="showPage('bibliotheque')">La Bibliothèque</a>
          <a href="javascript:void(0)" onclick="showPage('contact')">Contact</a>
        </div>"""

GO_OFFRE = "showPage('landing');setTimeout(function(){var el=document.getElementById('offre');if(el)el.scrollIntoView({behavior:'smooth'});},80)"

PAGE_DEMO = """  <!-- ── PAGE DÉMO ESPACE MEMBRE ── -->
  <div class="page" id="page-demo">
    <!-- Navigation publique -->
    <nav class="pub-nav">
      <div class="pub-nav-inner">
        <div class="pub-nav-logo" onclick="showPage('landing')" style="cursor:pointer">
          <img src="assets/image-1.png" alt="Logo">
          <div>
            <span class="pub-brand">Ambitieuse Aventure</span>
            <span class="pub-product">La Ligue des Ambitieuses</span>
          </div>
        </div>
""" + NAV_LINKS + """
        <button class="btn-primary pub-nav-cta" onclick=\"""" + GO_OFFRE + """\">Voir les offres →</button>
        <button class="pub-nav-hamburger" onclick="pubNavOpen()" aria-label="Menu">☰</button>
      </div>
    </nav>

    <!-- Bandeau mode démo -->
    <div class="demo-mode-bar">
      <span class="demo-mode-tag">◆ Mode démo · Niveau Visionnaire</span>
      <span class="demo-mode-info">Tu explores l'espace membre en avant-première — entièrement personnalisé après ton abonnement.</span>
      <button class="demo-mode-cta" onclick=\"""" + GO_OFFRE + """\">Rejoindre La Ligue →</button>
    </div>

    <!-- Interface membre simulée -->
    <div class="demo-shell">

      <!-- Sidebar -->
      <aside class="demo-pside">
        <div class="demo-pside-logo" onclick="showPage('landing')">
          <img src="assets/image-1.png" alt="Logo">
          <div>
            <span class="brand">Ambitieuse Aventure</span>
            <span class="product">La Ligue des Ambitieuses</span>
          </div>
        </div>
        <nav class="demo-pside-nav">
          <div class="demo-pside-item active" id="demo-nav-dashboard" onclick="showDemoSection('dashboard','Accueil')">🏠 Dashboard</div>
          <div class="demo-pside-item" id="demo-nav-formations" onclick="showDemoSection('formations','Formations')">🎓 Formations</div>
          <div class="demo-pside-item" id="demo-nav-communaute" onclick="showDemoSection('communaute','Communauté')">🤝 Communauté</div>
          <div class="demo-pside-item" id="demo-nav-ressources" onclick="showDemoSection('ressources','Bibliothèque')">📚 Bibliothèque</div>
          <hr class="demo-pside-sep">
          <div class="demo-pside-item" id="demo-nav-agenda" onclick="showDemoSection('agenda','Mon agenda')">📅 Agenda</div>
          <div class="demo-pside-item" id="demo-nav-messages" onclick="showDemoSection('messages','Messagerie')">💬 Messagerie</div>
          <div class="demo-pside-item" id="demo-nav-outils" onclick="showDemoSection('outils','Outils &amp; Suivi')">🛠️ Outils &amp; Suivi</div>
        </nav>
        <div class="demo-pside-user">
          <div class="demo-pside-avatar">SA</div>
          <div>
            <div class="demo-pside-username">Sophie Andreu</div>
            <div class="demo-pside-tier">◆ Visionnaire</div>
          </div>
        </div>
      </aside>

      <!-- Contenu principal -->
      <div class="demo-pmain">
        <div class="demo-ptopbar">
          <div class="demo-ptopbar-title" id="demo-topbar-title">Accueil</div>
          <div class="demo-ptopbar-actions">
            <div class="search-bar">🔍 Rechercher...</div>
            <div class="notif-btn">🔔<div class="notif-dot"></div></div>
          </div>
        </div>

        <div class="demo-sections">

          <!-- ── DASHBOARD ── -->
          <div class="demo-section active" id="demo-sec-dashboard">
            <div class="page-content">
              <div class="welcome-banner">
                <div class="welcome-text">
                  <h2>Bonjour, Sophie ! <em>✦</em></h2>
                  <p>Tu es membre depuis 47 jours. Continue sur ta lancée, tu avances vraiment bien !</p>
                </div>
                <div style="display:flex;gap:14px;z-index:1;align-items:stretch">
                  <div class="welcome-badge">
                    <span class="num">4</span>
                    <span class="label">formations en cours</span>
                  </div>
                  <div class="welcome-badge" style="background:rgba(255,255,255,0.12);">
                    <span class="num" style="font-size:20px;">◆</span>
                    <span class="label">Visionnaire</span>
                  </div>
                </div>
              </div>

              <div class="two-col" style="grid-template-columns:1fr 1fr;">
                <div class="card">
                  <div class="card-title">
                    Mes formations en cours
                    <a onclick="showDemoSection('formations','Formations')" style="cursor:pointer">Voir tout →</a>
                  </div>
                  <div class="progress-course">
                    <div class="progress-name">Les bases de la comptabilité <span class="progress-pct">90%</span></div>
                    <div class="progress-bar"><div class="progress-fill" style="width:90%"></div></div>
                  </div>
                  <div class="progress-course">
                    <div class="progress-name">Lancer son offre de A à Z <span class="progress-pct">68%</span></div>
                    <div class="progress-bar"><div class="progress-fill" style="width:68%"></div></div>
                  </div>
                  <div class="progress-course">
                    <div class="progress-name">Trouver ses premiers clients <span class="progress-pct">42%</span></div>
                    <div class="progress-bar"><div class="progress-fill" style="width:42%"></div></div>
                  </div>
                </div>

                <div class="card">
                  <div class="card-title">🌟 Focus du jour</div>
                  <div style="padding:4px 0;">
                    <div style="background:#f4f7fa;border-radius:8px;padding:10px 12px;margin-bottom:8px;display:flex;align-items:flex-start;gap:8px;">
                      <span style="color:var(--gold-bright);font-size:14px;margin-top:1px;">✦</span>
                      <div>
                        <div style="font-size:13px;font-weight:600;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;">Finir le module 3 – Comptabilité</div>
                        <div style="font-size:11px;color:var(--text-light);font-family:'DM Sans',sans-serif;margin-top:2px;">Formation prioritaire · Aujourd'hui</div>
                      </div>
                    </div>
                    <div style="background:#f4f7fa;border-radius:8px;padding:10px 12px;margin-bottom:8px;display:flex;align-items:flex-start;gap:8px;">
                      <span style="color:var(--gold-bright);font-size:14px;margin-top:1px;">✦</span>
                      <div>
                        <div style="font-size:13px;font-weight:600;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;">Partager une victoire dans la communauté</div>
                        <div style="font-size:11px;color:var(--text-light);font-family:'DM Sans',sans-serif;margin-top:2px;">Communauté · Boost de motivation</div>
                      </div>
                    </div>
                    <div style="background:#f4f7fa;border-radius:8px;padding:10px 12px;display:flex;align-items:flex-start;gap:8px;">
                      <span style="color:var(--gold-bright);font-size:14px;margin-top:1px;">✦</span>
                      <div>
                        <div style="font-size:13px;font-weight:600;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;">Préparer la session Q&amp;R de jeudi</div>
                        <div style="font-size:11px;color:var(--text-light);font-family:'DM Sans',sans-serif;margin-top:2px;">Événement · Cette semaine</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="agenda-todo-row">
                <div class="card" style="flex:2;">
                  <div class="card-title">📅 Événements à venir</div>
                  <div style="display:flex;flex-direction:column;gap:8px;padding:4px 0;">
                    <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:#f4f7fa;border-radius:9px;">
                      <div style="width:38px;height:44px;background:var(--navy);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">
                        <span style="font-size:9px;color:var(--gold);font-weight:700;font-family:'DM Sans',sans-serif;text-transform:uppercase;">Jeu</span>
                        <span style="font-size:15px;color:white;font-weight:700;font-family:'DM Sans',sans-serif;line-height:1.1;">18</span>
                      </div>
                      <div style="flex:1;">
                        <div style="font-size:13px;font-weight:600;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;">Session Q&amp;R Live · Stratégie commerciale</div>
                        <div style="font-size:11px;color:var(--text-light);font-family:'DM Sans',sans-serif;margin-top:1px;">18h00 · Zoom · Avec Sarah Martin</div>
                      </div>
                      <div style="width:9px;height:9px;border-radius:50%;background:#4a9e6a;flex-shrink:0;"></div>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:#f4f7fa;border-radius:9px;">
                      <div style="width:38px;height:44px;background:var(--navy);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">
                        <span style="font-size:9px;color:var(--gold);font-weight:700;font-family:'DM Sans',sans-serif;text-transform:uppercase;">Sam</span>
                        <span style="font-size:15px;color:white;font-weight:700;font-family:'DM Sans',sans-serif;line-height:1.1;">22</span>
                      </div>
                      <div style="flex:1;">
                        <div style="font-size:13px;font-weight:600;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;">Masterclass : Tarifer son expertise en 2025</div>
                        <div style="font-size:11px;color:var(--text-light);font-family:'DM Sans',sans-serif;margin-top:1px;">10h00 · Replay disponible 48h après</div>
                      </div>
                      <div style="width:9px;height:9px;border-radius:50%;background:var(--navy);flex-shrink:0;"></div>
                    </div>
                    <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:#f4f7fa;border-radius:9px;">
                      <div style="width:38px;height:44px;background:var(--navy);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">
                        <span style="font-size:9px;color:var(--gold);font-weight:700;font-family:'DM Sans',sans-serif;text-transform:uppercase;">Jeu</span>
                        <span style="font-size:15px;color:white;font-weight:700;font-family:'DM Sans',sans-serif;line-height:1.1;">25</span>
                      </div>
                      <div style="flex:1;">
                        <div style="font-size:13px;font-weight:600;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;">Coaching collectif mensuel</div>
                        <div style="font-size:11px;color:var(--text-light);font-family:'DM Sans',sans-serif;margin-top:1px;">17h30 · Ouvert aux Stratège &amp; Visionnaire</div>
                      </div>
                      <div style="width:9px;height:9px;border-radius:50%;background:var(--gold-bright);flex-shrink:0;"></div>
                    </div>
                  </div>
                </div>

                <div class="card todo-aside">
                  <div class="card-title">Ma to-do list</div>
                  <div class="todo-section-label">Aujourd'hui</div>
                  <div class="todo-item">
                    <button class="todo-check" title="Marquer comme fait"></button>
                    <div class="todo-body">
                      <span class="todo-text">Finir le module 3 – Comptabilité</span>
                      <span class="todo-tag todo-tag-formation">Formation</span>
                    </div>
                  </div>
                  <div class="todo-item">
                    <button class="todo-check" title="Marquer comme fait"></button>
                    <div class="todo-body">
                      <span class="todo-text">Répondre à Clara B.</span>
                      <span class="todo-tag todo-tag-reseau">Réseau</span>
                    </div>
                  </div>
                  <div class="todo-section-label" style="margin-top:14px;">Cette semaine</div>
                  <div class="todo-item">
                    <button class="todo-check" title="Marquer comme fait"></button>
                    <div class="todo-body">
                      <span class="todo-text">Préparer la session Q&amp;R du jeudi</span>
                      <span class="todo-tag todo-tag-event">Événement</span>
                    </div>
                  </div>
                  <div class="todo-item">
                    <button class="todo-check" title="Marquer comme fait"></button>
                    <div class="todo-body">
                      <span class="todo-text">Publier dans la communauté</span>
                      <span class="todo-tag todo-tag-communaute">Communauté</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── FORMATIONS ── -->
          <div class="demo-section" id="demo-sec-formations">
            <div class="demo-formation-grid">
              <div class="demo-formation-card">
                <div class="demo-formation-thumb" style="background:linear-gradient(135deg,#eef2ff,#dde5fb);">📊</div>
                <div class="demo-formation-body">
                  <div class="demo-formation-title">Les bases de la comptabilité</div>
                  <div class="demo-formation-sub">12 modules · 3h45 de contenu</div>
                  <div class="demo-formation-pct">90% complété</div>
                  <div class="progress-bar"><div class="progress-fill" style="width:90%"></div></div>
                </div>
              </div>
              <div class="demo-formation-card">
                <div class="demo-formation-thumb" style="background:linear-gradient(135deg,#fef3e2,#fde8b0);">🚀</div>
                <div class="demo-formation-body">
                  <div class="demo-formation-title">Lancer son offre de A à Z</div>
                  <div class="demo-formation-sub">9 modules · 2h20 de contenu</div>
                  <div class="demo-formation-pct">68% complété</div>
                  <div class="progress-bar"><div class="progress-fill" style="width:68%"></div></div>
                </div>
              </div>
              <div class="demo-formation-card">
                <div class="demo-formation-thumb" style="background:linear-gradient(135deg,#e8f8ee,#c8efd7);">🤝</div>
                <div class="demo-formation-body">
                  <div class="demo-formation-title">Trouver ses premiers clients</div>
                  <div class="demo-formation-sub">8 modules · 2h05 de contenu</div>
                  <div class="demo-formation-pct">42% complété</div>
                  <div class="progress-bar"><div class="progress-fill" style="width:42%"></div></div>
                </div>
              </div>
              <div class="demo-formation-card">
                <div class="demo-formation-thumb" style="background:linear-gradient(135deg,#f5eeff,#e5d4ff);">💡</div>
                <div class="demo-formation-body">
                  <div class="demo-formation-title">Stratégie de contenu pour entrepreneuses</div>
                  <div class="demo-formation-sub">10 modules · 3h00 de contenu</div>
                  <div class="demo-formation-pct">Non commencé</div>
                  <div class="progress-bar"><div class="progress-fill" style="width:0%"></div></div>
                </div>
              </div>
              <div class="demo-formation-card">
                <div class="demo-formation-thumb" style="background:linear-gradient(135deg,#fff0f0,#ffd6d6);">🧠</div>
                <div class="demo-formation-body">
                  <div class="demo-formation-title">Mindset &amp; productivité</div>
                  <div class="demo-formation-sub">6 modules · 1h30 de contenu</div>
                  <div class="demo-formation-pct">Non commencé</div>
                  <div class="progress-bar"><div class="progress-fill" style="width:0%"></div></div>
                </div>
              </div>
              <div class="demo-formation-card">
                <div class="demo-formation-thumb" style="background:linear-gradient(135deg,#e8f4ff,#c8deff);">📣</div>
                <div class="demo-formation-body">
                  <div class="demo-formation-title">Vendre sans complexe</div>
                  <div class="demo-formation-sub">7 modules · 1h55 de contenu · Nouveau ✦</div>
                  <div class="demo-formation-pct">Non commencé</div>
                  <div class="progress-bar"><div class="progress-fill" style="width:0%"></div></div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── COMMUNAUTÉ ── -->
          <div class="demo-section" id="demo-sec-communaute">
            <div class="demo-community-feed">
              <div style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;">
                <span style="font-family:'Playfair Display',serif;font-size:17px;color:var(--navy-darkest);">Fil d'actualité</span>
                <button style="background:var(--gold-bright);color:var(--navy-darkest);border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif;cursor:pointer;">+ Publier</button>
              </div>
              <div class="demo-post">
                <div class="demo-post-header">
                  <div class="demo-post-avatar" style="background:linear-gradient(135deg,#d4a843,#b8861c);">ML</div>
                  <div>
                    <div class="demo-post-author">Marie Lefebvre</div>
                    <div class="demo-post-date">Il y a 2 heures · 🌟 Visionnaire</div>
                  </div>
                </div>
                <div class="demo-post-text">Je viens de signer mon 1er client à 3 000€ grâce aux techniques de la formation "Vendre sans complexe". Incroyable comme un changement de posture peut tout changer ! Merci à toutes pour vos encouragements la semaine dernière 🙌</div>
                <div class="demo-post-actions">
                  <div class="demo-post-action">❤️ 24 réactions</div>
                  <div class="demo-post-action">💬 8 commentaires</div>
                  <div class="demo-post-action">🔗 Partager</div>
                </div>
              </div>
              <div class="demo-post">
                <div class="demo-post-header">
                  <div class="demo-post-avatar" style="background:linear-gradient(135deg,#4a9e6a,#2d7a4f);">CP</div>
                  <div>
                    <div class="demo-post-author">Clara Petit</div>
                    <div class="demo-post-date">Hier · ◆ Stratège</div>
                  </div>
                </div>
                <div class="demo-post-text">Question pour celles qui ont un compte Instagram : vous postez à quelle fréquence ? J'essaie de trouver le bon rythme sans m'épuiser. Pour l'instant je fais 3x/semaine mais je me demande si c'est suffisant...</div>
                <div class="demo-post-actions">
                  <div class="demo-post-action">❤️ 11 réactions</div>
                  <div class="demo-post-action">💬 15 commentaires</div>
                  <div class="demo-post-action">🔗 Partager</div>
                </div>
              </div>
              <div class="demo-post">
                <div class="demo-post-header">
                  <div class="demo-post-avatar">SA</div>
                  <div>
                    <div class="demo-post-author">Sophie Andreu <span style="font-size:11px;color:var(--gold-bright);">(toi)</span></div>
                    <div class="demo-post-date">Il y a 3 jours · 🌟 Visionnaire</div>
                  </div>
                </div>
                <div class="demo-post-text">Petite victoire de la semaine : j'ai enfin osé augmenter mes prix. J'avais peur de perdre des clients... et en fait 2 ont dit oui sans négocier. Le mindset fait vraiment tout ! ✨</div>
                <div class="demo-post-actions">
                  <div class="demo-post-action">❤️ 31 réactions</div>
                  <div class="demo-post-action">💬 12 commentaires</div>
                  <div class="demo-post-action">🔗 Partager</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── BIBLIOTHÈQUE ── -->
          <div class="demo-section" id="demo-sec-ressources">
            <div class="demo-section-content">
              <p style="color:var(--text-light);font-family:'DM Sans',sans-serif;margin-bottom:20px;">Accède à tous les outils, templates et ressources exclusives de La Ligue.</p>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;">
                <div style="background:white;border-radius:12px;padding:18px;box-shadow:0 2px 8px rgba(20,36,53,0.07);">
                  <div style="font-size:28px;margin-bottom:8px;">📑</div>
                  <div style="font-size:14px;font-weight:700;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;margin-bottom:4px;">Template : Proposition commerciale</div>
                  <div style="font-size:12px;color:var(--text-light);font-family:'DM Sans',sans-serif;">Word · Personnalisable · Visionnaire</div>
                </div>
                <div style="background:white;border-radius:12px;padding:18px;box-shadow:0 2px 8px rgba(20,36,53,0.07);">
                  <div style="font-size:28px;margin-bottom:8px;">📊</div>
                  <div style="font-size:14px;font-weight:700;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;margin-bottom:4px;">Tableau de bord financier</div>
                  <div style="font-size:12px;color:var(--text-light);font-family:'DM Sans',sans-serif;">Excel / Google Sheets · Mise à jour 2025</div>
                </div>
                <div style="background:white;border-radius:12px;padding:18px;box-shadow:0 2px 8px rgba(20,36,53,0.07);">
                  <div style="font-size:28px;margin-bottom:8px;">🗓️</div>
                  <div style="font-size:14px;font-weight:700;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;margin-bottom:4px;">Planner trimestriel</div>
                  <div style="font-size:12px;color:var(--text-light);font-family:'DM Sans',sans-serif;">PDF · Imprimable · Toutes abonnées</div>
                </div>
                <div style="background:white;border-radius:12px;padding:18px;box-shadow:0 2px 8px rgba(20,36,53,0.07);">
                  <div style="font-size:28px;margin-bottom:8px;">🎯</div>
                  <div style="font-size:14px;font-weight:700;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;margin-bottom:4px;">Guide : Fixer ses tarifs</div>
                  <div style="font-size:12px;color:var(--text-light);font-family:'DM Sans',sans-serif;">PDF · 18 pages · Stratège &amp; Visionnaire</div>
                </div>
                <div style="background:white;border-radius:12px;padding:18px;box-shadow:0 2px 8px rgba(20,36,53,0.07);">
                  <div style="font-size:28px;margin-bottom:8px;">✍️</div>
                  <div style="font-size:14px;font-weight:700;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;margin-bottom:4px;">Script : Prospection LinkedIn</div>
                  <div style="font-size:12px;color:var(--text-light);font-family:'DM Sans',sans-serif;">Google Docs · 3 variantes · Visionnaire</div>
                </div>
                <div style="background:white;border-radius:12px;padding:18px;box-shadow:0 2px 8px rgba(20,36,53,0.07);">
                  <div style="font-size:28px;margin-bottom:8px;">🧘</div>
                  <div style="font-size:14px;font-weight:700;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;margin-bottom:4px;">Routine matinale de l'entrepreneuse</div>
                  <div style="font-size:12px;color:var(--text-light);font-family:'DM Sans',sans-serif;">PDF · 8 pages · Toutes abonnées</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── AGENDA ── -->
          <div class="demo-section" id="demo-sec-agenda">
            <div class="demo-section-content">
              <p style="color:var(--text-light);font-family:'DM Sans',sans-serif;margin-bottom:20px;">Tous tes événements, masterclasses et sessions de coaching en un coup d'œil.</p>
              <div style="display:flex;flex-direction:column;gap:10px;">
                <div style="background:white;border-radius:12px;padding:16px 20px;display:flex;align-items:center;gap:16px;box-shadow:0 2px 8px rgba(20,36,53,0.07);">
                  <div style="width:44px;height:50px;background:var(--navy);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">
                    <span style="font-size:9px;color:var(--gold);font-weight:700;font-family:'DM Sans',sans-serif;text-transform:uppercase;">Jeu</span>
                    <span style="font-size:18px;color:white;font-weight:700;font-family:'DM Sans',sans-serif;line-height:1.1;">18</span>
                  </div>
                  <div style="flex:1;">
                    <div style="font-size:14px;font-weight:700;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;">Session Q&amp;R Live · Stratégie commerciale</div>
                    <div style="font-size:12px;color:var(--text-light);font-family:'DM Sans',sans-serif;margin-top:2px;">18h00 · Zoom · Avec Sarah Martin</div>
                  </div>
                  <div style="background:#e8f8ee;color:#2d7a4f;font-size:11px;font-weight:700;padding:5px 12px;border-radius:20px;font-family:'DM Sans',sans-serif;white-space:nowrap;">Q&amp;R Live</div>
                </div>
                <div style="background:white;border-radius:12px;padding:16px 20px;display:flex;align-items:center;gap:16px;box-shadow:0 2px 8px rgba(20,36,53,0.07);">
                  <div style="width:44px;height:50px;background:var(--navy);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">
                    <span style="font-size:9px;color:var(--gold);font-weight:700;font-family:'DM Sans',sans-serif;text-transform:uppercase;">Sam</span>
                    <span style="font-size:18px;color:white;font-weight:700;font-family:'DM Sans',sans-serif;line-height:1.1;">22</span>
                  </div>
                  <div style="flex:1;">
                    <div style="font-size:14px;font-weight:700;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;">Masterclass : Tarifer son expertise en 2025</div>
                    <div style="font-size:12px;color:var(--text-light);font-family:'DM Sans',sans-serif;margin-top:2px;">10h00 · Replay disponible 48h après</div>
                  </div>
                  <div style="background:#eeeeff;color:#4444cc;font-size:11px;font-weight:700;padding:5px 12px;border-radius:20px;font-family:'DM Sans',sans-serif;white-space:nowrap;">Masterclass</div>
                </div>
                <div style="background:white;border-radius:12px;padding:16px 20px;display:flex;align-items:center;gap:16px;box-shadow:0 2px 8px rgba(20,36,53,0.07);">
                  <div style="width:44px;height:50px;background:var(--navy);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">
                    <span style="font-size:9px;color:var(--gold);font-weight:700;font-family:'DM Sans',sans-serif;text-transform:uppercase;">Jeu</span>
                    <span style="font-size:18px;color:white;font-weight:700;font-family:'DM Sans',sans-serif;line-height:1.1;">25</span>
                  </div>
                  <div style="flex:1;">
                    <div style="font-size:14px;font-weight:700;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;">Coaching collectif mensuel</div>
                    <div style="font-size:12px;color:var(--text-light);font-family:'DM Sans',sans-serif;margin-top:2px;">17h30 · Ouvert aux Stratège &amp; Visionnaire</div>
                  </div>
                  <div style="background:rgba(252,186,51,0.12);color:var(--gold-bright);font-size:11px;font-weight:700;padding:5px 12px;border-radius:20px;font-family:'DM Sans',sans-serif;white-space:nowrap;">Coaching</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── MESSAGERIE ── -->
          <div class="demo-section" id="demo-sec-messages">
            <div class="demo-section-content" style="max-width:600px;">
              <div style="display:flex;flex-direction:column;gap:10px;">
                <div style="background:white;border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:12px;box-shadow:0 2px 8px rgba(20,36,53,0.07);cursor:pointer;">
                  <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#d4a843,#b8861c);color:white;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">SM</div>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:700;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;">Sarah Martin · Coach</div>
                    <div style="font-size:12px;color:var(--text-light);font-family:'DM Sans',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Bravo pour ta progression ! Tu as une question à poser pour jeudi ?</div>
                  </div>
                  <div style="font-size:11px;color:var(--text-light);font-family:'DM Sans',sans-serif;flex-shrink:0;">10h32</div>
                </div>
                <div style="background:white;border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:12px;box-shadow:0 2px 8px rgba(20,36,53,0.07);cursor:pointer;">
                  <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#4a9e6a,#2d7a4f);color:white;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">CP</div>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:700;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;">Clara Petit</div>
                    <div style="font-size:12px;color:var(--text-light);font-family:'DM Sans',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Merci Sophie ! Je vais tester ta technique dès demain 🙌</div>
                  </div>
                  <div style="font-size:11px;color:var(--text-light);font-family:'DM Sans',sans-serif;flex-shrink:0;">Hier</div>
                </div>
                <div style="background:white;border-radius:12px;padding:14px 18px;display:flex;align-items:center;gap:12px;box-shadow:0 2px 8px rgba(20,36,53,0.07);cursor:pointer;">
                  <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:white;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">AD</div>
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:700;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;">Amandine Durand</div>
                    <div style="font-size:12px;color:var(--text-light);font-family:'DM Sans',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Tu cherches toujours un accountability buddy ?</div>
                  </div>
                  <div style="font-size:11px;color:var(--text-light);font-family:'DM Sans',sans-serif;flex-shrink:0;">Lun</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── OUTILS & SUIVI ── -->
          <div class="demo-section" id="demo-sec-outils">
            <div class="demo-section-content">
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
                <div style="background:white;border-radius:14px;padding:22px;box-shadow:0 2px 10px rgba(20,36,53,0.07);cursor:pointer;transition:transform .2s,box-shadow .2s;" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px rgba(20,36,53,0.13)'" onmouseout="this.style.transform='';this.style.boxShadow='0 2px 10px rgba(20,36,53,0.07)'">
                  <div style="font-size:28px;margin-bottom:10px;">📋</div>
                  <div style="font-size:15px;font-weight:700;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;margin-bottom:4px;">Plan d'action</div>
                  <div style="font-size:12px;color:var(--text-light);font-family:'DM Sans',sans-serif;">Tes objectifs trimestriels et hebdomadaires</div>
                </div>
                <div style="background:white;border-radius:14px;padding:22px;box-shadow:0 2px 10px rgba(20,36,53,0.07);cursor:pointer;transition:transform .2s,box-shadow .2s;" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px rgba(20,36,53,0.13)'" onmouseout="this.style.transform='';this.style.boxShadow='0 2px 10px rgba(20,36,53,0.07)'">
                  <div style="font-size:28px;margin-bottom:10px;">📓</div>
                  <div style="font-size:15px;font-weight:700;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;margin-bottom:4px;">Carnet de bord</div>
                  <div style="font-size:12px;color:var(--text-light);font-family:'DM Sans',sans-serif;">Notes, réflexions et suivi de progression</div>
                </div>
                <div style="background:white;border-radius:14px;padding:22px;box-shadow:0 2px 10px rgba(20,36,53,0.07);cursor:pointer;transition:transform .2s,box-shadow .2s;" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px rgba(20,36,53,0.13)'" onmouseout="this.style.transform='';this.style.boxShadow='0 2px 10px rgba(20,36,53,0.07)'">
                  <div style="font-size:28px;margin-bottom:10px;">📊</div>
                  <div style="font-size:15px;font-weight:700;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;margin-bottom:4px;">Bilan &amp; Audit</div>
                  <div style="font-size:12px;color:var(--text-light);font-family:'DM Sans',sans-serif;">Analyse de tes résultats business</div>
                </div>
                <div style="background:white;border-radius:14px;padding:22px;box-shadow:0 2px 10px rgba(20,36,53,0.07);cursor:pointer;transition:transform .2s,box-shadow .2s;" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px rgba(20,36,53,0.13)'" onmouseout="this.style.transform='';this.style.boxShadow='0 2px 10px rgba(20,36,53,0.07)'">
                  <div style="font-size:28px;margin-bottom:10px;">🤝</div>
                  <div style="font-size:15px;font-weight:700;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;margin-bottom:4px;">Accountability Buddy</div>
                  <div style="font-size:12px;color:var(--text-light);font-family:'DM Sans',sans-serif;">Trouve ta partenaire de progression</div>
                </div>
                <div style="background:linear-gradient(135deg,rgba(235,193,76,0.08),rgba(252,186,51,0.04));border:1.5px solid rgba(235,193,76,0.2);border-radius:14px;padding:22px;cursor:pointer;transition:transform .2s;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform=''">
                  <div style="font-size:28px;margin-bottom:10px;">📞</div>
                  <div style="font-size:15px;font-weight:700;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;margin-bottom:4px;">Hotline Business</div>
                  <div style="font-size:12px;color:var(--text-light);font-family:'DM Sans',sans-serif;">Appel rapide avec une experte · Visionnaire</div>
                  <div style="margin-top:10px;font-size:11px;font-weight:700;color:var(--gold-bright);font-family:'DM Sans',sans-serif;">◆ Exclusif Visionnaire</div>
                </div>
                <div style="background:linear-gradient(135deg,rgba(235,193,76,0.08),rgba(252,186,51,0.04));border:1.5px solid rgba(235,193,76,0.2);border-radius:14px;padding:22px;cursor:pointer;transition:transform .2s;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform=''">
                  <div style="font-size:28px;margin-bottom:10px;">🎯</div>
                  <div style="font-size:15px;font-weight:700;color:var(--navy-darkest);font-family:'DM Sans',sans-serif;margin-bottom:4px;">Coaching 1-1</div>
                  <div style="font-size:12px;color:var(--text-light);font-family:'DM Sans',sans-serif;">Session individuelle avec Sarah · 60 min</div>
                  <div style="margin-top:10px;font-size:11px;font-weight:700;color:var(--gold-bright);font-family:'DM Sans',sans-serif;">◆ Exclusif Visionnaire</div>
                </div>
              </div>
            </div>
          </div>

        </div><!-- end demo-sections -->
      </div><!-- end demo-pmain -->
    </div><!-- end demo-shell -->
  </div><!-- end page-demo -->

"""

DASHBOARD_ANCHOR = "    <!-- ── DASHBOARD ── -->\n  <div class=\"page active\" id=\"page-dashboard\">"
assert DASHBOARD_ANCHOR in html, "Dashboard anchor not found!"
html = html.replace(DASHBOARD_ANCHOR, PAGE_DEMO + DASHBOARD_ANCHOR, 1)
print("✓ page-demo HTML inserted")

# ── 3. showPage(): add 'demo' to public pages condition ────────────────
OLD_PUBLIC = "if (page === 'landing' || page === 'blog' || page === 'bibliotheque' || page === 'contact') {"
NEW_PUBLIC = "if (page === 'landing' || page === 'blog' || page === 'bibliotheque' || page === 'contact' || page === 'demo') {"
assert OLD_PUBLIC in html, "showPage public condition not found!"
html = html.replace(OLD_PUBLIC, NEW_PUBLIC, 1)
print("✓ showPage() public condition updated")

# ── 4. showPage(): add 'demo' to map and titles ────────────────────────
OLD_MAP = "      bibliotheque:'bibliotheque'\n    };"
NEW_MAP = "      bibliotheque:'bibliotheque',\n      demo:'demo'\n    };"
assert OLD_MAP in html, "showPage map not found!"
html = html.replace(OLD_MAP, NEW_MAP, 1)
print("✓ showPage() map updated")

OLD_TITLES = "      bibliotheque: 'La Bibliothèque Ambitieuse'\n    };"
NEW_TITLES = "      bibliotheque: 'La Bibliothèque Ambitieuse',\n      demo: 'Espace membre · Démo'\n    };"
assert OLD_TITLES in html, "showPage titles not found!"
html = html.replace(OLD_TITLES, NEW_TITLES, 1)
print("✓ showPage() titles updated")

# ── 5. Add showDemoSection() JS function after showPage() ──────────────
SHOW_PAGE_END = "    if (window.innerWidth <= 900) sidebar.classList.remove('open');\n  }\n\n  function profileSwitchTab"
SHOW_DEMO_FN = """    if (window.innerWidth <= 900) sidebar.classList.remove('open');
  }

  function showDemoSection(s, title) {
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
assert SHOW_PAGE_END in html, "showPage end / profileSwitchTab anchor not found!"
html = html.replace(SHOW_PAGE_END, SHOW_DEMO_FN, 1)
print("✓ showDemoSection() function added")

# ── 6. Button: change onclick from 'dashboard' to 'demo' ───────────────
OLD_BTN = """<button class="btn-outline-gold" onclick="showPage('dashboard')">Explorer l\u2019espace membre en direct \u2192</button>"""
NEW_BTN = """<button class="btn-outline-gold" onclick="showPage('demo')">Explorer l\u2019espace membre en direct \u2192</button>"""
assert OLD_BTN in html, "Button onclick not found!"
html = html.replace(OLD_BTN, NEW_BTN, 1)
print("✓ Button onclick updated to showPage('demo')")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("\n✅ All changes applied successfully!")
