#!/usr/bin/env python3
"""Replace the GIF demo with a pure CSS animated mockup."""

with open('index.html', 'rb') as f:
    raw = f.read()

# ── 1. Replace CSS ────────────────────────────────────────────────────
OLD_CSS = (
    "    .lp-demo-space { background:white; }\n"
    "    .lp-demo-wrap { display:grid;grid-template-columns:1.05fr .95fr;gap:30px;align-items:center; }\n"
    "    .lp-demo-copy { display:flex;flex-direction:column;gap:16px; }\n"
    "    .lp-demo-copy p { font-size:15px;color:var(--text-light);line-height:1.75; }\n"
    "    .lp-demo-list { list-style:none;display:flex;flex-direction:column;gap:10px; }\n"
    "    .lp-demo-list li { font-size:14px;color:var(--navy);font-weight:500; }\n"
    "    .lp-demo-media { border-radius:20px;overflow:hidden;border:1px solid rgba(20,36,53,0.1);box-shadow:0 20px 36px rgba(20,36,53,0.12);background:#101f2e; }\n"
    "    .lp-demo-head { display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.12); }\n"
    "    .lp-demo-head strong { color:var(--gold-light);font-size:12px;letter-spacing:.08em;text-transform:uppercase; }\n"
    "    .lp-demo-gif { display:block;width:100%;height:auto; }\n"
    "    .lp-demo-caption { display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 18px;background:rgba(20,36,53,0.92);color:rgba(255,255,255,0.76);font-size:12px; }"
)

