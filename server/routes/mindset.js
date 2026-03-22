/**
 * Focus Mindset — Routes API
 * Méditations, articles privés, ateliers, favoris, stats
 */

const express = require('express');
const router  = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin, requireTier } = require('../middleware/auth');

// ── Helpers ───────────────────────────────────────────────────────────────────

function tierAllowed(item, userTier) {
  if (!item.tier_required) return true;                   // null = stratege+
  if (item.tier_required === 'visionnaire' && userTier === 'visionnaire') return true;
  return false;
}

function sanitize(str) {
  return (str || '').toString().slice(0, 2000);
}

// ══════════════════════════════════════════════════════════════════════════════
//  ROUTES MEMBRES (stratege+)
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/mindset/meditations
router.get('/meditations', requireAuth, requireTier('stratege'), (req, res) => {
  const meditations = db.prepare(`
    SELECT * FROM mindset_meditations WHERE status = 'publie' ORDER BY sort_order ASC, created_at ASC
  `).all();

  const favorites = db.prepare(
    `SELECT item_id FROM mindset_favorites WHERE user_id = ? AND item_type = 'meditation'`
  ).all(req.user.id).map(f => f.item_id);

  const viewCounts = db.prepare(`
    SELECT item_id, COUNT(*) as plays FROM mindset_views
    WHERE item_type = 'meditation' GROUP BY item_id
  `).all().reduce((acc, r) => { acc[r.item_id] = r.plays; return acc; }, {});

  const result = meditations.map(m => ({
    ...m,
    is_locked: !tierAllowed(m, req.user.tier),
    is_favorite: favorites.includes(m.id),
    play_count: viewCounts[m.id] || 0
  }));

  res.json(result);
});

// GET /api/mindset/meditations/:id
router.get('/meditations/:id', requireAuth, requireTier('stratege'), (req, res) => {
  const m = db.prepare(`SELECT * FROM mindset_meditations WHERE id = ? AND status = 'publie'`).get(req.params.id);
  if (!m) return res.status(404).json({ error: 'Méditation introuvable' });

  if (!tierAllowed(m, req.user.tier)) {
    return res.status(403).json({ error: 'Contenu réservé aux Visionnaires' });
  }

  const is_favorite = !!db.prepare(
    `SELECT 1 FROM mindset_favorites WHERE user_id = ? AND item_type = 'meditation' AND item_id = ?`
  ).get(req.user.id, m.id);

  res.json({ ...m, is_favorite });
});

// POST /api/mindset/meditations/:id/play  — tracking écoute
router.post('/meditations/:id/play', requireAuth, requireTier('stratege'), (req, res) => {
  const m = db.prepare(`SELECT * FROM mindset_meditations WHERE id = ? AND status = 'publie'`).get(req.params.id);
  if (!m) return res.status(404).json({ error: 'Introuvable' });
  if (!tierAllowed(m, req.user.tier)) return res.status(403).json({ error: 'Accès refusé' });

  const { duration_sec = 0, completed = false } = req.body;
  db.prepare(`
    INSERT INTO mindset_views (id, user_id, item_type, item_id, duration_sec, completed)
    VALUES (?, ?, 'meditation', ?, ?, ?)
  `).run(uuidv4(), req.user.id, req.params.id, duration_sec, completed ? 1 : 0);

  // Points si complétée
  if (completed) {
    db.prepare(`UPDATE users SET points = points + 5 WHERE id = ?`).run(req.user.id);
  }

  res.json({ ok: true });
});

// GET /api/mindset/articles
router.get('/articles', requireAuth, requireTier('stratege'), (req, res) => {
  const articles = db.prepare(`
    SELECT id, title, slug, excerpt, cover_emoji, category, read_time_min, author,
           tier_required, status, published_at, created_at
    FROM mindset_articles WHERE status = 'publie' ORDER BY published_at DESC, created_at DESC
  `).all();

  const favorites = db.prepare(
    `SELECT item_id FROM mindset_favorites WHERE user_id = ? AND item_type = 'article'`
  ).all(req.user.id).map(f => f.item_id);

  const views = db.prepare(`
    SELECT item_id, COUNT(*) as reads FROM mindset_views
    WHERE item_type = 'article' GROUP BY item_id
  `).all().reduce((acc, r) => { acc[r.item_id] = r.reads; return acc; }, {});

  res.json(articles.map(a => ({
    ...a,
    is_locked: !tierAllowed(a, req.user.tier),
    is_favorite: favorites.includes(a.id),
    read_count: views[a.id] || 0
  })));
});

