/**
 * Routes Carnet (Notebook) — Journal & Actions
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// ── Journal entries ────────────────────────────────────────────

router.get('/journal', requireAuth, (req, res) => {
  const entries = db.prepare(
    'SELECT * FROM journal_entries WHERE user_id = ? ORDER BY date DESC LIMIT 30'
  ).all(req.user.id);
  res.json(entries);
});

router.post('/journal', requireAuth, (req, res) => {
  const { date, mood, content } = req.body;
  const today = date || new Date().toISOString().slice(0, 10);

  const existing = db.prepare('SELECT id FROM journal_entries WHERE user_id = ? AND date = ?')
    .get(req.user.id, today);

  if (existing) {
    db.prepare('UPDATE journal_entries SET mood = ?, content = ?, updated_at = unixepoch() WHERE id = ?')
      .run(mood || '', content || '', existing.id);
    const updated = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(existing.id);
    return res.json(updated);
  }

  const id = uuidv4();
  db.prepare('INSERT INTO journal_entries (id, user_id, date, mood, content) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.user.id, today, mood || '', content || '');
  const created = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(id);
  res.status(201).json(created);
});

router.put('/journal/:date', requireAuth, (req, res) => {
  const { mood, content } = req.body;
  db.prepare('UPDATE journal_entries SET mood = ?, content = ?, updated_at = unixepoch() WHERE user_id = ? AND date = ?')
    .run(mood || '', content || '', req.user.id, req.params.date);
  res.json({ message: 'Journal mis à jour' });
});

// ── Actions (todo list) ────────────────────────────────────────

router.get('/actions', requireAuth, (req, res) => {
  const actions = db.prepare(
    'SELECT * FROM notebook_actions WHERE user_id = ? ORDER BY is_done ASC, created_at DESC'
  ).all(req.user.id);
  res.json(actions);
});

router.post('/actions', requireAuth, (req, res) => {
  const { text, priority, dueDate } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Contenu requis' });

  const id = uuidv4();
  db.prepare('INSERT INTO notebook_actions (id, user_id, content, priority, due_date) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.user.id, text.trim(), priority || 'normale', dueDate || '');

  const action = db.prepare('SELECT * FROM notebook_actions WHERE id = ?').get(id);
  res.status(201).json(action);
});

router.put('/actions/:id', requireAuth, (req, res) => {
  const action = db.prepare('SELECT * FROM notebook_actions WHERE id = ?').get(req.params.id);
  if (!action) return res.status(404).json({ error: 'Action introuvable' });
  if (action.user_id !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });

  const { text, isDone, priority, dueDate } = req.body;
  db.prepare('UPDATE notebook_actions SET content = ?, is_done = ?, priority = ?, due_date = ?, updated_at = unixepoch() WHERE id = ?')
    .run(
      text !== undefined ? text : action.content,
      isDone !== undefined ? (isDone ? 1 : 0) : action.is_done,
      priority || action.priority,
      dueDate !== undefined ? dueDate : action.due_date,
      req.params.id
    );
  res.json({ message: 'Action mise à jour' });
});

router.delete('/actions/:id', requireAuth, (req, res) => {
  const action = db.prepare('SELECT * FROM notebook_actions WHERE id = ?').get(req.params.id);
  if (!action) return res.status(404).json({ error: 'Action introuvable' });
  if (action.user_id !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });

  db.prepare('DELETE FROM notebook_actions WHERE id = ?').run(req.params.id);
  res.json({ message: 'Action supprimée' });
});

module.exports = router;
