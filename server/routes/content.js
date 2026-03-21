/**
 * Routes contenu — Formations, Masterclasses, Ressources, Bibliothèque
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin, requireTier } = require('../middleware/auth');

// Upload de fichiers
const fileStorage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads', 'files'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const uploadFile = multer({ storage: fileStorage, limits: { fileSize: 50 * 1024 * 1024 } });

// ════════════════════════════════════════════
// FORMATIONS
// ════════════════════════════════════════════

router.get('/formations', requireAuth, (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM formations';
  const params = [];

  // Membres voient uniquement les formations publiées
  if (req.user.role !== 'admin') {
    query += ' WHERE status = ?';
    params.push('publie');
  } else if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';
  const formations = db.prepare(query).all(...params);

  res.json(formations.map(f => ({
    id: f.id,
    title: f.title,
    theme: f.theme,
    level: f.level,
    description: f.description,
    coverEmoji: f.cover_emoji,
    coverImage: f.cover_image,
    status: f.status,
    freeForInitiee: !!f.free_for_initiee,
    unitPrice: f.unit_price,
    modules: JSON.parse(f.modules || '[]'),
    createdAt: f.created_at
  })));
});

router.get('/formations/:id', requireAuth, (req, res) => {
  const f = db.prepare('SELECT * FROM formations WHERE id = ?').get(req.params.id);
  if (!f) return res.status(404).json({ error: 'Formation introuvable' });
  if (f.status !== 'publie' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Formation non disponible' });
  }

  const progress = db.prepare('SELECT * FROM formation_progress WHERE user_id = ? AND formation_id = ?')
    .get(req.user.id, f.id);
  const review = db.prepare('SELECT * FROM formation_reviews WHERE user_id = ? AND formation_id = ?')
    .get(req.user.id, f.id);
  const avgRating = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as cnt FROM formation_reviews WHERE formation_id = ?').get(f.id);

  res.json({
    id: f.id,
    title: f.title,
    theme: f.theme,
    level: f.level,
    description: f.description,
    coverEmoji: f.cover_emoji,
    coverImage: f.cover_image,
    status: f.status,
    freeForInitiee: !!f.free_for_initiee,
    unitPrice: f.unit_price,
    modules: JSON.parse(f.modules || '[]'),
    createdAt: f.created_at,
    myProgress: progress ? JSON.parse(progress.data || '{}') : null,
    myProgressPct: progress?.progress || 0,
    myReview: review || null,
    avgRating: avgRating.avg ? Math.round(avgRating.avg * 10) / 10 : null,
    reviewCount: avgRating.cnt
  });
});

// Mettre à jour la progression
router.post('/formations/:id/progress', requireAuth, (req, res) => {
  const { progress, data } = req.body;
  const existing = db.prepare('SELECT id FROM formation_progress WHERE user_id = ? AND formation_id = ?')
    .get(req.user.id, req.params.id);

  if (existing) {
    db.prepare(`
      UPDATE formation_progress SET progress = ?, data = ?, completed = ?, updated_at = unixepoch()
      WHERE user_id = ? AND formation_id = ?
    `).run(progress || 0, JSON.stringify(data || {}), progress >= 100 ? 1 : 0, req.user.id, req.params.id);
  } else {
    db.prepare(`
      INSERT INTO formation_progress (id, user_id, formation_id, progress, data, completed)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, req.params.id, progress || 0, JSON.stringify(data || {}), progress >= 100 ? 1 : 0);
  }

  // Points pour complétion
  if (progress >= 100) {
    db.prepare('UPDATE users SET points = points + 50 WHERE id = ?').run(req.user.id);
  }

  res.json({ message: 'Progression sauvegardée' });
});

// Soumettre un avis
router.post('/formations/:id/review', requireAuth, (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Note invalide (1-5)' });

  const existing = db.prepare('SELECT id FROM formation_reviews WHERE user_id = ? AND formation_id = ?')
    .get(req.user.id, req.params.id);

  if (existing) {
    db.prepare('UPDATE formation_reviews SET rating = ?, comment = ? WHERE id = ?')
      .run(rating, comment || '', existing.id);
  } else {
    db.prepare('INSERT INTO formation_reviews (id, user_id, formation_id, rating, comment) VALUES (?, ?, ?, ?, ?)')
      .run(uuidv4(), req.user.id, req.params.id, rating, comment || '');
  }

  res.json({ message: 'Avis enregistré' });
});

// CRUD Admin formations
router.post('/formations', requireAdmin, (req, res) => {
  const { title, theme, level, description, coverEmoji, freeForInitiee, unitPrice, modules, status } = req.body;
  if (!title) return res.status(400).json({ error: 'Titre requis' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO formations (id, title, theme, level, description, cover_emoji, free_for_initiee, unit_price, modules, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, theme || '', level || 'Débutant', description || '', coverEmoji || '📚',
    freeForInitiee ? 1 : 0, unitPrice || 0, JSON.stringify(modules || []), status || 'brouillon');

  res.status(201).json({ id, message: 'Formation créée' });
});

router.put('/formations/:id', requireAdmin, (req, res) => {
  const { title, theme, level, description, coverEmoji, freeForInitiee, unitPrice, modules, status } = req.body;
  db.prepare(`
    UPDATE formations SET title=?, theme=?, level=?, description=?, cover_emoji=?, free_for_initiee=?,
    unit_price=?, modules=?, status=?, updated_at=unixepoch()
    WHERE id=?
  `).run(title, theme || '', level || 'Débutant', description || '', coverEmoji || '📚',
    freeForInitiee ? 1 : 0, unitPrice || 0, JSON.stringify(modules || []), status || 'brouillon',
    req.params.id);

  res.json({ message: 'Formation mise à jour' });
});

router.delete('/formations/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE formations SET status = ? WHERE id = ?').run('archive', req.params.id);
  res.json({ message: 'Formation archivée' });
});

// ════════════════════════════════════════════
// MASTERCLASSES
// ════════════════════════════════════════════

router.get('/masterclasses', requireAuth, (req, res) => {
  let query = `SELECT m.*, COUNT(v.id) as view_count,
    EXISTS(SELECT 1 FROM masterclass_views WHERE masterclass_id = m.id AND user_id = ?) as is_viewed
    FROM masterclasses m LEFT JOIN masterclass_views v ON v.masterclass_id = m.id`;
  const params = [req.user.id];

  if (req.user.role !== 'admin') {
    query += ' WHERE m.status = ?';
    params.push('publie');
  }

  query += ' GROUP BY m.id ORDER BY m.created_at DESC';
  const masterclasses = db.prepare(query).all(...params);

  res.json(masterclasses.map(m => ({
    id: m.id,
    title: m.title,
    duration: m.duration,
    theme: m.theme,
    description: m.description,
    coverEmoji: m.cover_emoji,
    videoUrl: m.video_url,
    status: m.status,
    isPremium: !!m.is_premium,
    viewCount: m.view_count,
    isViewed: !!m.is_viewed,
    createdAt: m.created_at
  })));
});

router.post('/masterclasses/:id/view', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT id FROM masterclass_views WHERE masterclass_id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!existing) {
    db.prepare('INSERT INTO masterclass_views (id, masterclass_id, user_id) VALUES (?, ?, ?)')
      .run(uuidv4(), req.params.id, req.user.id);
    db.prepare('UPDATE users SET points = points + 10 WHERE id = ?').run(req.user.id);
  }
  res.json({ message: 'Vue enregistrée' });
});

router.post('/masterclasses', requireAdmin, (req, res) => {
  const { title, duration, theme, description, coverEmoji, videoUrl, isPremium, status } = req.body;
  if (!title) return res.status(400).json({ error: 'Titre requis' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO masterclasses (id, title, duration, theme, description, cover_emoji, video_url, is_premium, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, duration || '', theme || '', description || '', coverEmoji || '🎬',
    videoUrl || '', isPremium ? 1 : 0, status || 'brouillon');

  res.status(201).json({ id, message: 'Masterclass créée' });
});

router.put('/masterclasses/:id', requireAdmin, (req, res) => {
  const { title, duration, theme, description, coverEmoji, videoUrl, isPremium, status } = req.body;
  db.prepare(`
    UPDATE masterclasses SET title=?, duration=?, theme=?, description=?, cover_emoji=?,
    video_url=?, is_premium=?, status=?, updated_at=unixepoch()
    WHERE id=?
  `).run(title, duration || '', theme || '', description || '', coverEmoji || '🎬',
    videoUrl || '', isPremium ? 1 : 0, status || 'brouillon', req.params.id);
  res.json({ message: 'Masterclass mise à jour' });
});

router.delete('/masterclasses/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE masterclasses SET status = ? WHERE id = ?').run('archive', req.params.id);
  res.json({ message: 'Masterclass archivée' });
});

// ════════════════════════════════════════════
// RESSOURCES
// ════════════════════════════════════════════

router.get('/resources', requireAuth, (req, res) => {
  let query = `SELECT r.*,
    (SELECT data FROM resource_notes WHERE resource_id = r.id AND user_id = ?) as my_notes,
    (SELECT id FROM resource_purchases WHERE resource_id = r.id AND user_id = ?) as is_purchased
    FROM resources r`;
  const params = [req.user.id, req.user.id];

  if (req.user.role !== 'admin') {
    query += ' WHERE r.status = ?';
    params.push('publie');
  }

  query += ' ORDER BY r.created_at DESC';
  const resources = db.prepare(query).all(...params);

  res.json(resources.map(r => ({
    id: r.id,
    title: r.title,
    type: r.type,
    theme: r.theme,
    description: r.description,
    coverEmoji: r.cover_emoji,
    price: r.price,
    isFree: !!r.is_free,
    status: r.status,
    myNotes: r.my_notes ? JSON.parse(r.my_notes) : null,
    isPurchased: !!r.is_purchased,
    createdAt: r.created_at
  })));
});

router.post('/resources/:id/notes', requireAuth, (req, res) => {
  const { retains, apply } = req.body;
  const existing = db.prepare('SELECT id FROM resource_notes WHERE user_id = ? AND resource_id = ?')
    .get(req.user.id, req.params.id);

  const noteData = JSON.stringify({ retains: retains || '', apply: apply || '' });

  if (existing) {
    db.prepare('UPDATE resource_notes SET data = ?, updated_at = unixepoch() WHERE id = ?')
      .run(noteData, existing.id);
  } else {
    db.prepare('INSERT INTO resource_notes (id, user_id, resource_id, data) VALUES (?, ?, ?, ?)')
      .run(uuidv4(), req.user.id, req.params.id, noteData);
  }
  res.json({ message: 'Notes sauvegardées' });
});

router.post('/resources', requireAdmin, (req, res) => {
  const { title, type, theme, description, coverEmoji, price, isFree, status } = req.body;
  if (!title) return res.status(400).json({ error: 'Titre requis' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO resources (id, title, type, theme, description, cover_emoji, price, is_free, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, type || 'guide', theme || '', description || '', coverEmoji || '📄',
    price || 0, isFree ? 1 : 0, status || 'brouillon');
  res.status(201).json({ id, message: 'Ressource créée' });
});

router.put('/resources/:id', requireAdmin, (req, res) => {
  const { title, type, theme, description, coverEmoji, price, isFree, status } = req.body;
  db.prepare(`
    UPDATE resources SET title=?, type=?, theme=?, description=?, cover_emoji=?,
    price=?, is_free=?, status=?, updated_at=unixepoch() WHERE id=?
  `).run(title, type || 'guide', theme || '', description || '', coverEmoji || '📄',
    price || 0, isFree ? 1 : 0, status || 'brouillon', req.params.id);
  res.json({ message: 'Ressource mise à jour' });
});

router.delete('/resources/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE resources SET status = ? WHERE id = ?').run('archive', req.params.id);
  res.json({ message: 'Ressource archivée' });
});

// ════════════════════════════════════════════
// BLOG
// ════════════════════════════════════════════

router.get('/blog', (req, res) => {
  const isAuthenticated = !!req.headers.authorization;
  let query = 'SELECT * FROM blog_posts WHERE status = ?';
  const params = ['publie'];

  if (!isAuthenticated) {
    query += ' AND access = ?';
    params.push('public');
  }

  query += ' ORDER BY is_featured DESC, published_at DESC';
  const posts = db.prepare(query).all(...params);

  res.json(posts.map(p => ({
    id: p.id,
    title: p.title,
    category: p.category,
    authorName: p.author_name,
    excerpt: p.excerpt,
    content: p.content,
    emoji: p.emoji,
    coverImage: p.cover_image,
    readTime: p.read_time,
    status: p.status,
    access: p.access,
    isFeatured: !!p.is_featured,
    publishedAt: p.published_at,
    createdAt: p.created_at
  })));
});

router.get('/blog/all', requireAdmin, (req, res) => {
  const posts = db.prepare('SELECT * FROM blog_posts ORDER BY created_at DESC').all();
  res.json(posts);
});

router.get('/blog/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Article introuvable' });
  res.json(p);
});

router.post('/blog', requireAdmin, (req, res) => {
  const { title, category, authorName, excerpt, content, emoji, isFeatured, readTime, access, status } = req.body;
  if (!title) return res.status(400).json({ error: 'Titre requis' });

  const id = uuidv4();
  const publishedAt = status === 'publie' ? Math.floor(Date.now() / 1000) : null;
  db.prepare(`
    INSERT INTO blog_posts (id, title, category, author_name, excerpt, content, emoji, is_featured, read_time, access, status, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, category || 'business', authorName || 'La Rédaction', excerpt || '',
    content || '', emoji || '✍️', isFeatured ? 1 : 0, readTime || 5, access || 'public', status || 'brouillon', publishedAt);

  res.status(201).json({ id, message: 'Article créé' });
});

router.put('/blog/:id', requireAdmin, (req, res) => {
  const p = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Article introuvable' });

  const { title, category, authorName, excerpt, content, emoji, isFeatured, readTime, access, status } = req.body;
  const publishedAt = status === 'publie' && !p.published_at ? Math.floor(Date.now() / 1000) : p.published_at;

  db.prepare(`
    UPDATE blog_posts SET title=?, category=?, author_name=?, excerpt=?, content=?, emoji=?,
    is_featured=?, read_time=?, access=?, status=?, published_at=?, updated_at=unixepoch()
    WHERE id=?
  `).run(title, category || 'business', authorName || 'La Rédaction', excerpt || '',
    content || '', emoji || '✍️', isFeatured ? 1 : 0, readTime || 5, access || 'public',
    status || 'brouillon', publishedAt, req.params.id);

  res.json({ message: 'Article mis à jour' });
});

router.delete('/blog/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM blog_posts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Article supprimé' });
});

// ════════════════════════════════════════════
// BIBLIOTHÈQUE (e-books à vendre)
// ════════════════════════════════════════════

router.get('/library', (req, res) => {
  const items = db.prepare('SELECT * FROM library_items WHERE status = ? ORDER BY created_at DESC').all('publie');
  res.json(items.map(i => ({
    id: i.id,
    title: i.title,
    type: i.type,
    description: i.description,
    coverEmoji: i.cover_emoji,
    price: i.price,
    createdAt: i.created_at
  })));
});

router.post('/library', requireAdmin, (req, res) => {
  const { title, type, description, coverEmoji, price, status } = req.body;
  if (!title) return res.status(400).json({ error: 'Titre requis' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO library_items (id, title, type, description, cover_emoji, price, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, type || 'ebook', description || '', coverEmoji || '📖', price || 0, status || 'brouillon');
  res.status(201).json({ id, message: 'Item créé' });
});

router.put('/library/:id', requireAdmin, (req, res) => {
  const { title, type, description, coverEmoji, price, status } = req.body;
  db.prepare(`
    UPDATE library_items SET title=?, type=?, description=?, cover_emoji=?, price=?, status=?, updated_at=unixepoch()
    WHERE id=?
  `).run(title, type || 'ebook', description || '', coverEmoji || '📖', price || 0, status || 'brouillon', req.params.id);
  res.json({ message: 'Item mis à jour' });
});

router.delete('/library/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE library_items SET status = ? WHERE id = ?').run('archive', req.params.id);
  res.json({ message: 'Item archivé' });
});

module.exports = router;
