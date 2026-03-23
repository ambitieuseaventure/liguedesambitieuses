/**
 * Routes événements et Q&R
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ── Événements ────────────────────────────────────────────────

router.get('/', requireAuth, (req, res) => {
  const { month, year } = req.query;
  let query = 'SELECT e.*, (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as attendees_count FROM events e';
  const params = [];

  if (month && year) {
    query += ' WHERE strftime(\'%Y-%m\', date) = ?';
    params.push(`${year}-${String(month).padStart(2, '0')}`);
  }

  query += ' ORDER BY date ASC, start_time ASC';
  const events = db.prepare(query).all(...params);

  // Ajouter si l'utilisateur est inscrit
  const registrations = db.prepare('SELECT event_id FROM event_registrations WHERE user_id = ?').all(req.user.id);
  const registeredIds = new Set(registrations.map(r => r.event_id));

  res.json(events.map(e => ({
    id: e.id,
    title: e.title,
    type: e.type,
    date: e.date,
    startTime: e.start_time,
    endTime: e.end_time,
    description: e.description,
    host: e.host,
    location: e.location,
    videoLink: e.video_link,
    tierRequired: e.tier_required,
    maxAttendees: e.max_attendees,
    attendeesCount: e.attendees_count,
    isRegistered: registeredIds.has(e.id),
    createdAt: e.created_at
  })));
});

router.post('/', requireAdmin, (req, res) => {
  const { title, type, date, startTime, endTime, description, host, location, videoLink, tierRequired, maxAttendees } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Titre et date requis' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO events (id, title, type, date, start_time, end_time, description, host, location, video_link, tier_required, max_attendees)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, type || 'evenement', date, startTime || '', endTime || '', description || '',
    host || '', location || '', videoLink || '', tierRequired || 'initiee', maxAttendees || 0);

  res.status(201).json({ id, message: 'Événement créé' });
});

router.put('/:id', requireAdmin, (req, res) => {
  const { title, type, date, startTime, endTime, description, host, location, videoLink, tierRequired, maxAttendees } = req.body;
  db.prepare(`
    UPDATE events SET title=?, type=?, date=?, start_time=?, end_time=?, description=?,
    host=?, location=?, video_link=?, tier_required=?, max_attendees=?, updated_at=unixepoch()
    WHERE id=?
  `).run(title, type || 'evenement', date, startTime || '', endTime || '', description || '',
    host || '', location || '', videoLink || '', tierRequired || 'initiee', maxAttendees || 0, req.params.id);
  res.json({ message: 'Événement mis à jour' });
});

router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.json({ message: 'Événement supprimé' });
});

// Inscription/désinscription
router.post('/:id/register', requireAuth, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Événement introuvable' });

  const existing = db.prepare('SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (existing) {
    db.prepare('DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);
    return res.json({ registered: false, message: 'Désinscription effectuée' });
  }

  // Vérifier la limite
  if (event.max_attendees > 0) {
    const count = db.prepare('SELECT COUNT(*) as n FROM event_registrations WHERE event_id = ?').get(req.params.id).n;
    if (count >= event.max_attendees) return res.status(409).json({ error: 'Événement complet' });
  }

  db.prepare('INSERT INTO event_registrations (id, event_id, user_id) VALUES (?, ?, ?)')
    .run(uuidv4(), req.params.id, req.user.id);
  res.json({ registered: true, message: 'Inscription confirmée' });
});

// ── Sessions Q&R ──────────────────────────────────────────────

router.get('/qr', requireAuth, (req, res) => {
  const sessions = db.prepare('SELECT * FROM qr_sessions ORDER BY date DESC').all();
  res.json(sessions);
});

router.post('/qr', requireAdmin, (req, res) => {
  const { title, date, time, host } = req.body;
  if (!title) return res.status(400).json({ error: 'Titre requis' });

  const id = uuidv4();
  db.prepare('INSERT INTO qr_sessions (id, title, date, time, host) VALUES (?, ?, ?, ?, ?)')
    .run(id, title, date || '', time || '', host || '');
  res.status(201).json({ id, message: 'Session Q&R créée' });
});

router.get('/qr/:id/questions', requireAuth, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  let query = `
    SELECT q.*, u.first_name, u.last_name, u.avatar_color
    FROM qr_questions q JOIN users u ON u.id = q.user_id
    WHERE q.session_id = ?
  `;
  if (!isAdmin) query += ' AND (q.is_private = 0 OR q.user_id = ?)';
  query += ' ORDER BY q.created_at ASC';

  const params = isAdmin ? [req.params.id] : [req.params.id, req.user.id];
  const questions = db.prepare(query).all(...params);

  res.json(questions.map(q => ({
    id: q.id,
    content: q.content,
    isPrivate: !!q.is_private,
    isAnswered: !!q.is_answered,
    author: {
      firstName: q.first_name,
      lastName: q.last_name,
      initials: (q.first_name[0] || '') + (q.last_name[0] || ''),
      avatarColor: q.avatar_color
    },
    isOwn: q.user_id === req.user.id,
    createdAt: q.created_at
  })));
});

router.post('/qr/:id/questions', requireAuth, (req, res) => {
  const { content, isPrivate } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Question requise' });

  const id = uuidv4();
  db.prepare('INSERT INTO qr_questions (id, session_id, user_id, content, is_private) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.params.id, req.user.id, content.trim(), isPrivate ? 1 : 0);
  res.status(201).json({ id, message: 'Question envoyée' });
});

router.put('/qr/questions/:id/answer', requireAdmin, (req, res) => {
  db.prepare('UPDATE qr_questions SET is_answered = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Question marquée comme répondue' });
});

module.exports = router;
