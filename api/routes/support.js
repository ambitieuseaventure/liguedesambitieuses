/**
 * Routes support — Hotline, Coaching, Contact
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { sendEmail } = require('../email');

// ════════════════════════════════════════════
// HOTLINE
// ════════════════════════════════════════════

router.get('/hotline', requireAuth, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  let query;
  let params;

  if (isAdmin) {
    query = `SELECT t.*, u.first_name, u.last_name, u.email, u.avatar_color
      FROM hotline_tickets t JOIN users u ON u.id = t.user_id
      ORDER BY t.updated_at DESC`;
    params = [];
  } else {
    query = `SELECT t.*, u.first_name, u.last_name, u.email, u.avatar_color
      FROM hotline_tickets t JOIN users u ON u.id = t.user_id
      WHERE t.user_id = ? ORDER BY t.updated_at DESC`;
    params = [req.user.id];
  }

  const tickets = db.prepare(query).all(...params);

  res.json(tickets.map(t => ({
    id: t.id,
    theme: t.theme,
    summary: t.summary,
    status: t.status,
    author: {
      firstName: t.first_name,
      lastName: t.last_name,
      email: t.email,
      avatarColor: t.avatar_color
    },
    createdAt: t.created_at,
    updatedAt: t.updated_at
  })));
});

router.post('/hotline', requireAuth, (req, res) => {
  const { theme, summary, firstMessage } = req.body;
  if (!theme || !firstMessage) return res.status(400).json({ error: 'Thème et message requis' });

  const ticketId = uuidv4();
  const msgId = uuidv4();

  db.prepare('INSERT INTO hotline_tickets (id, user_id, theme, summary) VALUES (?, ?, ?, ?)')
    .run(ticketId, req.user.id, theme, summary || '');

  db.prepare('INSERT INTO hotline_messages (id, ticket_id, author_role, author_name, content) VALUES (?, ?, ?, ?, ?)')
    .run(msgId, ticketId, 'member', `${req.user.first_name} ${req.user.last_name}`, firstMessage);

  res.status(201).json({ id: ticketId, message: 'Ticket créé' });
});

router.get('/hotline/:id/messages', requireAuth, (req, res) => {
  const ticket = db.prepare('SELECT * FROM hotline_tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket introuvable' });
  if (ticket.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  const messages = db.prepare('SELECT * FROM hotline_messages WHERE ticket_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json(messages);
});

router.post('/hotline/:id/messages', requireAuth, (req, res) => {
  const ticket = db.prepare('SELECT * FROM hotline_tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket introuvable' });
  if (ticket.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Message requis' });

  const authorRole = req.user.role === 'admin' ? 'team' : 'member';
  const authorName = `${req.user.first_name} ${req.user.last_name}`;

  const id = uuidv4();
  db.prepare('INSERT INTO hotline_messages (id, ticket_id, author_role, author_name, content) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.params.id, authorRole, authorName, content.trim());

  // Mettre à jour le statut
  db.prepare('UPDATE hotline_tickets SET status = ?, updated_at = unixepoch() WHERE id = ?')
    .run(authorRole === 'team' ? 'en-cours' : 'ouvert', req.params.id);

  const msg = db.prepare('SELECT * FROM hotline_messages WHERE id = ?').get(id);
  res.status(201).json(msg);
});

router.put('/hotline/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE hotline_tickets SET status = ?, updated_at = unixepoch() WHERE id = ?')
    .run(status, req.params.id);
  res.json({ message: 'Statut mis à jour' });
});

// ════════════════════════════════════════════
// COACHING
// ════════════════════════════════════════════

router.get('/coaching', requireAuth, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  let query;
  let params;

  if (isAdmin) {
    query = `SELECT b.*, u.first_name, u.last_name, u.email, u.avatar_color
      FROM coaching_bookings b JOIN users u ON u.id = b.user_id
      ORDER BY b.date DESC, b.time DESC`;
    params = [];
  } else {
    query = `SELECT * FROM coaching_bookings WHERE user_id = ? ORDER BY date DESC`;
    params = [req.user.id];
  }

  const bookings = db.prepare(query).all(...params);

  res.json(bookings.map(b => ({
    id: b.id,
    date: b.date,
    time: b.time,
    type: b.type,
    notes: b.notes,
    status: b.status,
    coachName: b.coach_name,
    meetingLink: b.meeting_link,
    author: isAdmin ? {
      firstName: b.first_name,
      lastName: b.last_name,
      email: b.email,
      avatarColor: b.avatar_color
    } : undefined,
    createdAt: b.created_at
  })));
});

router.post('/coaching', requireAuth, (req, res) => {
  const { date, time, type, notes } = req.body;
  if (!date || !time) return res.status(400).json({ error: 'Date et heure requises' });

  // Vérifier disponibilité
  const conflict = db.prepare('SELECT id FROM coaching_bookings WHERE date = ? AND time = ? AND status != ?')
    .get(date, time, 'annule');
  if (conflict) return res.status(409).json({ error: 'Ce créneau est déjà réservé' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO coaching_bookings (id, user_id, date, time, type, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, date, time, type || 'individuel', notes || '');

  // Notification email
  sendEmail({
    to: req.user.email,
    subject: 'Confirmation de ta réservation coaching',
    html: `
      <h2>Réservation confirmée !</h2>
      <p>Ta session de coaching est enregistrée pour le <strong>${date}</strong> à <strong>${time}</strong>.</p>
      <p>Tu recevras un email de confirmation avec le lien de visioconférence.</p>
    `
  }).catch(console.error);

  res.status(201).json({ id, message: 'Réservation effectuée' });
});

router.put('/coaching/:id', requireAdmin, (req, res) => {
  const { status, coachName, meetingLink } = req.body;
  db.prepare('UPDATE coaching_bookings SET status=?, coach_name=?, meeting_link=?, updated_at=unixepoch() WHERE id=?')
    .run(status, coachName || '', meetingLink || '', req.params.id);
  res.json({ message: 'Réservation mise à jour' });
});

router.delete('/coaching/:id', requireAuth, (req, res) => {
  const booking = db.prepare('SELECT * FROM coaching_bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Réservation introuvable' });
  if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  db.prepare('UPDATE coaching_bookings SET status = ?, updated_at = unixepoch() WHERE id = ?')
    .run('annule', req.params.id);
  res.json({ message: 'Réservation annulée' });
});

// ════════════════════════════════════════════
// CONTACT
// ════════════════════════════════════════════

router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Nom, email et message requis' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email invalide' });

    const id = uuidv4();
    db.prepare('INSERT INTO contact_messages (id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)')
      .run(id, name, email, subject || '', message);

    // Emails envoyés de façon non-bloquante (n'échouent pas si SMTP absent)
    const adminEmail = process.env.EMAIL_FROM || 'contact@liguedesambitieuses.fr';
    sendEmail({
      to: adminEmail,
      subject: `[Contact] ${subject || 'Nouveau message'} — ${name}`,
      html: `
        <h3>Nouveau message de contact</h3>
        <p><strong>De :</strong> ${name} (${email})</p>
        <p><strong>Sujet :</strong> ${subject || '—'}</p>
        <hr>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    }).catch(err => console.error('Email admin failed:', err.message));

    sendEmail({
      to: email,
      subject: 'Ton message a bien été reçu — La Ligue des Ambitieuses',
      html: `
        <h2>Message reçu !</h2>
        <p>Bonjour ${name},</p>
        <p>Nous avons bien reçu ton message et te répondrons dans les plus brefs délais (généralement sous 48h ouvrées).</p>
        <p>À très vite !</p>
        <p>L'équipe de La Ligue des Ambitieuses</p>
      `
    }).catch(err => console.error('Email confirmation failed:', err.message));

    res.json({ message: 'Message envoyé' });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
  }
});

router.get('/contact', requireAdmin, (req, res) => {
  const messages = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
  res.json(messages);
});

router.put('/contact/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Statut mis à jour' });
});

module.exports = router;