NEW_CSS = (
    "    .lp-demo-space { background:var(--bg); }\n"
    "    .lp-demo-wrap { display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center; }\n"
    "    .lp-demo-copy { display:flex;flex-direction:column;gap:14px; }\n"
    "    .lp-demo-copy p { font-size:14px;color:var(--text-light);line-height:1.7; }\n"
    "    .lp-demo-list { list-style:none;display:flex;flex-direction:column;gap:8px; }\n"
    "    .lp-demo-list li { font-size:13px;color:var(--navy);font-weight:500; }\n"
    "    .lp-demo-media { border-radius:16px;overflow:hidden;border:1px solid rgba(20,36,53,0.1);box-shadow:0 16px 48px rgba(20,36,53,0.14); }\n"
    "\n"
    "    /* \u2500\u2500 CSS Dashboard Mockup \u2500\u2500 */\n"
    "    .ldm { display:flex;height:340px;font-family:'DM Sans',sans-serif;font-size:12px;background:#f4f7fa; }\n"
    "    .ldm-sidebar { width:52px;background:#142435;display:flex;flex-direction:column;align-items:center;padding:16px 0;gap:0;flex-shrink:0; }\n"
    "    .ldm-logo { font-family:'Playfair Display',serif;font-size:9px;font-weight:700;color:#ebc14c;text-align:center;line-height:1.2;margin-bottom:20px; }\n"
    "    .ldm-nav { display:flex;flex-direction:column;gap:4px;width:100%; }\n"
    "    .ldm-ni { width:36px;height:36px;margin:0 auto;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px; }\n"
    "    .ldm-ni.active { background:rgba(235,193,76,0.18); }\n"
    "    .ldm-ni:not(.active) { opacity:.4; }\n"
    "    .ldm-tier { margin-top:auto;font-size:8px;font-weight:700;color:#ebc14c;letter-spacing:.06em;text-transform:uppercase;writing-mode:vertical-rl;transform:rotate(180deg);padding-bottom:8px;opacity:.8; }\n"
    "    .ldm-main { flex:1;overflow:hidden;display:flex;flex-direction:column;min-width:0; }\n"
    "    .ldm-banner { background:linear-gradient(120deg,#24425b,#1d3347);padding:14px 16px;border-bottom:1px solid rgba(235,193,76,0.15);position:relative;overflow:hidden;flex-shrink:0; }\n"
    "    .ldm-banner::after { content:'';position:absolute;top:-30px;right:-20px;width:130px;height:130px;background:radial-gradient(circle,rgba(235,193,76,0.1),transparent 70%);pointer-events:none; }\n"
    "    .ldm-hello { font-family:'Playfair Display',serif;font-size:14px;color:#fff;margin:0 0 2px;font-weight:700; }\n"
    "    .ldm-hello em { color:#ebc14c;font-style:normal; }\n"
    "    .ldm-sub { font-size:10px;color:rgba(255,255,255,0.55);margin:0; }\n"
    "    .ldm-badges { display:flex;gap:8px;margin-top:10px; }\n"
    "    .ldm-badge { background:rgba(235,193,76,0.14);border:1px solid rgba(235,193,76,0.3);border-radius:8px;padding:6px 10px;display:flex;flex-direction:column; }\n"
    "    .ldm-badge-num { font-family:'Playfair Display',serif;font-size:16px;color:#ebc14c;font-weight:700;line-height:1; }\n"
    "    .ldm-badge-lbl { font-size:9px;color:rgba(255,255,255,0.6);margin-top:1px; }\n"
    "    .ldm-palmares { background:rgba(235,193,76,0.1);border:1px solid rgba(235,193,76,0.28);border-radius:8px;padding:6px 10px;flex:1; }\n"
    "    .ldm-rang { font-family:'Playfair Display',serif;font-size:11px;color:#ebc14c;font-weight:700;display:block; }\n"
    "    .ldm-pts { font-size:9px;color:rgba(255,255,255,0.6);display:block;margin-bottom:5px; }\n"
    "    .ldm-pbar { height:4px;background:rgba(255,255,255,0.12);border-radius:4px;overflow:hidden; }\n"
    "    .ldm-pbar-fill { height:100%;width:62%;background:linear-gradient(90deg,#ebc14c,#fcba33);border-radius:4px; }\n"
    "    .ldm-content { flex:1;overflow:hidden;padding:10px 12px;display:flex;flex-direction:column;gap:8px; }\n"
    "    .ldm-row { display:grid;grid-template-columns:1.1fr 0.9fr;gap:8px;flex:1;min-height:0; }\n"
    "    .ldm-card { background:#fff;border-radius:10px;border:1px solid rgba(20,36,53,0.07);padding:10px 12px;overflow:hidden;box-shadow:0 2px 8px rgba(20,36,53,0.05); }\n"
    "    .ldm-card-title { font-family:'Playfair Display',serif;font-size:11px;color:#142435;font-weight:700;margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }\n"
    "    .ldm-course { margin-bottom:8px; }\n"
    "    .ldm-course-row { display:flex;justify-content:space-between;font-size:9.5px;color:#21374c;margin-bottom:3px; }\n"
    "    .ldm-course-row span { color:#fcba33;font-weight:700;flex-shrink:0;margin-left:4px; }\n"
    "    .ldm-prog { height:5px;background:#e8edf2;border-radius:5px;overflow:hidden; }\n"
    "    .ldm-prog-fill { height:100%;border-radius:5px;background:linear-gradient(90deg,#24425b,#4f85a0);animation:ldmFill 1.4s cubic-bezier(.4,0,.2,1) both; }\n"
    "    .ldm-prog-fill.p90 { width:90%;animation-delay:.1s; }\n"
    "    .ldm-prog-fill.p68 { width:68%;animation-delay:.3s; }\n"
    "    .ldm-prog-fill.p42 { width:42%;animation-delay:.5s; }\n"
    "    @keyframes ldmFill { from{width:0} }\n"
    "    .ldm-focus-item { font-size:9.5px;color:#21374c;background:#f4f7fa;border-radius:6px;padding:5px 7px;margin-bottom:5px;display:flex;align-items:center;gap:5px; }\n"
    "    .ldm-focus-item::before { content:'';width:5px;height:5px;border-radius:50%;background:#ebc14c;flex-shrink:0; }\n"
    "    .ldm-quote { background:rgba(235,193,76,0.1);border-radius:6px;padding:6px 8px;font-size:9px;color:#7a5c00;font-style:italic;margin-top:auto; }\n"
    "    .ldm-todo { background:#fff;border-radius:10px;border:1px solid rgba(20,36,53,0.07);padding:9px 12px;box-shadow:0 2px 8px rgba(20,36,53,0.05); }\n"
    "    .ldm-todo-title { font-family:'Playfair Display',serif;font-size:11px;color:#142435;font-weight:700;margin-bottom:5px; }\n"
    "    .ldm-todo-lbl { font-size:8.5px;font-weight:700;text-transform:uppercase;color:#4f85a0;letter-spacing:.06em;margin-bottom:3px; }\n"
    "    .ldm-todo-item { display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid rgba(20,36,53,0.05);font-size:9.5px;color:#142435; }\n"
    "    .ldm-todo-item:last-child { border:none; }\n"
    "    .ldm-check { width:13px;height:13px;border-radius:50%;border:1.5px solid rgba(20,36,53,0.22);flex-shrink:0; }\n"
    "    .ldm-check.done { background:#fcba33;border-color:#fcba33;display:flex;align-items:center;justify-content:center;font-size:8px;color:#142435;font-weight:700; }\n"
    "    .ldm-tag { font-size:8px;font-weight:700;padding:1px 5px;border-radius:10px;margin-left:auto;white-space:nowrap;flex-shrink:0; }\n"
    "    .ldm-tag-f { background:rgba(79,133,160,.15);color:#4f85a0; }\n"
    "    .ldm-tag-r { background:rgba(235,193,76,.2);color:#7a5c00; }\n"
    "    .ldm-tag-e { background:rgba(220,85,85,.12);color:#b94040; }\n"
    "    .ldm-caption { padding:9px 14px;background:rgba(20,36,53,0.88);display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,0.6);flex-shrink:0; }"
)

