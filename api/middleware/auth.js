
/**
 * Middleware d'authentification JWT
 */

const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_changez_moi_en_production';

/**
 * Middleware : vérifie le token JWT et attache l'utilisateur à req.user
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou invalide' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur introuvable ou désactivé' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token expiré ou invalide' });
  }
}

/**
 * Middleware : vérifie que l'utilisateur est admin
 */
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }
    next();
  });
}

/**
 * Middleware : vérifie le niveau d'abonnement minimum
 */
function requireTier(minTier) {
  const tierOrder = { initiee: 0, stratege: 1, visionnaire: 2 };
  return (req, res, next) => {
    requireAuth(req, res, () => {
      const userLevel = tierOrder[req.user.tier] ?? 0;
      const required = tierOrder[minTier] ?? 0;
      if (userLevel < required) {
        return res.status(403).json({
          error: `Cette fonctionnalité nécessite l'abonnement ${minTier}`
        });
      }
      next();
    });
  };
}

/**
 * Middleware optionnel : attache l'utilisateur si connecté, sinon null
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(payload.userId) || null;
  } catch {
    req.user = null;
  }
  next();
}

/**
 * Génère un token JWT pour un utilisateur
 */
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

module.exports = { requireAuth, requireAdmin, requireTier, optionalAuth, generateToken };
