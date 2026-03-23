/**
 * Routes d'authentification
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/logout
 * POST /api/auth/forgot-password
 * POST /api/auth/reset-password
 * GET  /api/auth/me
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, generateToken } = require('../middleware/auth');
const { sendEmail } = require('../email');

// ── Inscription ───────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const {
      email, password, firstName, lastName,
      phone = '', tier = 'initiee'
    } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Adresse e-mail invalide' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'Cette adresse e-mail est déjà utilisée' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const verifyToken = uuidv4();

    // Couleurs d'avatar aléatoires
    const avatarColors = ['#4f85a0', '#ebc14c', '#6b9e7c', '#cf6e9e', '#7b6fa0'];
    const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    db.prepare(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, tier, avatar_color, verify_token)
      VALUES (?, ?, ?, ?, ?, ?, 'member', ?, ?, ?)
    `).run(userId, email.toLowerCase(), passwordHash, firstName, lastName, phone, tier, avatarColor, verifyToken);

    // Email de bienvenue (non bloquant)
    sendEmail({
      to: email,
      subject: 'Bienvenue dans La Ligue des Ambitieuses !',
      html: `
        <h2>Bienvenue ${firstName} !</h2>
        <p>Ton compte a été créé avec succès. Tu peux maintenant te connecter à ton espace membre.</p>
        <p>À très vite dans la Ligue !</p>
      `
    }).catch(console.error);

    const token = generateToken(userId);
    const user = db.prepare('SELECT id, email, first_name, last_name, role, tier, avatar_color, points FROM users WHERE id = ?').get(userId);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Connexion ─────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Mettre à jour last_login
    db.prepare('UPDATE users SET last_login = unixepoch() WHERE id = ?').run(user.id);

    const token = generateToken(user.id);
    const safeUser = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      tier: user.tier,
      avatarColor: user.avatar_color,
      points: user.points,
      businessName: user.business_name,
      sector: user.sector,
      bio: user.bio,
      website: user.website,
      instagram: user.instagram,
      linkedin: user.linkedin
    };

    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Déconnexion (côté client, token supprimé) ─────────────────
router.post('/logout', requireAuth, (req, res) => {
  res.json({ message: 'Déconnecté avec succès' });
});

// ── Profil de l'utilisateur connecté ─────────────────────────
router.get('/me', requireAuth, (req, res) => {
  const u = req.user;
  const badges = db.prepare('SELECT badge_id, earned_at FROM user_badges WHERE user_id = ?').all(u.id);
  const subscription = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(u.id);

  res.json({
    id: u.id,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    phone: u.phone,
    address: u.address,
    city: u.city,
    postalCode: u.postal_code,
    dateNaissance: u.date_naissance,
    bio: u.bio,
    sector: u.sector,
    businessName: u.business_name,
    website: u.website,
    instagram: u.instagram,
    linkedin: u.linkedin,
    role: u.role,
    tier: u.tier,
    avatarColor: u.avatar_color,
    points: u.points,
    isVerified: !!u.is_verified,
    badges,
    subscription: subscription || null,
    createdAt: u.created_at
  });
});

// ── Mot de passe oublié ───────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requis' });

    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email.toLowerCase());

    // Toujours renvoyer 200 pour ne pas divulguer si l'email existe
    if (!user) {
      return res.json({ message: 'Si cette adresse e-mail existe, un lien a été envoyé.' });
    }

    const resetToken = uuidv4();
    const resetExpires = Date.now() + 3600000; // 1h
    db.prepare('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?')
      .run(resetToken, resetExpires, user.id);

    const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
    const resetUrl = `${siteUrl}/?reset=${resetToken}`;

    await sendEmail({
      to: email,
      subject: 'Réinitialisation de ton mot de passe — La Ligue des Ambitieuses',
      html: `
        <h2>Réinitialisation de mot de passe</h2>
        <p>Tu as demandé la réinitialisation de ton mot de passe. Clique sur le lien ci-dessous :</p>
        <p><a href="${resetUrl}" style="background:#142435;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">Réinitialiser mon mot de passe</a></p>
        <p>Ce lien est valable 1 heure.</p>
        <p>Si tu n'as pas demandé cette réinitialisation, ignore cet email.</p>
      `
    });

    res.json({ message: 'Si cette adresse e-mail existe, un lien a été envoyé.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Réinitialisation du mot de passe ─────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token et mot de passe requis' });
    if (password.length < 8) return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });

    const user = db.prepare('SELECT * FROM users WHERE reset_token = ? AND reset_expires > ?')
      .get(token, Date.now());
    if (!user) {
      return res.status(400).json({ error: 'Lien invalide ou expiré' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?')
      .run(passwordHash, user.id);

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Changer le mot de passe (connecté) ───────────────────────
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Champs requis' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });

    const newHash = await bcrypt.hash(newPassword, 12);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = unixepoch() WHERE id = ?').run(newHash, req.user.id);

    res.json({ message: 'Mot de passe mis à jour' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
