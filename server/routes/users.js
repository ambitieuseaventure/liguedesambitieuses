/**
 * Routes utilisateurs / profil
 * GET    /api/users/me
 * PUT    /api/users/me
 * POST   /api/users/me/avatar
 * GET    /api/users              (admin)
 * GET    /api/users/:id          (admin ou soi-même)
 * PUT    /api/users/:id          (admin)
 * DELETE /api/users/:id          (admin)
 * GET    /api/users/annuaire     (membres)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Configuration upload d'avatar
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads', 'avatars'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`);
  }
});
const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Format d\'image non supporté'));
  }
});

// ── Profil actuel ─────────────────────────────────────────────
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

// ── Mettre à jour le profil ───────────────────────────────────
router.put('/me', requireAuth, (req, res) => {
  const {
    firstName, lastName, phone, address, city, postalCode,
    dateNaissance, bio, sector, businessName, website, instagram, linkedin,
    avatarColor
  } = req.body;

  const updates = {};
  if (firstName !== undefined) updates.first_name = firstName;
  if (lastName !== undefined) updates.last_name = lastName;
  if (phone !== undefined) updates.phone = phone;
  if (address !== undefined) updates.address = address;
  if (city !== undefined) updates.city = city;
  if (postalCode !== undefined) updates.postal_code = postalCode;
  if (dateNaissance !== undefined) updates.date_naissance = dateNaissance;
  if (bio !== undefined) updates.bio = bio;
  if (sector !== undefined) updates.sector = sector;
  if (businessName !== undefined) updates.business_name = businessName;
  if (website !== undefined) updates.website = website;
  if (instagram !== undefined) updates.instagram = instagram;
  if (linkedin !== undefined) updates.linkedin = linkedin;
  if (avatarColor !== undefined) updates.avatar_color = avatarColor;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
  }

  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), req.user.id];
  db.prepare(`UPDATE users SET ${setClause}, updated_at = unixepoch() WHERE id = ?`).run(...values);

  res.json({ message: 'Profil mis à jour' });
});

// ── Changer l'email ───────────────────────────────────────────
router.put('/me/email', requireAuth, (req, res) => {
  const { newEmail, confirmEmail } = req.body;
  if (!newEmail || !confirmEmail) return res.status(400).json({ error: 'Champs requis' });
  if (newEmail !== confirmEmail) return res.status(400).json({ error: 'Les emails ne correspondent pas' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return res.status(400).json({ error: 'Email invalide' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(newEmail.toLowerCase(), req.user.id);
  if (existing) return res.status(409).json({ error: 'Cet email est déjà utilisé' });

  db.prepare('UPDATE users SET email = ?, updated_at = unixepoch() WHERE id = ?').run(newEmail.toLowerCase(), req.user.id);
  res.json({ message: 'Email mis à jour' });
});

// ── Upload avatar ─────────────────────────────────────────────
router.post('/me/avatar', requireAuth, uploadAvatar.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  db.prepare('UPDATE users SET avatar_url = ?, updated_at = unixepoch() WHERE id = ?').run(avatarUrl, req.user.id);
  res.json({ avatarUrl });
});

// ── Annuaire membres ──────────────────────────────────────────
router.get('/annuaire', requireAuth, (req, res) => {
  const { search, sector } = req.query;
  let query = `
    SELECT id, first_name, last_name, bio, sector, business_name,
           website, instagram, linkedin, avatar_color, tier, points, created_at
    FROM users
    WHERE is_active = 1 AND role = 'member'
  `;
  const params = [];

  if (search) {
    query += ` AND (first_name LIKE ? OR last_name LIKE ? OR business_name LIKE ? OR sector LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (sector) {
    query += ` AND sector = ?`;
    params.push(sector);
  }
  query += ` ORDER BY points DESC, created_at ASC`;

  const members = db.prepare(query).all(...params);
  res.json(members.map(m => ({
    id: m.id,
    firstName: m.first_name,
    lastName: m.last_name,
    bio: m.bio,
    sector: m.sector,
    businessName: m.business_name,
    website: m.website,
    instagram: m.instagram,
    linkedin: m.linkedin,
    avatarColor: m.avatar_color,
    tier: m.tier,
    points: m.points,
    initials: (m.first_name[0] || '') + (m.last_name[0] || ''),
    memberSince: m.created_at
  })));
});

// ── Liste membres (admin) ─────────────────────────────────────
router.get('/', requireAdmin, (req, res) => {
  const { search, tier, role, page = 1, limit = 50 } = req.query;
  let query = `SELECT u.*, s.tier as sub_tier, s.status as sub_status FROM users u
    LEFT JOIN subscriptions s ON s.user_id = u.id
    WHERE u.id != ?`;
  const params = [req.user.id];

  if (search) {
    query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (tier) { query += ` AND u.tier = ?`; params.push(tier); }
  if (role) { query += ` AND u.role = ?`; params.push(role); }

  query += ` GROUP BY u.id ORDER BY u.created_at DESC`;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const users = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as n FROM users WHERE id != ?').get(req.user.id).n;

  res.json({
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      phone: u.phone,
      role: u.role,
      tier: u.tier,
      avatarColor: u.avatar_color,
      points: u.points,
      isActive: !!u.is_active,
      lastLogin: u.last_login,
      createdAt: u.created_at
    })),
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  });
});

// ── Obtenir un membre (admin) ─────────────────────────────────
router.get('/:id', requireAdmin, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Membre introuvable' });

  const badges = db.prepare('SELECT badge_id, earned_at FROM user_badges WHERE user_id = ?').all(user.id);
  const subscription = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(user.id);

  res.json({
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    address: user.address,
    city: user.city,
    postalCode: user.postal_code,
    role: user.role,
    tier: user.tier,
    avatarColor: user.avatar_color,
    points: user.points,
    isActive: !!user.is_active,
    lastLogin: user.last_login,
    createdAt: user.created_at,
    badges,
    subscription: subscription || null
  });
});

// ── Mettre à jour un membre (admin) ───────────────────────────
router.put('/:id', requireAdmin, (req, res) => {
  const { tier, role, isActive, points } = req.body;
  const updates = {};
  if (tier !== undefined) updates.tier = tier;
  if (role !== undefined) updates.role = role;
  if (isActive !== undefined) updates.is_active = isActive ? 1 : 0;
  if (points !== undefined) updates.points = points;

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Aucune donnée' });

  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE users SET ${setClause}, updated_at = unixepoch() WHERE id = ?`)
    .run(...Object.values(updates), req.params.id);

  res.json({ message: 'Membre mis à jour' });
});

// ── Supprimer un membre (admin) ───────────────────────────────
router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE users SET is_active = 0, updated_at = unixepoch() WHERE id = ?').run(req.params.id);
  res.json({ message: 'Membre désactivé' });
});

module.exports = router;