// GET /api/mindset/articles/:id
router.get('/articles/:id', requireAuth, requireTier('stratege'), (req, res) => {
  const article = db.prepare(`SELECT * FROM mindset_articles WHERE id = ? AND status = 'publie'`).get(req.params.id)
    || db.prepare(`SELECT * FROM mindset_articles WHERE slug = ? AND status = 'publie'`).get(req.params.id);

  if (!article) return res.status(404).json({ error: 'Article introuvable' });
  if (!tierAllowed(article, req.user.tier)) return res.status(403).json({ error: 'Contenu réservé aux Visionnaires' });

  // Tracking lecture
  db.prepare(`
    INSERT INTO mindset_views (id, user_id, item_type, item_id, duration_sec, completed)
    VALUES (?, ?, 'article', ?, 0, 1)
  `).run(uuidv4(), req.user.id, article.id);

  const is_favorite = !!db.prepare(
    `SELECT 1 FROM mindset_favorites WHERE user_id = ? AND item_type = 'article' AND item_id = ?`
  ).get(req.user.id, article.id);

  res.json({ ...article, is_favorite });
});

// GET /api/mindset/workshops
router.get('/workshops', requireAuth, requireTier('stratege'), (req, res) => {
  const workshops = db.prepare(`
    SELECT w.*,
      (SELECT COUNT(*) FROM mindset_registrations r WHERE r.workshop_id = w.id) as attendee_count,
      (SELECT 1 FROM mindset_registrations r WHERE r.workshop_id = w.id AND r.user_id = ?) as is_registered
    FROM mindset_workshops w
    WHERE w.status != 'annule'
    ORDER BY w.date ASC, w.time_start ASC
  `).all(req.user.id);

  const favorites = db.prepare(
    `SELECT item_id FROM mindset_favorites WHERE user_id = ? AND item_type = 'workshop'`
  ).all(req.user.id).map(f => f.item_id);

  res.json(workshops.map(w => ({
    ...w,
    is_locked: !tierAllowed(w, req.user.tier),
    is_registered: !!w.is_registered,
    is_favorite: favorites.includes(w.id)
  })));
});

// POST /api/mindset/workshops/:id/register  — inscription / désinscription
router.post('/workshops/:id/register', requireAuth, requireTier('stratege'), (req, res) => {
  const w = db.prepare(`SELECT * FROM mindset_workshops WHERE id = ?`).get(req.params.id);
  if (!w) return res.status(404).json({ error: 'Atelier introuvable' });
  if (!tierAllowed(w, req.user.tier)) return res.status(403).json({ error: 'Contenu réservé aux Visionnaires' });
  if (w.status === 'annule') return res.status(400).json({ error: 'Atelier annulé' });

  const existing = db.prepare(
    `SELECT id FROM mindset_registrations WHERE user_id = ? AND workshop_id = ?`
  ).get(req.user.id, req.params.id);

  if (existing) {
    db.prepare(`DELETE FROM mindset_registrations WHERE user_id = ? AND workshop_id = ?`)
      .run(req.user.id, req.params.id);
    return res.json({ registered: false });
  }

  if (w.max_attendees > 0) {
    const count = db.prepare(`SELECT COUNT(*) as c FROM mindset_registrations WHERE workshop_id = ?`).get(req.params.id).c;
    if (count >= w.max_attendees) return res.status(400).json({ error: 'Atelier complet' });
  }

  db.prepare(`INSERT INTO mindset_registrations (id, user_id, workshop_id) VALUES (?, ?, ?)`)
    .run(uuidv4(), req.user.id, req.params.id);

  res.json({ registered: true });
});

// GET /api/mindset/favorites
router.get('/favorites', requireAuth, requireTier('stratege'), (req, res) => {
  const favMeditations = db.prepare(`
    SELECT m.*, 'meditation' as item_type FROM mindset_meditations m
    JOIN mindset_favorites f ON f.item_id = m.id AND f.item_type = 'meditation'
    WHERE f.user_id = ? AND m.status = 'publie'
    ORDER BY f.created_at DESC
  `).all(req.user.id);

  const favArticles = db.prepare(`
    SELECT a.id, a.title, a.slug, a.excerpt, a.cover_emoji, a.read_time_min, a.author,
           a.tier_required, 'article' as item_type FROM mindset_articles a
    JOIN mindset_favorites f ON f.item_id = a.id AND f.item_type = 'article'
    WHERE f.user_id = ? AND a.status = 'publie'
    ORDER BY f.created_at DESC
  `).all(req.user.id);

  const favWorkshops = db.prepare(`
    SELECT w.*, 'workshop' as item_type FROM mindset_workshops w
    JOIN mindset_favorites f ON f.item_id = w.id AND f.item_type = 'workshop'
    WHERE f.user_id = ? AND w.status != 'annule'
    ORDER BY f.created_at DESC
  `).all(req.user.id);

  res.json({
    meditations: favMeditations.map(m => ({ ...m, is_locked: !tierAllowed(m, req.user.tier) })),
    articles:    favArticles.map(a => ({ ...a, is_locked: !tierAllowed(a, req.user.tier) })),
    workshops:   favWorkshops.map(w => ({ ...w, is_locked: !tierAllowed(w, req.user.tier) }))
  });
});

