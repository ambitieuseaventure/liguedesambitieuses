(function(){
  var currentUserId='user-sophie-a';
  var nbFilter='tous', nbSort='recent';
  var THEMES=['finances','marketing','vente','mindset','gestion','autre'];
  var LABEL={finances:'💰 Finances',marketing:'📣 Marketing',vente:'🤝 Vente',mindset:'🧠 Mindset',gestion:'🗂️ Gestion',autre:'🏷️ Autre'};
  var MODE_LABELS={matin:'🌅 Matin',soir:'🌙 Soir',victoire:'🏆 Victoire',blocage:'🔓 Blocage'};
  var MOOD_ADVICE={
    1:"Aujourd'hui, une toute petite action compte. Prends soin de toi d'abord. 💙",
    2:"Lance-toi sur quelque chose de simple pour reprendre de l'élan. 🌱",
    3:"Mode stable — idéal pour avancer sur tes tâches de fond. 💪",
    4:"Tu es en forme ! C'est le moment d'attaquer une action importante. ✨",
    5:"Tu es en feu ! C'est LE moment d'avancer sur ta priorité N°1. 🔥"
  };

  function ensureCss(){
    if (document.querySelector('link[data-notebook-enhanced-css]')) return;
    var l=document.createElement('link');
    l.rel='stylesheet';
    l.href='assets/notebook-enhanced.css';
    l.setAttribute('data-notebook-enhanced-css','1');
    document.head.appendChild(l);
  }

  function norm(t){ t=(t||'').toLowerCase(); if(t==='finance')return'finances'; if(t==='organisation')return'gestion'; if(t==='offre'||t==='clients')return'vente'; return THEMES.includes(t)?t:'autre'; }
  function esc(v){return String(v||'').replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
  function g(k,d){ try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d));}catch(e){return d;} }
  function s(k,v){ localStorage.setItem(k,JSON.stringify(v)); }
  function notesStore(){return g('resource_notes_db',{});}
  function setNotesStore(v){s('resource_notes_db',v);}
  function ideasStore(){return g('notebook_ideas_status_db',{});}
  function setIdeasStore(v){s('notebook_ideas_status_db',v);}
  function actionsStore(){var all=g('notebook_actions_db',{}); return all[currentUserId]||[];}
  function setActionsStore(items){var all=g('notebook_actions_db',{}); all[currentUserId]=items; s('notebook_actions_db',all);}
  function fDate(iso){var d=new Date(iso||0); return d.toLocaleDateString('fr-FR')+' · '+d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});}

  /* ── Journal helpers ── */
  function getJournalEntries(){try{return JSON.parse(localStorage.getItem('journal_entries')||'[]');}catch(e){return[];}}
  function getTodayJournalEntry(){
    var today=new Date().toDateString();
    return getJournalEntries().find(function(e){return new Date(e.date).toDateString()===today;})||null;
  }

  /* ── Toggle action by ID (used by focus card) ── */
  window.toggleNotebookActionById=function(id){
    var arr=actionsStore().map(function(a){if(a.id===id){a.done=!a.done;a.updatedAt=new Date().toISOString();}return a;});
    setActionsStore(arr); renderNotebook(); renderDashboardFocusDuJour();
  };

  /* ── Create action from journal blocage ── */
  window.createActionFromJournal=function(text,theme){
    var arr=actionsStore();
    arr.unshift({id:'a_'+Date.now(),text:text,theme:theme||'mindset',done:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
    setActionsStore(arr);
    if(window.showPage) window.showPage('notebook');
    else renderNotebook();
  };

  function deriveMeta(resourceId,title){
    var f=document.querySelector('[data-note-field="retains"][data-resource-id="'+resourceId+'"]')||document.querySelector('[data-note-field="apply"][data-resource-id="'+resourceId+'"]');
    var card=f?f.closest('.resource-card,.course-card'):null; var theme=norm(card&&card.dataset?card.dataset.theme:'autre');
    return {theme:theme,themeLabel:LABEL[theme],resourceTitle:title||'Contenu'};
  }

  window.saveResourceNote=function(resourceId,resourceTitle){
    var retain=document.querySelector('[data-note-field="retains"][data-resource-id="'+resourceId+'"]');
    var apply=document.querySelector('[data-note-field="apply"][data-resource-id="'+resourceId+'"]'); if(!retain||!apply)return;
    var store=notesStore(), key=currentUserId+'::'+resourceId, meta=deriveMeta(resourceId,resourceTitle);
    store[key]={userId:currentUserId,resourceId:resourceId,resourceTitle:meta.resourceTitle,retains:retain.value.trim(),apply:apply.value.trim(),theme:meta.theme,themeLabel:meta.themeLabel,updatedAt:new Date().toISOString()};
    setNotesStore(store); var st=document.getElementById('note-status-'+resourceId); if(st) st.textContent='Enregistré le '+fDate(store[key].updatedAt); renderNotebook();
  };

  window.saveNotebookNote=function(resourceId,title){
    var retain=document.getElementById('nb-retain-'+resourceId), apply=document.getElementById('nb-apply-'+resourceId); if(!retain||!apply)return;
    var store=notesStore(), key=currentUserId+'::'+resourceId, prev=store[key]||{}, meta=deriveMeta(resourceId,title||prev.resourceTitle);
    store[key]={userId:currentUserId,resourceId:resourceId,resourceTitle:title||prev.resourceTitle||meta.resourceTitle,retains:retain.value.trim(),apply:apply.value.trim(),theme:norm(prev.theme||meta.theme),themeLabel:LABEL[norm(prev.theme||meta.theme)],updatedAt:new Date().toISOString()};
    setNotesStore(store); renderNotebook();
  };

  function userNotes(){
    return Object.values(notesStore()).filter(function(n){return n&&n.userId===currentUserId&&(n.retains||n.apply);}).map(function(n){n.theme=norm(n.theme);n.themeLabel=LABEL[n.theme];return n;});
  }
  function grouped(items){var g={}; THEMES.forEach(function(t){g[t]=[]}); items.forEach(function(i){g[norm(i.theme)].push(i)}); return THEMES.filter(function(t){return g[t].length}).map(function(t){return {t:t,l:LABEL[t],items:g[t]};});}

  function addCourseNoteCards(){
    document.querySelectorAll('#courses-grid .course-card').forEach(function(card){
      var st=card.dataset.statut; if(st!=='en-cours'&&st!=='terminee') return;
      if(card.querySelector('.nb-course-note')) return;
      var title=(card.querySelector('h3')||{}).textContent||'Formation';
      var rid='course-'+title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
      var box=document.createElement('div'); box.className='notes-card nb-course-note';
      box.innerHTML='<div class="notes-card-title">Mon pense-bête</div>'+
        '<label class="notes-field-label">Ce que je retiens</label><textarea class="notes-field" data-note-field="retains" data-resource-id="'+rid+'"></textarea>'+
        '<label class="notes-field-label">Comment je vais l\'appliquer</label><textarea class="notes-field" data-note-field="apply" data-resource-id="'+rid+'"></textarea>'+
        '<div style="display:flex;align-items:center;"><button class="dl-btn" data-save-note="'+rid+'" data-title="Formation · '+esc(title)+'">Enregistrer</button><span class="notes-status" id="note-status-'+rid+'">Aucune note enregistrée</span></div>';
      card.querySelector('.course-body').appendChild(box);
    });
    document.querySelectorAll('[data-save-note]').forEach(function(btn){ if(btn.dataset.bound) return; btn.dataset.bound='1'; btn.addEventListener('click',function(){saveResourceNote(btn.dataset.saveNote,btn.dataset.title);}); });
  }

  function preloadResourceNotes(){
    var store=notesStore(); Object.keys(store).forEach(function(k){ var n=store[k]; if(!n||n.userId!==currentUserId)return;
      var r=document.querySelector('[data-note-field="retains"][data-resource-id="'+n.resourceId+'"]'); var a=document.querySelector('[data-note-field="apply"][data-resource-id="'+n.resourceId+'"]');
      if(r) r.value=n.retains||''; if(a) a.value=n.apply||''; var st=document.getElementById('note-status-'+n.resourceId); if(st) st.textContent='Enregistré le '+fDate(n.updatedAt);
    });
  }

  /* ── Focus du Jour HTML ── */
  function buildFocusDuJour(){
    var todayEntry=getTodayJournalEntry();
    var acts=actionsStore().filter(function(a){return !a.done;});
    var topAction=acts[0]||null;
    var html='<div class="nb-focus-inner">';

    /* Journal side */
    html+='<div class="nb-focus-col nb-focus-journal">';
    html+='<div class="nb-focus-col-title">📓 Journal du jour</div>';
    if(todayEntry){
      html+='<div class="nb-focus-mood-row">';
      html+='<span class="nb-focus-mood-emoji">'+(todayEntry.moodEmoji||'')+'</span>';
      html+='<div><div class="nb-focus-mood-label">'+esc(todayEntry.moodLabel||'')+'</div>';
      if(todayEntry.mode) html+='<div class="nb-focus-mode">'+esc(MODE_LABELS[todayEntry.mode]||todayEntry.mode)+'</div>';
      html+='</div></div>';
      var advice=MOOD_ADVICE[todayEntry.mood];
      if(advice) html+='<div class="nb-focus-advice">'+esc(advice)+'</div>';
      if(todayEntry.tags&&todayEntry.tags.length){
        html+='<div class="nb-focus-tags">'+todayEntry.tags.map(function(t){return'<span class="nb-focus-tag">'+esc(t)+'</span>';}).join('')+'</div>';
      }
    } else {
      html+='<div class="nb-focus-no-journal">';
      html+='<div style="font-size:28px;margin-bottom:8px;">📓</div>';
      html+='<div style="margin-bottom:10px;">Tu n\'as pas encore journalisé aujourd\'hui.</div>';
      html+='<a href="#" class="nb-focus-cta-link" onclick="if(window.showPage)window.showPage(\'mindset\');return false;">Ouvrir le journal →</a>';
      html+='</div>';
    }
    html+='</div>';

    /* Actions side */
    html+='<div class="nb-focus-col nb-focus-actions-col">';
    html+='<div class="nb-focus-col-title">💪 Action prioritaire du jour</div>';
    if(topAction){
      html+='<div class="nb-focus-action-item">';
      html+='<input type="checkbox" onchange="toggleNotebookActionById(\''+topAction.id+'\')" style="width:16px;height:16px;cursor:pointer;flex-shrink:0;">';
      html+='<span class="nb-focus-action-text">'+esc(topAction.text)+'</span>';
      html+='<span class="nb-chip" style="margin:0;flex-shrink:0;">'+esc(LABEL[norm(topAction.theme)]||topAction.theme)+'</span>';
      html+='</div>';
      if(acts.length>1){
        html+='<div style="font-size:11px;color:var(--text-light);margin-top:8px;">+ '+(acts.length-1)+' autre'+(acts.length>2?'s':'')+' action'+(acts.length>2?'s':'')+' en attente</div>';
      }
    } else {
      html+='<div class="nb-focus-no-action">Toutes tes actions sont faites — bravo ! 🎉<br><span style="font-size:11px;opacity:.7;">Ajoute une nouvelle action ci-dessous.</span></div>';
    }
    html+='</div>';

    html+='</div>';
    return html;
  }

  function renderDashboardFocusDuJour(){
    var target=document.getElementById('dashboard-focus-du-jour');
    if(!target) return;
    target.innerHTML=buildFocusDuJour();
  }

  /* ── Victoires du journal ── */
  function buildVictoires(){
    var victories=getJournalEntries().filter(function(e){return e.mode==='victoire';}).slice(0,6);
    if(!victories.length){
      return '<div class="nb-empty-msg">Célèbre tes victoires dans ton journal — elles apparaîtront ici ! 🏆<br><a href="#" onclick="if(window.showPage)window.showPage(\'mindset\');return false;" style="color:var(--gold);font-size:12px;">Ouvrir le journal →</a></div>';
    }
    return victories.map(function(e){
      var d=new Date(e.date);
      var ds=d.toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'});
      var excerpt=e.text.length>130?e.text.slice(0,130)+'…':e.text;
      return '<div class="nb-item nb-victoire-item">'
        +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">'
        +'<span style="font-size:11px;color:var(--text-light);">🏆 '+esc(ds)+'</span>'
        +(e.moodEmoji?'<span style="font-size:15px;" title="'+esc(e.moodLabel||'')+'">'+e.moodEmoji+'</span>':'')
        +'</div>'
        +'<div style="color:var(--text-dark);line-height:1.55;font-size:13px;">'+esc(excerpt)+'</div>'
        +(e.tags&&e.tags.length?'<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">'+e.tags.map(function(t){return'<span class="nb-chip">'+esc(t)+'</span>';}).join('')+'</div>':'')
        +'</div>';
    }).join('');
  }

  function renderNotebook(){
    var page=document.querySelector('#page-notebook .page-content'); if(!page) return;
    var notes=userNotes();
    var filtered=notes.filter(function(n){return nbFilter==='tous'||n.theme===nbFilter;}).sort(function(a,b){return nbSort==='oldest'?new Date(a.updatedAt)-new Date(b.updatedAt):new Date(b.updatedAt)-new Date(a.updatedAt)});
    var ideas=ideasStore();
    var acts=actionsStore(); if(nbFilter!=='tous') acts=acts.filter(function(a){return norm(a.theme)===nbFilter;});

    var victories=getJournalEntries().filter(function(e){return e.mode==='victoire';});

    page.innerHTML=''
      +'<div class="section-header"><div class="section-title">Mon carnet <em>d\'apprentissage</em></div><div class="section-sub">Ton outil quotidien pour apprendre, agir et célébrer tes victoires.</div></div>'

      /* Focus du Jour */
      +'<div class="nb-section nb-focus-card" style="margin-bottom:16px;">'
      +'<div class="nb-title">🌟 Focus du Jour</div>'
      +buildFocusDuJour()
      +'</div>'

      /* Toolbar */
      +'<div class="nb-toolbar"><div class="nb-tags" id="nb-tags"></div><div><select id="nb-sort"><option value="recent">Plus récentes</option><option value="oldest">Plus anciennes</option></select></div></div>'

      /* Déclics + Idées */
      +'<div class="nb-grid2"><div class="nb-section"><div class="nb-title">✨ Mes déclics récents</div><div id="nb-declics" class="nb-list"></div></div><div class="nb-section"><div class="nb-title">💡 Mes idées à tester</div><div id="nb-ideas" class="nb-list"></div></div></div>'

      /* Actions */
      +'<div class="nb-section" style="margin-top:16px;"><div class="nb-title">✅ Mes actions concrètes</div><div class="nb-actions-input"><select id="nb-action-theme"><option value="finances">Finances</option><option value="marketing">Marketing</option><option value="vente">Vente</option><option value="mindset">Mindset</option><option value="gestion">Gestion</option><option value="autre">Autre</option></select><input id="nb-action-input" placeholder="Ex: Relire mon pitch de vente"/><button class="dl-btn" id="nb-add-action">Ajouter</button></div><div id="nb-actions" class="nb-list"></div></div>'

      /* Victoires du journal */
      +'<div class="nb-section" style="margin-top:16px;"><div class="nb-title">🏆 Mes victoires</div><div class="nb-focus-victoire-sub">Tes victoires célébrées dans le journal de bord</div><div id="nb-victories" class="nb-list">'+buildVictoires()+'</div></div>'

      /* Bilan mensuel */
      +'<div class="nb-section" style="margin-top:16px;"><div class="nb-title">📊 Bilan automatique mensuel</div><div id="nb-kpis" class="nb-kpis"></div></div>';

    /* Tags filter */
    var tags=document.getElementById('nb-tags'); ['tous'].concat(THEMES).forEach(function(t){ var b=document.createElement('button'); b.className='nb-tag'+(nbFilter===t?' active':''); b.textContent=t==='tous'?'Tous les thèmes':LABEL[t]; b.onclick=function(){nbFilter=t; renderNotebook();}; tags.appendChild(b);});
    var srt=document.getElementById('nb-sort'); srt.value=nbSort; srt.onchange=function(){nbSort=srt.value; renderNotebook();};

    /* Déclics */
    var d=document.getElementById('nb-declics');
    if(!filtered.length) d.innerHTML='<div class="nb-empty-msg">Ajoute des pense-bêtes dans tes ressources ou formations !</div>';
    grouped(filtered).forEach(function(g){ var t=document.createElement('div'); t.className='notebook-theme-group-title'; t.textContent=g.l; d.appendChild(t);
      g.items.forEach(function(n){ var el=document.createElement('div'); el.className='nb-item'; el.innerHTML='<strong>'+esc(n.resourceTitle)+'</strong><div class="nb-chip">'+esc(n.themeLabel)+'</div><div style="font-size:12px;color:var(--text-light)">Modifié le '+fDate(n.updatedAt)+'</div><label class="notes-field-label">Ce que je retiens</label><textarea class="notes-field" id="nb-retain-'+n.resourceId+'">'+esc(n.retains||'')+'</textarea><label class="notes-field-label">Comment je vais l\'appliquer</label><textarea class="notes-field" id="nb-apply-'+n.resourceId+'">'+esc(n.apply||'')+'</textarea><button class="dl-btn" data-save-nb="'+n.resourceId+'">Enregistrer</button>'; d.appendChild(el);});
    });
    d.querySelectorAll('[data-save-nb]').forEach(function(b){ b.onclick=function(){saveNotebookNote(b.dataset.saveNb);}; });

    /* Idées */
    var id=document.getElementById('nb-ideas');
    var ideasFiltered=filtered.filter(function(n){return (n.apply||'').trim();});
    if(!ideasFiltered.length) id.innerHTML='<div class="nb-empty-msg">Note comment tu vas appliquer tes apprentissages pour les retrouver ici !</div>';
    grouped(ideasFiltered).forEach(function(g){ var t=document.createElement('div'); t.className='notebook-theme-group-title'; t.textContent=g.l; id.appendChild(t);
      g.items.forEach(function(n){ var k=currentUserId+'::'+n.resourceId, st=ideas[k]||'a-tester'; var el=document.createElement('div'); el.className='nb-item'; el.innerHTML='<strong>'+esc(n.resourceTitle)+'</strong><div class="nb-chip">'+esc(n.themeLabel)+'</div><div style="font-size:13px;color:var(--text-dark);margin:6px 0;">'+esc(n.apply||'')+'</div><select data-idea="'+n.resourceId+'" class="nb-idea-status nb-idea-status--'+st+'"><option value="a-tester"'+(st==='a-tester'?' selected':'')+'>📋 À tester</option><option value="en-cours"'+(st==='en-cours'?' selected':'')+'>⚡ En cours</option><option value="teste"'+(st==='teste'?' selected':'')+'>✅ Testé !</option></select>'; id.appendChild(el);});
    });
    id.querySelectorAll('[data-idea]').forEach(function(sel){ sel.onchange=function(){ var st=ideasStore(); st[currentUserId+'::'+sel.dataset.idea]=sel.value; setIdeasStore(st); sel.className='nb-idea-status nb-idea-status--'+sel.value; }; });

    /* Actions */
    var al=document.getElementById('nb-actions');
    if(!acts.length) al.innerHTML='<div class="nb-empty-msg">Ajoute ta première action concrète !</div>';
    var pendingActs=acts.filter(function(a){return !a.done;});
    var doneActs=acts.filter(function(a){return a.done;});
    function renderActionItems(arr,container){
      grouped(arr.map(function(a){a.theme=norm(a.theme||'autre'); return a;})).forEach(function(g){ var t=document.createElement('div'); t.className='notebook-theme-group-title'; t.textContent=g.l; container.appendChild(t);
        g.items.forEach(function(a){ var el=document.createElement('div'); el.className='nb-item nb-action-item'+(a.done?' done':''); el.innerHTML='<div style="display:flex;align-items:center;gap:8px;"><input type="checkbox"'+(a.done?' checked':'')+' data-tog="'+a.id+'" style="width:16px;height:16px;cursor:pointer;flex-shrink:0;"><div class="notebook-action-text" style="flex:1;'+(a.done?'text-decoration:line-through;color:#aaa':'')+'">'+esc(a.text)+'</div><button data-del="'+a.id+'" class="notebook-action-del">✕</button></div>'; container.appendChild(el);});
      });
    }
    renderActionItems(pendingActs,al);
    if(doneActs.length){
      var sep=document.createElement('div'); sep.style.cssText='font-size:11px;color:var(--text-light);margin:10px 0 4px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;'; sep.textContent='✓ Complétées'; al.appendChild(sep);
      renderActionItems(doneActs,al);
    }
    al.querySelectorAll('[data-tog]').forEach(function(e){ e.onchange=function(){ var arr=actionsStore().map(function(a){if(a.id===e.dataset.tog){a.done=!a.done;a.updatedAt=new Date().toISOString();}return a;}); setActionsStore(arr); renderNotebook();};});
    al.querySelectorAll('[data-del]').forEach(function(e){ e.onclick=function(){ var arr=actionsStore().filter(function(a){return a.id!==e.dataset.del}); setActionsStore(arr); renderNotebook();};});

    document.getElementById('nb-add-action').onclick=function(){ var inp=document.getElementById('nb-action-input'); var th=document.getElementById('nb-action-theme'); if(!inp.value.trim()) return; var arr=actionsStore(); arr.unshift({id:'a_'+Date.now(),text:inp.value.trim(),theme:th.value,done:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}); setActionsStore(arr); inp.value=''; renderNotebook(); };

    /* KPIs */
    var now=new Date(); var mNotes=notes.filter(function(n){var d=new Date(n.updatedAt);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
    var mActs=actionsStore().filter(function(a){var d=new Date(a.updatedAt||a.createdAt);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
    var tc={}; mNotes.forEach(function(n){tc[n.theme]=(tc[n.theme]||0)+1;}); var dom='—'; Object.keys(tc).sort(function(a,b){return tc[b]-tc[a]}).slice(0,1).forEach(function(k){dom=LABEL[k]||k;});
    var journalEntries=getJournalEntries(); var mJournal=journalEntries.filter(function(e){var d=new Date(e.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
    var mVictoires=mJournal.filter(function(e){return e.mode==='victoire';}).length;
    var journalDates=JSON.parse(localStorage.getItem('journal_dates')||'[]');
    var streak=0; var today=new Date(); for(var i=0;i<journalDates.length;i++){var diff=Math.round((today-new Date(journalDates[i]))/86400000);if(diff===i)streak++;else break;}
    var kpis=[
      ['📓 Jours journalisés ce mois',mJournal.length],
      ['🔥 Série actuelle',streak>0?streak+' jour'+(streak>1?'s':''):'—'],
      ['🏆 Victoires ce mois',mVictoires],
      ['Contenus consultés',Object.keys(mNotes.reduce(function(o,n){o[n.resourceId]=1;return o;},{})).length],
      ['Notes créées',mNotes.length],
      ['Actions réalisées',mActs.filter(function(a){return a.done;}).length],
      ['Actions en cours',actionsStore().filter(function(a){return !a.done;}).length],
      ['Thème dominant',dom]
    ];
    var kb=document.getElementById('nb-kpis'); kb.innerHTML=kpis.map(function(i){return '<div class="nb-kpi"><div class="k">'+esc(i[0])+'</div><div class="v">'+esc(i[1])+'</div></div>';}).join('');
    renderDashboardFocusDuJour();
  }

  window.renderNotebookPage = renderNotebook;
  window.preloadResourceNotes = preloadResourceNotes;
  window.renderDashboardFocusDuJour = renderDashboardFocusDuJour;
  function init(){ ensureCss(); addCourseNoteCards(); preloadResourceNotes(); renderNotebook(); renderDashboardFocusDuJour(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
