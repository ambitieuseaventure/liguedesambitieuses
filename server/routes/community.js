/**
 * Routes communauté
 * GET    /api/community/posts
 * POST   /api/community/posts
 * PUT    /api/community/posts/:id
 * DELETE /api/community/posts/:id
 * POST   /api/community/posts/:id/like
 * GET    /api/community/posts/:id/comments
 * POST   /api/community/posts/:id/comments
 * DELETE /api/community/comments/:id
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Helper : enrichir un post avec les infos auteur
function enrichPost(post, currentUserId) {
  const author = db.prepare('SELECT id, first_name, last_name, avatar_color, tier, business_name FROM users WHERE id = ?').get(post.user_id);
  const likesCount = db.prepare('SELECT COUNT(*) as n FROM community_likes WHERE post_id = ?').get(post.id).n;
  const commentsCount = db.prepare('SELECT COUNT(*) as n FROM community_comments WHERE post_id = ? AND is_deleted = 0').get(post.id).n;
  const isLiked = currentUserId
    ? !!db.prepare('SELECT id FROM community_likes WHERE post_id = ? AND user_id = ?').get(post.id, currentUserId)
    : false;

  return {
    id: post.id,
    content: post.content,
    images: JSON.parse(post.images || '[]'),
    isPinned: !!post.is_pinned,
    author: author ? {
      id: author.id,
      firstName: author.first_name,
      lastName: author.last_name,
      initials: (author.first_name[0] || '') + (author.last_name[0] || ''),
      avatarColor: author.avatar_color,
      tier: author.tier,
      businessName: author.business_name
    } : null,
    likesCount,
    commentsCount,
    isLiked,
    createdAt: post.created_at,
    updatedAt: post.updated_at
  };
}

// ── Liste des posts ───────────────────────────────────────────
router.get('/posts', requireAuth, (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const posts = db.prepare(`
    SELECT * FROM community_posts
    WHERE is_deleted = 0
    ORDER BY is_pinned DESC, created_at DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(limit), offset);

  const total = db.prepare('SELECT COUNT(*) as n FROM community_posts WHERE is_deleted = 0').get().n;

  res.json({
    posts: posts.map(p => enrichPost(p, req.user.id)),
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  });
});

// ── Créer un post ─────────────────────────────────────────────
router.post('/posts', requireAuth, (req, res) => {
  const { content, images = [] } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Contenu requis' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO community_posts (id, user_id, content, images)
    VALUES (?, ?, ?, ?)
  `).run(id, req.user.id, content.trim(), JSON.stringify(images));

  // Ajouter des points
  db.prepare('UPDATE users SET points = points + 5 WHERE id = ?').run(req.user.id);

  const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(id);
  res.status(201).json(enrichPost(post, req.user.id));
});

// ── Modifier un post ──────────────────────────────────────────
router.put('/posts/:id', requireAuth, (req, res) => {
  const post = db.prepare('SELECT * FROM community_posts WHERE id = ? AND is_deleted = 0').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post introuvable' });
  if (post.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Contenu requis' });

  db.prepare('UPDATE community_posts SET content = ?, updated_at = unixepoch() WHERE id = ?')
    .run(content.trim(), req.params.id);

  const updated = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id);
  res.json(enrichPost(updated, req.user.id));
});

// ── Supprimer un post ─────────────────────────────────────────
router.delete('/posts/:id', requireAuth, (req, res) => {
  const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post introuvable' });
  if (post.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  db.prepare('UPDATE community_posts SET is_deleted = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Post supprimé' });
});

// ── Épingler/dépingler (admin) ────────────────────────────────
router.post('/posts/:id/pin', requireAdmin, (req, res) => {
  const post = db.prepare('SELECT * FROM community_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post introuvable' });

  db.prepare('UPDATE community_posts SET is_pinned = ? WHERE id = ?').run(post.is_pinned ? 0 : 1, req.params.id);
  res.json({ isPinned: !post.is_pinned });
});

// ── Liker/unliker un post ─────────────────────────────────────
router.post('/posts/:id/like', requireAuth, (req, res) => {
  const post = db.prepare('SELECT id FROM community_posts WHERE id = ? AND is_deleted = 0').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post introuvable' });

  const existing = db.prepare('SELECT id FROM community_likes WHERE post_id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (existing) {
    db.prepare('DELETE FROM community_likes WHERE post_id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);
  } else {
    db.prepare('INSERT INTO community_likes (id, post_id, user_id) VALUES (?, ?, ?)')
      .run(uuidv4(), req.params.id, req.user.id);
  }

  const count = db.prepare('SELECT COUNT(*) as n FROM community_likes WHERE post_id = ?').get(req.params.id).n;
  res.json({ liked: !existing, likesCount: count });
});

// ── Commentaires d'un post ────────────────────────────────────
router.get('/posts/:id/comments', requireAuth, (req, res) => {
  const comments = db.prepare(`
    SELECT c.*, u.first_name, u.last_name, u.avatar_color, u.tier
    FROM community_comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ? AND c.is_deleted = 0
    ORDER BY c.created_at ASC
  `).all(req.params.id);

  res.json(comments.map(c => ({
    id: c.id,
    content: c.content,
    author: {
      id: c.user_id,
      firstName: c.first_name,
      lastName: c.last_name,
      initials: (c.first_name[0] || '') + (c.last_name[0] || ''),
      avatarColor: c.avatar_color,
      tier: c.tier
    },
    createdAt: c.created_at
  })));
});

// ── Ajouter un commentaire ────────────────────────────────────
router.post('/posts/:id/comments', requireAuth, (req, res) => {
  const post = db.prepare('SELECT id FROM community_posts WHERE id = ? AND is_deleted = 0').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post introuvable' });

  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Contenu requis' });

  const id = uuidv4();
  db.prepare('INSERT INTO community_comments (id, post_id, user_id, content) VALUES (?, ?, ?, ?)')
    .run(id, req.params.id, req.user.id, content.trim());

  // Ajouter des points au commentateur
  db.prepare('UPDATE users SET points = points + 2 WHERE id = ?').run(req.user.id);

  const comment = db.prepare(`
    SELECT c.*, u.first_name, u.last_name, u.avatar_color, u.tier
    FROM community_comments c JOIN users u ON u.id = c.user_id
    WHERE c.id = ?
  `).get(id);

  res.status(201).json({
    id: comment.id,
    content: comment.content,
    author: {
      id: comment.user_id,
      firstName: comment.first_name,
      lastName: comment.last_name,
      initials: (comment.first_name[0] || '') + (comment.last_name[0] || ''),
      avatarColor: comment.avatar_color,
      tier: comment.tier
    },
    createdAt: comment.created_at
  });
});

// ── Supprimer un commentaire ──────────────────────────────────
router.delete('/comments/:id', requireAuth, (req, res) => {
  const comment = db.prepare('SELECT * FROM community_comments WHERE id = ?').get(req.params.id);
  if (!comment) return res.status(404).json({ error: 'Commentaire introuvable' });
  if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  db.prepare('UPDATE community_comments SET is_deleted = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Commentaire supprimé' });
});

module.exports = router;
