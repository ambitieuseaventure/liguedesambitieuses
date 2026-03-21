/**
 * Routes messagerie privée
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// ── Conversations (liste des interlocuteurs) ──────────────────
router.get('/conversations', requireAuth, (req, res) => {
  const conversations = db.prepare(`
    SELECT
      CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as partner_id,
      MAX(m.created_at) as last_message_at,
      SUM(CASE WHEN m.receiver_id = ? AND m.is_read = 0 THEN 1 ELSE 0 END) as unread_count
    FROM messages m
    WHERE m.sender_id = ? OR m.receiver_id = ?
    GROUP BY partner_id
    ORDER BY last_message_at DESC
  `).all(req.user.id, req.user.id, req.user.id, req.user.id);

  const result = conversations.map(c => {
    const partner = db.prepare('SELECT id, first_name, last_name, avatar_color, tier, business_name FROM users WHERE id = ?').get(c.partner_id);
    const lastMsg = db.prepare(`
      SELECT * FROM messages
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at DESC LIMIT 1
    `).get(req.user.id, c.partner_id, c.partner_id, req.user.id);

    return {
      partner: partner ? {
        id: partner.id,
        firstName: partner.first_name,
        lastName: partner.last_name,
        initials: (partner.first_name[0] || '') + (partner.last_name[0] || ''),
        avatarColor: partner.avatar_color,
        tier: partner.tier,
        businessName: partner.business_name
      } : null,
      lastMessage: lastMsg ? {
        content: lastMsg.content,
        isOwn: lastMsg.sender_id === req.user.id,
        createdAt: lastMsg.created_at
      } : null,
      unreadCount: c.unread_count,
      lastMessageAt: c.last_message_at
    };
  });

  res.json(result);
});

// ── Messages d'une conversation ───────────────────────────────
router.get('/with/:partnerId', requireAuth, (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const messages = db.prepare(`
    SELECT m.*, u.first_name, u.last_name, u.avatar_color
    FROM messages m JOIN users u ON u.id = m.sender_id
    WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.user.id, req.params.partnerId, req.params.partnerId, req.user.id, parseInt(limit), offset);

  // Marquer comme lus
  db.prepare('UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ? AND is_read = 0')
    .run(req.user.id, req.params.partnerId);

  res.json(messages.reverse().map(m => ({
    id: m.id,
    content: m.content,
    isOwn: m.sender_id === req.user.id,
    isRead: !!m.is_read,
    sender: {
      firstName: m.first_name,
      lastName: m.last_name,
      initials: (m.first_name[0] || '') + (m.last_name[0] || ''),
      avatarColor: m.avatar_color
    },
    createdAt: m.created_at
  })));
});

// ── Envoyer un message ────────────────────────────────────────
router.post('/send', requireAuth, (req, res) => {
  const { receiverId, content } = req.body;
  if (!receiverId || !content || !content.trim()) {
    return res.status(400).json({ error: 'Destinataire et contenu requis' });
  }
  if (receiverId === req.user.id) {
    return res.status(400).json({ error: 'Impossible de s\'envoyer un message' });
  }

  const receiver = db.prepare('SELECT id FROM users WHERE id = ? AND is_active = 1').get(receiverId);
  if (!receiver) return res.status(404).json({ error: 'Destinataire introuvable' });

  const id = uuidv4();
  db.prepare('INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)')
    .run(id, req.user.id, receiverId, content.trim());

  const message = db.prepare(`
    SELECT m.*, u.first_name, u.last_name, u.avatar_color
    FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?
  `).get(id);

  res.status(201).json({
    id: message.id,
    content: message.content,
    isOwn: true,
    isRead: false,
    sender: {
      firstName: message.first_name,
      lastName: message.last_name,
      initials: (message.first_name[0] || '') + (message.last_name[0] || ''),
      avatarColor: message.avatar_color
    },
    createdAt: message.created_at
  });
});

// ── Nombre de messages non lus ────────────────────────────────
router.get('/unread-count', requireAuth, (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as n FROM messages WHERE receiver_id = ? AND is_read = 0').get(req.user.id);
  res.json({ count: count.n });
});

module.exports = router;
