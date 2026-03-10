(function(){
  var currentUserId='user-sophie-a';
  var nbFilter='tous', nbSort='recent';
  var THEMES=['finances','marketing','vente','mindset','gestion','autre'];
  var LABEL={finances:'💰 Finances',marketing:'📣 Marketing',vente:'🤝 Vente',mindset:'🧠 Mindset',gestion:'🗂️ Gestion',autre:'🏷️ Autre'};

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

  function renderNotebook(){
    var page=document.querySelector('#page-notebook .page-content'); if(!page) return;
    var notes=userNotes();
    var filtered=notes.filter(function(n){return nbFilter==='tous'||n.theme===nbFilter;}).sort(function(a,b){return nbSort==='oldest'?new Date(a.updatedAt)-new Date(b.updatedAt):new Date(b.updatedAt)-new Date(a.updatedAt)});
    var ideas=ideasStore();
    var acts=actionsStore(); if(nbFilter!=='tous') acts=acts.filter(function(a){return norm(a.theme)===nbFilter;});

    page.innerHTML=''+
      '<div class="section-header"><div class="section-title">Mon carnet <em>d\'apprentissage</em></div><div class="section-sub">Ton carnet intelligent relié à tes ressources et formations.</div></div>'+
      '<div class="nb-toolbar"><div class="nb-tags" id="nb-tags"></div><div><select id="nb-sort"><option value="recent">Plus récentes</option><option value="oldest">Plus anciennes</option></select></div></div>'+
      '<div class="nb-grid2"><div class="nb-section"><div class="nb-title">✨ Mes déclics récents</div><div id="nb-declics" class="nb-list"></div></div><div class="nb-section"><div class="nb-title">💡 Mes idées à tester</div><div id="nb-ideas" class="nb-list"></div></div></div>'+
      '<div class="nb-section" style="margin-top:16px;"><div class="nb-title">✅ Mes actions concrètes</div><div class="nb-actions-input"><select id="nb-action-theme"><option value="finances">Finances</option><option value="marketing">Marketing</option><option value="vente">Vente</option><option value="mindset">Mindset</option><option value="gestion">Gestion</option><option value="autre">Autre</option></select><input id="nb-action-input" placeholder="Ex: Relire mon pitch de vente"/><button class="dl-btn" id="nb-add-action">Ajouter</button></div><div id="nb-actions" class="nb-list"></div></div>'+
      '<div class="nb-section" style="margin-top:16px;"><div class="nb-title">📊 Bilan automatique mensuel</div><div id="nb-kpis" class="nb-kpis"></div></div>';

    var tags=document.getElementById('nb-tags'); ['tous'].concat(THEMES).forEach(function(t){ var b=document.createElement('button'); b.className='nb-tag'+(nbFilter===t?' active':''); b.textContent=t==='tous'?'Tous les thèmes':LABEL[t]; b.onclick=function(){nbFilter=t; renderNotebook();}; tags.appendChild(b);});
    var srt=document.getElementById('nb-sort'); srt.value=nbSort; srt.onchange=function(){nbSort=srt.value; renderNotebook();};

    var d=document.getElementById('nb-declics');
    grouped(filtered).forEach(function(g){ var t=document.createElement('div'); t.className='notebook-theme-group-title'; t.textContent=g.l; d.appendChild(t);
      g.items.forEach(function(n){ var el=document.createElement('div'); el.className='nb-item'; el.innerHTML='<strong>'+esc(n.resourceTitle)+'</strong><div class="nb-chip">'+esc(n.themeLabel)+'</div><div style="font-size:12px;color:var(--text-light)">Modifié le '+fDate(n.updatedAt)+'</div><label class="notes-field-label">Ce que je retiens</label><textarea class="notes-field" id="nb-retain-'+n.resourceId+'">'+esc(n.retains||'')+'</textarea><label class="notes-field-label">Comment je vais l\'appliquer</label><textarea class="notes-field" id="nb-apply-'+n.resourceId+'">'+esc(n.apply||'')+'</textarea><button class="dl-btn" data-save-nb="'+n.resourceId+'">Enregistrer</button>'; d.appendChild(el);});
    });
    d.querySelectorAll('[data-save-nb]').forEach(function(b){ b.onclick=function(){saveNotebookNote(b.dataset.saveNb);}; });

    var id=document.getElementById('nb-ideas');
    grouped(filtered.filter(function(n){return (n.apply||'').trim();})).forEach(function(g){ var t=document.createElement('div'); t.className='notebook-theme-group-title'; t.textContent=g.l; id.appendChild(t);
      g.items.forEach(function(n){ var k=currentUserId+'::'+n.resourceId, st=ideas[k]||'a-tester'; var el=document.createElement('div'); el.className='nb-item'; el.innerHTML='<strong>'+esc(n.resourceTitle)+'</strong><div class="nb-chip">'+esc(n.themeLabel)+'</div><div>'+esc(n.apply||'')+'</div><select data-idea="'+n.resourceId+'"><option value="a-tester"'+(st==='a-tester'?' selected':'')+'>À tester</option><option value="en-cours"'+(st==='en-cours'?' selected':'')+'>En cours</option><option value="teste"'+(st==='teste'?' selected':'')+'>Testé</option></select>'; id.appendChild(el);});
    });
    id.querySelectorAll('[data-idea]').forEach(function(sel){ sel.onchange=function(){ var st=ideasStore(); st[currentUserId+'::'+sel.dataset.idea]=sel.value; setIdeasStore(st); }; });

    var al=document.getElementById('nb-actions');
    grouped(acts.map(function(a){a.theme=norm(a.theme||'autre'); return a;})).forEach(function(g){ var t=document.createElement('div'); t.className='notebook-theme-group-title'; t.textContent=g.l; al.appendChild(t);
      g.items.forEach(function(a){ var el=document.createElement('div'); el.className='nb-item'+(a.done?' done':''); el.innerHTML='<div style="display:flex;justify-content:space-between;gap:8px"><div class="notebook-action-text" data-tog="'+a.id+'" style="'+(a.done?'text-decoration:line-through;color:#8a8a8a':'')+'">'+esc(a.text)+'</div><button data-del="'+a.id+'" class="notebook-action-del">✕</button></div>'; al.appendChild(el);});
    });
    al.querySelectorAll('[data-tog]').forEach(function(e){ e.onclick=function(){ var arr=actionsStore().map(function(a){if(a.id===e.dataset.tog){a.done=!a.done;a.updatedAt=new Date().toISOString();}return a;}); setActionsStore(arr); renderNotebook();};});
    al.querySelectorAll('[data-del]').forEach(function(e){ e.onclick=function(){ var arr=actionsStore().filter(function(a){return a.id!==e.dataset.del}); setActionsStore(arr); renderNotebook();};});

    document.getElementById('nb-add-action').onclick=function(){ var inp=document.getElementById('nb-action-input'); var th=document.getElementById('nb-action-theme'); if(!inp.value.trim()) return; var arr=actionsStore(); arr.unshift({id:'a_'+Date.now(),text:inp.value.trim(),theme:th.value,done:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}); setActionsStore(arr); renderNotebook(); };

    var now=new Date(); var mNotes=notes.filter(function(n){var d=new Date(n.updatedAt);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
    var mActs=actionsStore().filter(function(a){var d=new Date(a.updatedAt||a.createdAt);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
    var tc={}; mNotes.forEach(function(n){tc[n.theme]=(tc[n.theme]||0)+1;}); var dom='—'; Object.keys(tc).sort(function(a,b){return tc[b]-tc[a]}).slice(0,1).forEach(function(k){dom=LABEL[k]||k;});
    var kpis=[['Contenus consultés',Object.keys(mNotes.reduce(function(o,n){o[n.resourceId]=1;return o;},{})).length],['Notes créées',mNotes.length],['Idées',mNotes.filter(function(n){return (n.apply||'').trim();}).length],['Actions réalisées',mActs.filter(function(a){return a.done;}).length],['Actions non réalisées',mActs.filter(function(a){return !a.done;}).length],['Actions non terminées',actionsStore().filter(function(a){return !a.done;}).length],['Thème dominant',dom]];
    var kb=document.getElementById('nb-kpis'); kb.innerHTML=kpis.map(function(i){return '<div class="nb-kpi"><div class="k">'+esc(i[0])+'</div><div class="v">'+esc(i[1])+'</div></div>';}).join('');
  }


  window.renderNotebookPage = renderNotebook;
  window.preloadResourceNotes = preloadResourceNotes;
  function init(){ ensureCss(); addCourseNoteCards(); preloadResourceNotes(); renderNotebook(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