// POST /api/mindset/favorites/:type/:id  — toggle favori
router.post('/favorites/:type/:id', requireAuth, requireTier('stratege'), (req, res) => {
  const { type, id } = req.params;
  if (!['meditation', 'article', 'workshop'].includes(type)) {
    return res.status(400).json({ error: 'Type invalide' });
  }

  const existing = db.prepare(
    `SELECT id FROM mindset_favorites WHERE user_id = ? AND item_type = ? AND item_id = ?`
  ).get(req.user.id, type, id);

  if (existing) {
    db.prepare(`DELETE FROM mindset_favorites WHERE user_id = ? AND item_type = ? AND item_id = ?`)
      .run(req.user.id, type, id);
    return res.json({ favorited: false });
  }

  db.prepare(`INSERT INTO mindset_favorites (id, user_id, item_type, item_id) VALUES (?, ?, ?, ?)`)
    .run(uuidv4(), req.user.id, type, id);

  res.json({ favorited: true });
});

// ══════════════════════════════════════════════════════════════════════════════
//  ROUTES ADMIN
// ══════════════════════════════════════════════════════════════════════════════

// ── Méditations ───────────────────────────────────────────────────────────────

router.get('/admin/meditations', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT m.*,
      (SELECT COUNT(*) FROM mindset_views v WHERE v.item_id = m.id AND v.item_type = 'meditation') as play_count,
      (SELECT COUNT(*) FROM mindset_favorites f WHERE f.item_id = m.id AND f.item_type = 'meditation') as fav_count
    FROM mindset_meditations m ORDER BY m.sort_order ASC, m.created_at DESC
  `).all();
  res.json(rows);
});

router.post('/admin/meditations', requireAuth, requireAdmin, (req, res) => {
  const { title, description, duration_min, category, audio_url, cover_emoji, tier_required, status, sort_order } = req.body;
  if (!title) return res.status(400).json({ error: 'Titre requis' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO mindset_meditations (id, title, description, duration_min, category, audio_url, cover_emoji, tier_required, status, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    sanitize(title),
    sanitize(description),
    duration_min || 0,
    category || 'meditation',
    sanitize(audio_url),
    sanitize(cover_emoji) || '🧘',
    tier_required || null,
    status || 'brouillon',
    sort_order || 0
  );

  res.status(201).json(db.prepare(`SELECT * FROM mindset_meditations WHERE id = ?`).get(id));
});

router.put('/admin/meditations/:id', requireAuth, requireAdmin, (req, res) => {
  const m = db.prepare(`SELECT id FROM mindset_meditations WHERE id = ?`).get(req.params.id);
  if (!m) return res.status(404).json({ error: 'Introuvable' });

  const { title, description, duration_min, category, audio_url, cover_emoji, tier_required, status, sort_order } = req.body;
  db.prepare(`
    UPDATE mindset_meditations SET
      title = ?, description = ?, duration_min = ?, category = ?, audio_url = ?,
      cover_emoji = ?, tier_required = ?, status = ?, sort_order = ?,
      updated_at = unixepoch()
    WHERE id = ?
  `).run(
    sanitize(title), sanitize(description), duration_min || 0, category || 'meditation',
    sanitize(audio_url), sanitize(cover_emoji) || '🧘',
    tier_required || null, status || 'brouillon', sort_order || 0,
    req.params.id
  );

  res.json(db.prepare(`SELECT * FROM mindset_meditations WHERE id = ?`).get(req.params.id));
});

router.delete('/admin/meditations/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare(`DELETE FROM mindset_meditations WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

// ── Articles ──────────────────────────────────────────────────────────────────

router.get('/admin/articles', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT a.*,
      (SELECT COUNT(*) FROM mindset_views v WHERE v.item_id = a.id AND v.item_type = 'article') as read_count,
      (SELECT COUNT(*) FROM mindset_favorites f WHERE f.item_id = a.id AND f.item_type = 'article') as fav_count
    FROM mindset_articles a ORDER BY a.created_at DESC
  `).all();
  res.json(rows);
});

router.post('/admin/articles', requireAuth, requireAdmin, (req, res) => {
  const { title, excerpt, content, cover_emoji, category, read_time_min, author, tier_required, status } = req.body;
  if (!title) return res.status(400).json({ error: 'Titre requis' });

  const id = uuidv4();
  const slug = sanitize(title).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 80) + '-' + Date.now().toString(36);

  db.prepare(`
    INSERT INTO mindset_articles
      (id, title, slug, excerpt, content, cover_emoji, category, read_time_min, author, tier_required, status, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, sanitize(title), slug, sanitize(excerpt), content || '',
    sanitize(cover_emoji) || '📖', category || 'mindset',
    read_time_min || 5, sanitize(author),
    tier_required || null, status || 'brouillon',
    status === 'publie' ? Math.floor(Date.now() / 1000) : null
  );

  res.status(201).json(db.prepare(`SELECT * FROM mindset_articles WHERE id = ?`).get(id));
});

