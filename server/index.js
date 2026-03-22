/**
 * La Ligue des Ambitieuses — Serveur Express
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Sécurité ──────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://www.paypal.com", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://www.paypal.com", "https://www.youtube.com", "https://www.youtube-nocookie.com", "https://player.vimeo.com", "https://www.loom.com", "https://loom.com", "https://docs.google.com", "https://drive.google.com", "https://calendly.com", "https://typeform.com", "https://*.typeform.com", "https://airtable.com", "https://*.airtable.com", "https://p.interacty.me", "https://*.interacty.me"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.SITE_URL || 'http://localhost:3000',
  credentials: true
}));

// ── Rate limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, réessaie dans quelques minutes.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de tentatives de connexion. Réessaie dans 15 minutes.' }
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Parsing ───────────────────────────────────────────────────
// Webhook Stripe a besoin du raw body — doit être avant express.json()
app.use('/api/payment/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Fichiers statiques ────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Routes API ────────────────────────────────────────────────
const authRoutes     = require('./routes/auth');
const usersRoutes    = require('./routes/users');
const contentRoutes  = require('./routes/content');
const communityRoutes = require('./routes/community');
const eventsRoutes   = require('./routes/events');
const messagingRoutes = require('./routes/messaging');
const supportRoutes  = require('./routes/support');
const adminRoutes    = require('./routes/admin');
const paymentRoutes  = require('./routes/payment');
const mindsetRoutes  = require('./routes/mindset');
const notebookRoutes = require('./routes/notebook');

// Middleware optionnel pour les routes qui en ont besoin
const { optionalAuth, requireAuth } = require('./middleware/auth');

app.use('/api/auth',       authRoutes);
app.use('/api/users',      usersRoutes);
app.use('/api/content',    contentRoutes);
app.use('/api/community',  communityRoutes);
app.use('/api/events',     eventsRoutes);
app.use('/api/messages',   messagingRoutes);
app.use('/api/support',    supportRoutes);
app.use('/api/admin',      (req, res, next) => { req.user = req.user || null; next(); }, adminRoutes);
app.use('/api/payment',    paymentRoutes);
app.use('/api/mindset',   mindsetRoutes);
app.use('/api/notebook',  notebookRoutes);

// Notifications (accessible pour les membres connectés)
app.get('/api/notifications', requireAuth, (req, res) => {
  const db = require('./db');
  const notifications = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ?
    ORDER BY created_at DESC LIMIT 50
  `).all(req.user.id);
  res.json(notifications);
});

app.post('/api/notifications/:id/read', requireAuth, (req, res) => {
  const db = require('./db');
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Lu' });
});

app.post('/api/notifications/read-all', requireAuth, (req, res) => {
  const db = require('./db');
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'Toutes marquées comme lues' });
});

// Annonces publiques
app.get('/api/announcements', optionalAuth, (req, res) => {
  const db = require('./db');
  const announcements = db.prepare(`
    SELECT * FROM announcements
    WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > unixepoch())
    ORDER BY created_at DESC
  `).all();
  res.json(announcements);
});

// ── Route principale — servir index.html ──────────────────────
app.get('*', (req, res) => {
  // Ne pas servir index.html pour les routes API
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Route non trouvée' });
  }
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── Gestion des erreurs ───────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Fichier trop volumineux (max 2MB)' });
  }
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// ── Démarrage ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║  La Ligue des Ambitieuses — Serveur démarré ║
╠════════════════════════════════════════════╣
║  Port    : ${PORT}                              ║
║  Mode    : ${(process.env.NODE_ENV || 'development').padEnd(12)}              ║
║  URL     : http://localhost:${PORT}              ║
╚════════════════════════════════════════════╝
  `);
});

module.exports = app;
