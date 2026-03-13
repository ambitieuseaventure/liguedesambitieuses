/* ══════════════════════════════════════════════════════════════
   ONBOARDING TOUR — La Ligue des Ambitieuses
   - Tour guidé adapté par niveau (Initiée / Stratège / Visionnaire)
   - Checklist d'onboarding persistante sur le dashboard
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Inject CSS ── */
  if (!document.querySelector('link[data-onboarding-tour-css]')) {
    var cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'assets/onboarding-tour.css';
    cssLink.setAttribute('data-onboarding-tour-css', '1');
    document.head.appendChild(cssLink);
  }

  var USER_ID = 'user-sophie-a';

  /* ══════════════════════════════════════
     TOUR DATA — steps per tier
     ══════════════════════════════════════ */
  function buildTourSteps(tier) {
    /* ── Welcome (all tiers) ── */
    var tierMeta = {
      initiee:    { emoji: '🌿', name: "L'Initiée",    color: '#4ade80' },
      stratege:   { emoji: '⚡', name: 'La Stratège',   color: '#facc15' },
      visionnaire:{ emoji: '🔮', name: 'La Visionnaire', color: '#c084fc' }
    };
    var tm = tierMeta[tier] || tierMeta.initiee;

    var steps = [
      /* 0 — Welcome */
      {
        target: null,
        position: 'center',
        emoji: tm.emoji,
        title: 'Bienvenue dans la Ligue !',
        desc:  'Ravie de t\'accueillir parmi nous, ambitieuse ! ' +
               'Ce tour rapide va te guider à travers ta plateforme ' + tm.name + '. ' +
               'Tu peux le passer à tout moment et le relancer depuis ton tableau de bord.'
      },
      /* 1 — Dashboard */
      {
        target: '[data-page="dashboard"]',
        position: 'right',
        emoji: '🏡',
        title: 'Ton tableau de bord',
        desc:  'C\'est ta page d\'accueil. Retrouve ici tes formations en cours, ' +
               'ton focus du jour, tes dernières activités et tes statistiques de membre.'
      },
      /* 2 — Communauté */
      {
        target: '[data-page="community"]',
        position: 'right',
        emoji: '🌸',
        title: 'La Communauté',
        desc:  'Un espace bienveillant pour partager tes victoires, poser tes questions ' +
               'et t\'inspirer des autres ambitieuses. Dis bonjour dès aujourd\'hui !'
      },
      /* 3 — Formations */
      {
        target: '[data-page="classroom"]',
        position: 'right',
        emoji: '📚',
        title: 'Tes Formations',
        desc:  'Des formations complètes découpées en modules vidéo pour développer ' +
               'ton business à ton rythme. Lance-toi dans ta première dès maintenant !'
      },
      /* 4 — Ressources */
      {
        target: '[data-page="resources"]',
        position: 'right',
        emoji: '📁',
        title: 'Les Ressources',
        desc:  'Templates, guides, outils prêts à l\'emploi… Télécharges-les et ' +
               'applique-les directement dans ton activité.'
      }
    ];

    /* ── Stratège & Visionnaire extras ── */
    if (tier === 'stratege' || tier === 'visionnaire') {
      steps.push({
        target: '[data-page="bilan"]',
        position: 'right',
        emoji: '📊',
        title: 'Bilans & Audits',
        desc:  'Chaque mois, fais le point sur ton activité. Identifie tes points forts, ' +
               'tes blocages et tes priorités pour le mois à venir.'
      });
      steps.push({
        target: '[data-page="masterclass"]',
        position: 'right',
        emoji: '🎬',
        title: 'Les Masterclass',
        desc:  'Des sessions d\'expert en direct ou en replay : finance, vente, mindset, ' +
               'marketing… Pour aller encore plus loin dans ta montée en compétences.'
      });
      steps.push({
        target: '[data-page="buddy"]',
        position: 'right',
        emoji: '🤝',
        title: 'Accountability Buddy',
        desc:  'Trouve ta partenaire de responsabilité. Un duo d\'ambitieuses qui ' +
               's\'engagent mutuellement à avancer — un levier puissant contre la procrastination.'
      });
      steps.push({
        target: '[data-page="mindset"]',
        position: 'right',
        emoji: '🧘',
        title: 'Focus Mindset',
        desc:  'Journal de travail en profondeur, exercices de mindset et coaching personnel. ' +
               'Prends soin de toi autant que de ton business.'
      });
    }

    /* ── Visionnaire extras ── */
    if (tier === 'visionnaire') {
      steps.push({
        target: '[data-page="coaching"]',
        position: 'right',
        emoji: '📞',
        title: 'Coaching 1-1',
        desc:  'Ton heure de coaching personnalisé chaque mois. Travaille en direct ' +
               'avec une coach sur tes défis du moment pour débloquer des situations complexes.'
      });
      steps.push({
        target: '[data-page="hotline"]',
        position: 'right',
        emoji: '⚡',
        title: 'Hotline Business',
        desc:  'Une question urgente ? Accède à des réponses d\'expert en 24h max, 7j/7. ' +
               'Ton filet de sécurité business, toujours disponible.'
      });
      steps.push({
        target: '[data-page="plan"]',
        position: 'right',
        emoji: '🎯',
        title: 'Plan d\'action trimestriel',
        desc:  'Structure ta vision à 90 jours : objectifs, jalons, indicateurs… ' +
               'Avance avec clarté et intention, trimestre après trimestre.'
      });
    }

    /* ── Annuaire (all tiers) ── */
    steps.push({
      target: '[data-page="annuaire"]',
      position: 'right',
      emoji: '🗺️',
      title: 'L\'Annuaire',
      desc:  'Connecte-toi avec les autres membres ! Complète ton profil pour être visible ' +
             'dans l\'annuaire et commencer à développer ton réseau d\'ambitieuses.'
    });

    /* ── Last step — checklist CTA ── */
    steps.push({
      target: null,
      position: 'center',
      emoji: '✨',
      title: 'Tu es prête à démarrer !',
      desc:  'Retrouve ci-dessous 3 actions concrètes pour finaliser ton onboarding. ' +
             'Ton checklist t\'attend sur le tableau de bord — bonne aventure ambitieuse !',
      isLast: true
    });

    return steps;
  }

  /* ══════════════════════════════════════
     CHECKLIST DATA — tasks per tier
     ══════════════════════════════════════ */
  function buildChecklistTasks(tier) {
    var common = {
      id: 'profil',
      emoji: '🗺️',
      label: 'Complète ton profil dans l\'annuaire',
      page: 'annuaire'
    };
    if (tier === 'visionnaire') {
      return [
        common,
        { id: 'coaching', emoji: '📞', label: 'Planifie ta première session de coaching', page: 'coaching' },
        { id: 'plan',     emoji: '🎯', label: 'Crée ton plan d\'action trimestriel',       page: 'plan' }
      ];
    }
    if (tier === 'stratege') {
      return [
        common,
        { id: 'formation', emoji: '📚', label: 'Commence ta première formation',  page: 'classroom' },
        { id: 'bilan',     emoji: '📊', label: 'Fais ton premier bilan mensuel',  page: 'bilan' }
      ];
    }
    /* initiee */
    return [
      common,
      { id: 'formation', emoji: '📚', label: 'Commence ta première formation',             page: 'classroom' },
      { id: 'post',      emoji: '🌸', label: 'Fais ta première publication en communauté', page: 'community' }
    ];
  }

  /* ══════════════════════════════════════
     LOCALSTORAGE HELPERS
     ══════════════════════════════════════ */
  var KEYS = {
    tourDone:      'onboarding_tour_completed_' + USER_ID,
    tasks:         'onboarding_tasks_' + USER_ID,
    dismissed:     'onboarding_checklist_dismissed_' + USER_ID
  };

  function isTourCompleted()  { return !!localStorage.getItem(KEYS.tourDone); }
  function markTourCompleted(){ localStorage.setItem(KEYS.tourDone, '1'); }
  function isChecklistDismissed() { return localStorage.getItem(KEYS.dismissed) === '1'; }

  function getCompletedTasks() {
    try { return JSON.parse(localStorage.getItem(KEYS.tasks) || '[]'); }
    catch (e) { return []; }
  }
  function markTaskDone(id) {
    var done = getCompletedTasks();
    if (done.indexOf(id) === -1) {
      done.push(id);
      localStorage.setItem(KEYS.tasks, JSON.stringify(done));
    }
  }

  function currentTier() {
    return (typeof getCurrentSubscription === 'function')
      ? getCurrentSubscription()
      : 'visionnaire';
  }

  /* ══════════════════════════════════════
     DOM HELPERS
     ══════════════════════════════════════ */
  function createTourDOM() {
    if (document.getElementById('tour-root')) return;

    var root = document.createElement('div');
    root.id = 'tour-root';
    root.innerHTML =
      '<div id="tour-backdrop"></div>' +
      '<div id="tour-spotlight"></div>' +
      '<div id="tour-tooltip">' +
        '<button id="tour-close-btn" title="Passer le tour" onclick="window._tourSkip()">✕</button>' +
        '<div id="tour-step-counter"></div>' +
        '<div class="tour-progress-track"><div id="tour-progress-fill"></div></div>' +
        '<span id="tour-emoji"></span>' +
        '<div id="tour-title"></div>' +
        '<p id="tour-desc"></p>' +
        '<div class="tour-actions-row">' +
          '<button id="tour-btn-skip" onclick="window._tourSkip()">Passer le tour</button>' +
          '<div class="tour-nav-btns">' +
            '<button id="tour-btn-prev" onclick="window._tourPrev()" style="display:none">← Retour</button>' +
            '<button id="tour-btn-next" onclick="window._tourNext()">Suivant →</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(root);
  }

  /* ── Position spotlight + tooltip for a nav target ── */
  function positionOnTarget(targetEl) {
    var root     = document.getElementById('tour-root');
    var spot     = document.getElementById('tour-spotlight');
    var tooltip  = document.getElementById('tour-tooltip');
    if (!root || !spot || !tooltip) return;

    var pad  = 7;
    var rect = targetEl.getBoundingClientRect();

    /* spotlight */
    spot.style.top    = (rect.top    - pad) + 'px';
    spot.style.left   = (rect.left   - pad) + 'px';
    spot.style.width  = (rect.width  + pad * 2) + 'px';
    spot.style.height = (rect.height + pad * 2) + 'px';

    root.classList.add('tour-spotlight-visible');
    root.classList.remove('tour-centered');

    /* tooltip — try right of spotlight first */
    var tW  = 340;
    var tH  = tooltip.offsetHeight || 260;
    var spaceRight = window.innerWidth - (rect.right + pad + 20);
    var leftPos, topPos;

    if (spaceRight >= tW + 16) {
      leftPos = rect.right + pad + 20;
      tooltip.classList.add('arrow-left');
    } else {
      leftPos = rect.left - pad - tW - 20;
      tooltip.classList.remove('arrow-left');
    }

    topPos = rect.top - pad;
    /* keep inside viewport vertically */
    if (topPos + tH > window.innerHeight - 12) topPos = window.innerHeight - tH - 12;
    if (topPos < 12) topPos = 12;

    tooltip.style.top       = topPos + 'px';
    tooltip.style.left      = leftPos + 'px';
    tooltip.style.transform = 'none';
  }

  /* ── Center tooltip (no target) ── */
  function positionCentered() {
    var root    = document.getElementById('tour-root');
    var tooltip = document.getElementById('tour-tooltip');
    if (!root || !tooltip) return;

    root.classList.add('tour-centered');
    root.classList.remove('tour-spotlight-visible');

    tooltip.classList.remove('arrow-left');
    tooltip.style.top       = '50%';
    tooltip.style.left      = '50%';
    tooltip.style.transform = 'translate(-50%, -50%)';
  }

  /* ══════════════════════════════════════
     TOUR ENGINE
     ══════════════════════════════════════ */
  var _steps   = [];
  var _step    = 0;
  var _running = false;

  function renderStep(idx) {
    var step    = _steps[idx];
    if (!step) return;
    var total   = _steps.length;

    document.getElementById('tour-step-counter').textContent =
      'Étape ' + (idx + 1) + ' / ' + total;
    document.getElementById('tour-progress-fill').style.width =
      Math.round(((idx + 1) / total) * 100) + '%';
    document.getElementById('tour-emoji').textContent = step.emoji || '';
    document.getElementById('tour-title').textContent = step.title;
    document.getElementById('tour-desc').textContent  = step.desc;

    var prevBtn = document.getElementById('tour-btn-prev');
    var nextBtn = document.getElementById('tour-btn-next');
    prevBtn.style.display = idx > 0 ? 'inline-block' : 'none';
    nextBtn.textContent   = idx === total - 1 ? 'Commencer ! 🚀' : 'Suivant →';

    if (step.target) {
      var el = document.querySelector(step.target);
      if (el) {
        positionOnTarget(el);
        return;
      }
    }
    positionCentered();
  }

  function startTour() {
    _steps   = buildTourSteps(currentTier());
    _step    = 0;
    _running = true;

    createTourDOM();
    var root = document.getElementById('tour-root');
    root.classList.add('tour-active');
    root.style.display = 'block';
    document.body.style.overflow = 'hidden';

    renderStep(0);
  }

  function endTour() {
    _running = false;
    var root = document.getElementById('tour-root');
    if (root) {
      root.classList.remove('tour-active', 'tour-centered', 'tour-spotlight-visible');
      root.style.display = 'none';
    }
    document.body.style.overflow = '';
    markTourCompleted();
    renderChecklist();
  }

  window._tourNext = function () {
    if (!_running) return;
    if (_step >= _steps.length - 1) { endTour(); return; }
    _step++;
    renderStep(_step);
  };

  window._tourPrev = function () {
    if (!_running || _step <= 0) return;
    _step--;
    renderStep(_step);
  };

  window._tourSkip = function () {
    if (!_running) return;
    endTour();
  };

  /* Public API — can be called from checklist "Relancer" button */
  window.startOnboardingTour = function () {
    /* rebuild steps in case tier changed */
    if (_running) endTour();
    startTour();
  };

  /* ══════════════════════════════════════
     CHECKLIST WIDGET
     ══════════════════════════════════════ */
  function renderChecklist() {
    var dashboard = document.getElementById('page-dashboard');
    if (!dashboard) return;

    /* Remove existing widget */
    var existing = document.getElementById('onboarding-checklist-widget');
    if (existing) existing.remove();

    if (isChecklistDismissed()) return;

    var tier   = currentTier();
    var tasks  = buildChecklistTasks(tier);
    var done   = getCompletedTasks();
    var doneN  = tasks.filter(function (t) { return done.indexOf(t.id) !== -1; }).length;
    var allDone= doneN === tasks.length;
    var pct    = Math.round((doneN / tasks.length) * 100);

    var tierLabels = { initiee: '🌿 Initiée', stratege: '⚡ Stratège', visionnaire: '🔮 Visionnaire' };
    var tierLabel  = tierLabels[tier] || '';

    var tasksHtml = tasks.map(function (t) {
      var isDone = done.indexOf(t.id) !== -1;
      return (
        '<div class="ob-task' + (isDone ? ' done' : '') + '"' +
          (!isDone ? ' onclick="window._obTaskClick(\'' + t.id + '\',\'' + t.page + '\')"' : '') + '>' +
          '<div class="ob-task-check">' + (isDone ? '✓' : '') + '</div>' +
          '<span class="ob-task-label">' + t.emoji + ' ' + t.label + '</span>' +
          '<span class="ob-task-arrow">' + (isDone ? '' : '→') + '</span>' +
        '</div>'
      );
    }).join('');

    var widget = document.createElement('div');
    widget.id  = 'onboarding-checklist-widget';
    widget.innerHTML =
      '<div class="ob-card' + (allDone ? ' all-done' : '') + '">' +
        '<div class="ob-header">' +
          '<div class="ob-title">✦ Tes premières étapes</div>' +
          '<span class="ob-progress-label">' + doneN + '/' + tasks.length + ' complétées</span>' +
        '</div>' +
        '<div class="ob-sub">3 actions pour bien démarrer ton aventure ' + tierLabel + '</div>' +
        '<div class="ob-progress-track"><div class="ob-progress-fill" style="width:' + pct + '%"></div></div>' +
        tasksHtml +
        '<div class="ob-footer">' +
          '<button class="ob-replay-btn" onclick="window.startOnboardingTour()">🔄 Relancer le tour guidé</button>' +
          '<button class="ob-dismiss-btn" onclick="window._obDismiss()">Masquer</button>' +
        '</div>' +
      '</div>';

    /* Insert right after the welcome banner */
    var banner      = dashboard.querySelector('.welcome-banner');
    var pageContent = dashboard.querySelector('.page-content');
    if (banner && banner.parentNode) {
      banner.parentNode.insertBefore(widget, banner.nextSibling);
    } else if (pageContent) {
      pageContent.insertBefore(widget, pageContent.firstChild);
    }
  }

  /* Task click: mark done + navigate */
  window._obTaskClick = function (id, page) {
    markTaskDone(id);
    renderChecklist();
    if (typeof showPage === 'function') showPage(page);
  };

  /* Dismiss checklist */
  window._obDismiss = function () {
    localStorage.setItem(KEYS.dismissed, '1');
    var w = document.getElementById('onboarding-checklist-widget');
    if (w) w.remove();
  };

  /* ══════════════════════════════════════
     HOOKS — showPage & switchSubscription
     ══════════════════════════════════════ */
  function hookShowPage() {
    var _orig = window.showPage;
    window.showPage = function (page) {
      _orig(page);
      if (page === 'dashboard') {
        setTimeout(renderChecklist, 60);
      }
    };
  }

  function hookSwitchSubscription() {
    var _orig = window.switchSubscriptionDemo;
    if (typeof _orig !== 'function') return;
    window.switchSubscriptionDemo = function (level) {
      _orig(level);
      /* Reset checklist tasks & dismissed flag so new tier tasks appear */
      localStorage.removeItem(KEYS.tasks);
      localStorage.removeItem(KEYS.dismissed);
      renderChecklist();
    };
  }

  /* ══════════════════════════════════════
     INIT
     ══════════════════════════════════════ */
  function init() {
    hookShowPage();
    hookSwitchSubscription();

    /* Always render checklist on dashboard load */
    renderChecklist();

    /* Auto-start tour for first-time visitors */
    if (!isTourCompleted()) {
      setTimeout(startTour, 900);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