router.put('/admin/articles/:id', requireAuth, requireAdmin, (req, res) => {
  const a = db.prepare(`SELECT id, status FROM mindset_articles WHERE id = ?`).get(req.params.id);
  if (!a) return res.status(404).json({ error: 'Introuvable' });

  const { title, excerpt, content, cover_emoji, category, read_time_min, author, tier_required, status } = req.body;

  const publishedAt = (status === 'publie' && a.status !== 'publie')
    ? Math.floor(Date.now() / 1000) : undefined;

  if (publishedAt !== undefined) {
    db.prepare(`
      UPDATE mindset_articles SET
        title = ?, excerpt = ?, content = ?, cover_emoji = ?, category = ?, read_time_min = ?,
        author = ?, tier_required = ?, status = ?, published_at = ?, updated_at = unixepoch()
      WHERE id = ?
    `).run(sanitize(title), sanitize(excerpt), content || '', sanitize(cover_emoji) || '📖',
      category || 'mindset', read_time_min || 5, sanitize(author),
      tier_required || null, status || 'brouillon', publishedAt, req.params.id);
  } else {
    db.prepare(`
      UPDATE mindset_articles SET
        title = ?, excerpt = ?, content = ?, cover_emoji = ?, category = ?, read_time_min = ?,
        author = ?, tier_required = ?, status = ?, updated_at = unixepoch()
      WHERE id = ?
    `).run(sanitize(title), sanitize(excerpt), content || '', sanitize(cover_emoji) || '📖',
      category || 'mindset', read_time_min || 5, sanitize(author),
      tier_required || null, status || 'brouillon', req.params.id);
  }

  res.json(db.prepare(`SELECT * FROM mindset_articles WHERE id = ?`).get(req.params.id));
});

