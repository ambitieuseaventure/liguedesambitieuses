/**
 * Routes administration
 * Dashboard stats, CRM, Emails, Annonces, Notifications
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { sendEmail } = require('../email');

// ── Dashboard stats ───────────────────────────────────────────
router.get('/stats', requireAdmin, (req, res) => {
  const totalMembers = db.prepare('SELECT COUNT(*) as n FROM users WHERE role = ? AND is_active = 1').get('member').n;
  const newThisMonth = db.prepare(`
    SELECT COUNT(*) as n FROM users
    WHERE role = 'member' AND strftime('%Y-%m', datetime(created_at, 'unixepoch')) = strftime('%Y-%m', 'now')
  `).get().n;

  const byTier = db.prepare(`
    SELECT tier, COUNT(*) as count FROM users WHERE role = 'member' AND is_active = 1 GROUP BY tier
  `).all();

  const totalRevenue = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'succeeded'
  `).get().total;

  const activeTickets = db.prepare(`
    SELECT COUNT(*) as n FROM hotline_tickets WHERE status IN ('ouvert','en-cours')
  `).get().n;

  const pendingCoaching = db.prepare(`
    SELECT COUNT(*) as n FROM coaching_bookings WHERE status = 'en-attente'
  `).get().n;

  const totalPosts = db.prepare('SELECT COUNT(*) as n FROM community_posts WHERE is_deleted = 0').get().n;

  const recentMembers = db.prepare(`
    SELECT id, first_name, last_name, email, tier, avatar_color, created_at
    FROM users WHERE role = 'member' AND is_active = 1
    ORDER BY created_at DESC LIMIT 5
  `).all();

  res.json({
    totalMembers,
    newThisMonth,
    byTier: byTier.reduce((acc, r) => { acc[r.tier] = r.count; return acc; }, {}),
    totalRevenue,
    activeTickets,
    pendingCoaching,
    totalPosts,
    recentMembers: recentMembers.map(m => ({
      id: m.id,
      firstName: m.first_name,
      lastName: m.last_name,
      email: m.email,
      tier: m.tier,
      avatarColor: m.avatar_color,
      createdAt: m.created_at
    }))
  });
});

// ── Activité récente ──────────────────────────────────────────
router.get('/activity', requireAdmin, (req, res) => {
  const recentPosts = db.prepare(`
    SELECT 'post' as type, p.id, p.content as description, p.created_at,
           u.first_name, u.last_name
    FROM community_posts p JOIN users u ON u.id = p.user_id
    WHERE p.is_deleted = 0 ORDER BY p.created_at DESC LIMIT 10
  `).all();

  const recentMembers = db.prepare(`
    SELECT 'member' as type, u.id, (u.first_name || ' ' || u.last_name) as description, u.created_at,
           u.first_name, u.last_name
    FROM users u WHERE u.role = 'member'
    ORDER BY u.created_at DESC LIMIT 10
  `).all();

  const recentTickets = db.prepare(`
    SELECT 'hotline' as type, t.id, t.theme as description, t.created_at,
           u.first_name, u.last_name
    FROM hotline_tickets t JOIN users u ON u.id = t.user_id
    ORDER BY t.created_at DESC LIMIT 5
  `).all();

  const allActivity = [...recentPosts, ...recentMembers, ...recentTickets]
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, 20);

  res.json(allActivity);
});

// ── CRM Prospects ─────────────────────────────────────────────
router.get('/crm', requireAdmin, (req, res) => {
  const { status, search } = req.query;
  let query = 'SELECT * FROM crm_prospects WHERE 1=1';
  const params = [];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (search) {
    query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all(...params));
});

router.post('/crm', requireAdmin, (req, res) => {
  const { firstName, lastName, email, phone, source, status, notes } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO crm_prospects (id, first_name, last_name, email, phone, source, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, firstName || '', lastName || '', email, phone || '', source || '', status || 'nouveau', notes || '');

  res.status(201).json({ id, message: 'Prospect ajouté' });
});

router.put('/crm/:id', requireAdmin, (req, res) => {
  const { firstName, lastName, email, phone, source, status, notes } = req.body;
  db.prepare(`
    UPDATE crm_prospects SET first_name=?, last_name=?, email=?, phone=?, source=?, status=?, notes=?, updated_at=unixepoch()
    WHERE id=?
  `).run(firstName || '', lastName || '', email, phone || '', source || '', status || 'nouveau', notes || '', req.params.id);
  res.json({ message: 'Prospect mis à jour' });
});

router.delete('/crm/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM crm_prospects WHERE id = ?').run(req.params.id);
  res.json({ message: 'Prospect supprimé' });
});

// ── Campagnes email ───────────────────────────────────────────
router.get('/campaigns', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM email_campaigns ORDER BY created_at DESC').all());
});

router.post('/campaigns', requireAdmin, (req, res) => {
  const { name, subject, content, target, status, scheduledAt } = req.body;
  if (!name || !subject) return res.status(400).json({ error: 'Nom et sujet requis' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO email_campaigns (id, name, subject, content, target, status, scheduled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, subject, content || '', target || 'all', status || 'brouillon', scheduledAt || null);

  res.status(201).json({ id, message: 'Campagne créée' });
});

router.put('/campaigns/:id', requireAdmin, (req, res) => {
  const { name, subject, content, target, status, scheduledAt } = req.body;
  db.prepare(`
    UPDATE email_campaigns SET name=?, subject=?, content=?, target=?, status=?, scheduled_at=?
    WHERE id=?
  `).run(name, subject, content || '', target || 'all', status || 'brouillon', scheduledAt || null, req.params.id);
  res.json({ message: 'Campagne mise à jour' });
});

// Envoyer une campagne
router.post('/campaigns/:id/send', requireAdmin, async (req, res) => {
  const campaign = db.prepare('SELECT * FROM email_campaigns WHERE id = ?').get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campagne introuvable' });

  // Déterminer les destinataires
  let query = 'SELECT email, first_name FROM users WHERE is_active = 1';
  const params = [];
  if (campaign.target !== 'all') {
    query += ' AND tier = ?';
    params.push(campaign.target);
  }

  const recipients = db.prepare(query).all(...params);

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    try {
      const personalizedContent = campaign.content
        .replace(/\{\{prenom\}\}/gi, recipient.first_name || 'membre')
        .replace(/\{\{nom\}\}/gi, recipient.last_name || '');

      await sendEmail({
        to: recipient.email,
        subject: campaign.subject,
        html: personalizedContent
      });
      sent++;
    } catch (err) {
      console.error(`Failed to send to ${recipient.email}:`, err.message);
      failed++;
    }
  }

  db.prepare('UPDATE email_campaigns SET status = ?, sent_at = unixepoch() WHERE id = ?')
    .run('envoye', campaign.id);

  res.json({ message: `Campagne envoyée à ${sent} membres (${failed} échecs)`, sent, failed });
});

// ── Annonces ──────────────────────────────────────────────────
router.get('/announcements', (req, res) => {
  const announcements = db.prepare(`
    SELECT * FROM announcements
    WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > unixepoch())
    ORDER BY created_at DESC
  `).all();
  res.json(announcements);
});

router.post('/announcements', requireAdmin, (req, res) => {
  const { title, content, type, targetTier, expiresAt } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Titre et contenu requis' });

  const id = uuidv4();
  db.prepare('INSERT INTO announcements (id, title, content, type, target_tier, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, title, content, type || 'info', targetTier || 'all', expiresAt || null);
  res.status(201).json({ id, message: 'Annonce créée' });
});

router.put('/announcements/:id', requireAdmin, (req, res) => {
  const { title, content, type, targetTier, isActive, expiresAt } = req.body;
  db.prepare(`
    UPDATE announcements SET title=?, content=?, type=?, target_tier=?, is_active=?, expires_at=?
    WHERE id=?
  `).run(title, content, type || 'info', targetTier || 'all', isActive ? 1 : 0, expiresAt || null, req.params.id);
  res.json({ message: 'Annonce mise à jour' });
});

router.delete('/announcements/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE announcements SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Annonce désactivée' });
});

// ── Notifications ─────────────────────────────────────────────
router.get('/notifications', (req, res) => {
  // Cette route est accessible depuis le middleware auth
  const userId = req.user?.id;
  if (!userId) return res.json([]);

  const notifications = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 50
  `).all(userId);
  res.json(notifications);
});

// Envoyer une notification à un ou tous les membres
router.post('/notifications/send', requireAdmin, (req, res) => {
  const { userId, type, title, body, link } = req.body;
  if (!type || !title) return res.status(400).json({ error: 'Type et titre requis' });

  if (userId) {
    db.prepare('INSERT INTO notifications (id, user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), userId, type, title, body || '', link || '');
  } else {
    const members = db.prepare('SELECT id FROM users WHERE is_active = 1').all();
    const insert = db.prepare('INSERT INTO notifications (id, user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?, ?)');
    const insertMany = db.transaction((members) => {
      for (const m of members) {
        insert.run(uuidv4(), m.id, type, title, body || '', link || '');
      }
    });
    insertMany(members);
  }

  res.json({ message: 'Notification(s) envoyée(s)' });
});

// Marquer comme lue
router.post('/notifications/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Notification marquée comme lue' });
});

// ── Journal (carnet de bord) via API ──────────────────────────
router.get('/journal', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Non autorisé' });
  const entries = db.prepare('SELECT * FROM journal_entries WHERE user_id = ? ORDER BY date DESC').all(req.user.id);
  res.json(entries);
});

router.post('/journal', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Non autorisé' });
  const { date, mood, content } = req.body;
  if (!date) return res.status(400).json({ error: 'Date requise' });

  const existing = db.prepare('SELECT id FROM journal_entries WHERE user_id = ? AND date = ?').get(req.user.id, date);
  if (existing) {
    db.prepare('UPDATE journal_entries SET mood=?, content=?, updated_at=unixepoch() WHERE id=?')
      .run(mood || '', content || '', existing.id);
    return res.json({ message: 'Entrée mise à jour' });
  }

  db.prepare('INSERT INTO journal_entries (id, user_id, date, mood, content) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), req.user.id, date, mood || '', content || '');
  res.status(201).json({ message: 'Entrée créée' });
});

// ── Actions du notebook ───────────────────────────────────────
router.get('/notebook/actions', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Non autorisé' });
  const actions = db.prepare('SELECT * FROM notebook_actions WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(actions);
});

router.post('/notebook/actions', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Non autorisé' });
  const { content, priority, dueDate } = req.body;
  if (!content) return res.status(400).json({ error: 'Contenu requis' });

  const id = uuidv4();
  db.prepare('INSERT INTO notebook_actions (id, user_id, content, priority, due_date) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.user.id, content, priority || 'normale', dueDate || '');
  res.status(201).json({ id, message: 'Action créée' });
});

router.put('/notebook/actions/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Non autorisé' });
  const { content, isDone, priority, dueDate } = req.body;
  db.prepare('UPDATE notebook_actions SET content=?, is_done=?, priority=?, due_date=?, updated_at=unixepoch() WHERE id=? AND user_id=?')
    .run(content, isDone ? 1 : 0, priority || 'normale', dueDate || '', req.params.id, req.user.id);
  res.json({ message: 'Action mise à jour' });
});

router.delete('/notebook/actions/:id', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Non autorisé' });
  db.prepare('DELETE FROM notebook_actions WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Action supprimée' });
});

module.exports = router;