old_b = OLD_CSS.encode('utf-8')
new_b = NEW_CSS.encode('utf-8')

if old_b in raw:
    raw = raw.replace(old_b, new_b, 1)
    print("CSS replaced OK")
else:
    print("CSS pattern not found")
    idx = raw.find(b'.lp-demo-space')
    print(repr(raw[idx:idx+80]))

# ── 2. Replace the HTML section ───────────────────────────────────────
sec_start = raw.find(b'<section class="lp-section lp-demo-space"')
parcours_pos = raw.find(b'Section : Parcours', sec_start)
sec_end = raw.rfind(b'</section>', sec_start, parcours_pos) + len(b'</section>')
print(f"Section bytes: {sec_start} to {sec_end}")

NEW_HTML = """\
<section class="lp-section lp-demo-space" id="demo-espace-membre">
      <div class="lp-section-inner">
        <div class="lp-demo-wrap">

          <div class="lp-demo-copy">
            <div class="lp-tag-line">Un aper\u00e7u concret de ton quotidien dans la Ligue</div>
            <h2 class="lp-h2">\u00c0 l\u2019int\u00e9rieur de l\u2019espace membre\u00a0: <em>des actions claires</em>, pas de blabla</h2>
            <p>D\u00e8s ton abonnement activ\u00e9, tu arrives dans un espace guid\u00e9\u00a0: ton plan d\u2019action, les formations \u00e0 suivre dans l\u2019ordre, et un acc\u00e8s direct \u00e0 la communaut\u00e9.</p>
            <ul class="lp-demo-list">
              <li>\U0001f9ed Dashboard prioris\u00e9 pour savoir quoi faire cette semaine</li>
              <li>\U0001f393 Formations tri\u00e9es par th\u00e8mes pour progresser sans te disperser</li>
              <li>\U0001f91d Espace communaut\u00e9\u00a0+ annuaire pour trouver des partenaires</li>
              <li>\U0001f4c8 Outils de suivi pour mesurer tes progr\u00e8s et rester r\u00e9guli\u00e8re</li>
            </ul>
            <button class="btn-outline-gold" onclick="showPage('dashboard')">Explorer l\u2019espace membre en direct \u2192</button>
          </div>

          <div class="lp-demo-media">
            <div class="ldm">
              <div class="ldm-sidebar">
                <div class="ldm-logo">LA<br>LIGUE</div>
                <nav class="ldm-nav">
                  <div class="ldm-ni active" title="Dashboard">\U0001f3e0</div>
                  <div class="ldm-ni" title="Formations">\U0001f393</div>
                  <div class="ldm-ni" title="Communaut\u00e9">\U0001f91d</div>
                  <div class="ldm-ni" title="Biblioth\u00e8que">\U0001f4da</div>
                  <div class="ldm-ni" title="Profil">\U0001f464</div>
                </nav>
                <div class="ldm-tier">\u25c6 Visionnaire</div>
              </div>
              <div class="ldm-main">
                <div class="ldm-banner">
                  <p class="ldm-hello">Bonjour, Sophie\u00a0! <em>\u2736</em></p>
                  <p class="ldm-sub">Tu es membre depuis 47 jours \u2014 continue sur ta lanc\u00e9e\u00a0!</p>
                  <div class="ldm-badges">
                    <div class="ldm-badge">
                      <span class="ldm-badge-num">4</span>
                      <span class="ldm-badge-lbl">formations<br>en cours</span>
                    </div>
                    <div class="ldm-palmares">
                      <span class="ldm-rang">B\u00e2tisseuse</span>
                      <span class="ldm-pts">1\u00a0240 pts d\u2019Ambition</span>
                      <div class="ldm-pbar"><div class="ldm-pbar-fill"></div></div>
                    </div>
                  </div>
                </div>
                <div class="ldm-content">
                  <div class="ldm-row">
                    <div class="ldm-card">
                      <div class="ldm-card-title">Mes formations en cours</div>
                      <div class="ldm-course">
                        <div class="ldm-course-row">Les bases de la comptabilit\u00e9 <span>90\u00a0%</span></div>
                        <div class="ldm-prog"><div class="ldm-prog-fill p90"></div></div>
                      </div>
                      <div class="ldm-course">
                        <div class="ldm-course-row">Lancer son offre de A \u00e0 Z <span>68\u00a0%</span></div>
                        <div class="ldm-prog"><div class="ldm-prog-fill p68"></div></div>
                      </div>
                      <div class="ldm-course">
                        <div class="ldm-course-row">Trouver ses premiers clients <span>42\u00a0%</span></div>
                        <div class="ldm-prog"><div class="ldm-prog-fill p42"></div></div>
                      </div>
                    </div>
                    <div class="ldm-card" style="display:flex;flex-direction:column;">
                      <div class="ldm-card-title">\U0001f31f Focus du jour</div>
                      <div class="ldm-focus-item">Finir module 3 \u2013 Comptabilit\u00e9</div>
                      <div class="ldm-focus-item">Partager une victoire</div>
                      <div class="ldm-focus-item">Pr\u00e9parer le Q&amp;R de jeudi</div>
                      <div class="ldm-quote">&ldquo;Chaque action compte, m\u00eame petite.&rdquo;</div>
                    </div>
                  </div>
                  <div class="ldm-todo">
                    <div class="ldm-todo-title">Ma to-do list</div>
                    <div class="ldm-todo-lbl">Aujourd\u2019hui</div>
                    <div class="ldm-todo-item">
                      <div class="ldm-check done">\u2713</div>
                      Finir module 3 \u2013 Compta
                      <span class="ldm-tag ldm-tag-f">Formation</span>
                    </div>
                    <div class="ldm-todo-item">
                      <div class="ldm-check"></div>
                      R\u00e9pondre \u00e0 Clara B.
                      <span class="ldm-tag ldm-tag-r">R\u00e9seau</span>
                    </div>
                    <div class="ldm-todo-item">
                      <div class="ldm-check"></div>
                      Pr\u00e9parer Q&amp;R du jeudi
                      <span class="ldm-tag ldm-tag-e">\u00c9v\u00e9nement</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="ldm-caption">
              <span>Aper\u00e7u de l\u2019espace membre</span>
              <span>\u25c6 Niveau Visionnaire</span>
            </div>
          </div>

        </div>
      </div>
    </section>"""

raw = raw[:sec_start] + NEW_HTML.encode('utf-8') + raw[sec_end:]

with open('index.html', 'wb') as f:
    f.write(raw)

print(f"Done. File: {len(raw)//1024} KB")

# Quick sanity check
with open('index.html', 'rb') as f:
    check = f.read()
assert b'ldm-prog-fill p90' in check, "mockup HTML not found"
assert b'src="data:image' not in check, "base64 GIF still present"
assert b'<<<<<<' not in check, "conflict markers found"
print("Sanity checks passed")