router.delete('/admin/articles/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare(`DELETE FROM mindset_articles WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

// ── Ateliers ──────────────────────────────────────────────────────────────────

router.get('/admin/workshops', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT w.*,
      (SELECT COUNT(*) FROM mindset_registrations r WHERE r.workshop_id = w.id) as attendee_count
    FROM mindset_workshops w ORDER BY w.date DESC, w.time_start DESC
  `).all();
  res.json(rows);
});

router.post('/admin/workshops', requireAuth, requireAdmin, (req, res) => {
  const { title, description, facilitator, date, time_start, duration_min, format, replay_url, cover_emoji, max_attendees, tier_required, status } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Titre et date requis' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO mindset_workshops
      (id, title, description, facilitator, date, time_start, duration_min, format, replay_url, cover_emoji, max_attendees, tier_required, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, sanitize(title), sanitize(description), sanitize(facilitator),
    date, time_start || '', duration_min || 60, format || 'live',
    sanitize(replay_url), sanitize(cover_emoji) || '🎭',
    max_attendees || 0, tier_required || null, status || 'a-venir'
  );

  res.status(201).json(db.prepare(`SELECT * FROM mindset_workshops WHERE id = ?`).get(id));
});

router.put('/admin/workshops/:id', requireAuth, requireAdmin, (req, res) => {
  const w = db.prepare(`SELECT id FROM mindset_workshops WHERE id = ?`).get(req.params.id);
  if (!w) return res.status(404).json({ error: 'Introuvable' });

  const { title, description, facilitator, date, time_start, duration_min, format, replay_url, cover_emoji, max_attendees, tier_required, status } = req.body;
  db.prepare(`
    UPDATE mindset_workshops SET
      title = ?, description = ?, facilitator = ?, date = ?, time_start = ?,
      duration_min = ?, format = ?, replay_url = ?, cover_emoji = ?,
      max_attendees = ?, tier_required = ?, status = ?, updated_at = unixepoch()
    WHERE id = ?
  `).run(
    sanitize(title), sanitize(description), sanitize(facilitator),
    date, time_start || '', duration_min || 60, format || 'live',
    sanitize(replay_url), sanitize(cover_emoji) || '🎭',
    max_attendees || 0, tier_required || null, status || 'a-venir',
    req.params.id
  );

  res.json(db.prepare(`SELECT * FROM mindset_workshops WHERE id = ?`).get(req.params.id));
});

router.delete('/admin/workshops/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare(`DELETE FROM mindset_workshops WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

// ── Statistiques ──────────────────────────────────────────────────────────────

router.get('/admin/stats', requireAuth, requireAdmin, (req, res) => {
  const totalMeditations = db.prepare(`SELECT COUNT(*) as c FROM mindset_meditations WHERE status = 'publie'`).get().c;
  const totalArticles    = db.prepare(`SELECT COUNT(*) as c FROM mindset_articles WHERE status = 'publie'`).get().c;
  const totalWorkshops   = db.prepare(`SELECT COUNT(*) as c FROM mindset_workshops WHERE status != 'annule'`).get().c;

  const totalPlays   = db.prepare(`SELECT COUNT(*) as c FROM mindset_views WHERE item_type = 'meditation'`).get().c;
  const totalReads   = db.prepare(`SELECT COUNT(*) as c FROM mindset_views WHERE item_type = 'article'`).get().c;
  const totalRegist  = db.prepare(`SELECT COUNT(*) as c FROM mindset_registrations`).get().c;
  const totalFavs    = db.prepare(`SELECT COUNT(*) as c FROM mindset_favorites`).get().c;
  const uniqueUsers  = db.prepare(`SELECT COUNT(DISTINCT user_id) as c FROM mindset_views`).get().c;

  // Top méditations
  const topMeditations = db.prepare(`
    SELECT m.id, m.title, m.cover_emoji, m.duration_min,
      COUNT(v.id) as play_count,
      SUM(CASE WHEN v.completed = 1 THEN 1 ELSE 0 END) as completed_count
    FROM mindset_meditations m
    LEFT JOIN mindset_views v ON v.item_id = m.id AND v.item_type = 'meditation'
    WHERE m.status = 'publie'
    GROUP BY m.id ORDER BY play_count DESC LIMIT 5
  `).all();

  // Top articles
  const topArticles = db.prepare(`
    SELECT a.id, a.title, a.cover_emoji, a.read_time_min,
      COUNT(v.id) as read_count
    FROM mindset_articles a
    LEFT JOIN mindset_views v ON v.item_id = a.id AND v.item_type = 'article'
    WHERE a.status = 'publie'
    GROUP BY a.id ORDER BY read_count DESC LIMIT 5
  `).all();

  // Top ateliers
  const topWorkshops = db.prepare(`
    SELECT w.id, w.title, w.cover_emoji, w.date,
      COUNT(r.id) as attendee_count
    FROM mindset_workshops w
    LEFT JOIN mindset_registrations r ON r.workshop_id = w.id
    GROUP BY w.id ORDER BY attendee_count DESC LIMIT 5
  `).all();

  // Activité par semaine (8 dernières semaines)
  const weeklyActivity = db.prepare(`
    SELECT
      strftime('%Y-%W', datetime(created_at, 'unixepoch')) as week,
      COUNT(*) as count
    FROM mindset_views
    WHERE created_at > unixepoch() - 60*24*60*60
    GROUP BY week ORDER BY week ASC
  `).all();

  // Membres les plus actifs
  const activeMembers = db.prepare(`
    SELECT u.id, u.first_name, u.last_name, u.tier,
      COUNT(v.id) as activity_count
    FROM users u
    JOIN mindset_views v ON v.user_id = u.id
    GROUP BY u.id ORDER BY activity_count DESC LIMIT 8
  `).all();

  res.json({
    overview: { totalMeditations, totalArticles, totalWorkshops, totalPlays, totalReads, totalRegist, totalFavs, uniqueUsers },
    topMeditations,
    topArticles,
    topWorkshops,
    weeklyActivity,
    activeMembers
  });
});

module.exports = router;
