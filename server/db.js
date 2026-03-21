/**
 * Base de données SQLite — La Ligue des Ambitieuses
 * Initialisation et schéma complet
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'ligue.db');

// Créer le répertoire si besoin
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Activer les foreign keys et WAL pour les performances
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ══════════════════════════════════════════════════════════════
// SCHÉMA
// ══════════════════════════════════════════════════════════════

db.exec(`

-- Utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  first_name      TEXT NOT NULL DEFAULT '',
  last_name       TEXT NOT NULL DEFAULT '',
  phone           TEXT DEFAULT '',
  address         TEXT DEFAULT '',
  city            TEXT DEFAULT '',
  postal_code     TEXT DEFAULT '',
  date_naissance  TEXT DEFAULT '',
  bio             TEXT DEFAULT '',
  sector          TEXT DEFAULT '',
  business_name   TEXT DEFAULT '',
  website         TEXT DEFAULT '',
  instagram       TEXT DEFAULT '',
  linkedin        TEXT DEFAULT '',
  role            TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','admin','team')),
  tier            TEXT NOT NULL DEFAULT 'initiee' CHECK(tier IN ('initiee','stratege','visionnaire')),
  avatar_color    TEXT DEFAULT '#4f85a0',
  points          INTEGER DEFAULT 0,
  is_active       INTEGER DEFAULT 1,
  is_verified     INTEGER DEFAULT 0,
  reset_token     TEXT,
  reset_expires   INTEGER,
  verify_token    TEXT,
  last_login      INTEGER,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at      INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Badges des membres
CREATE TABLE IF NOT EXISTS user_badges (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id   TEXT NOT NULL,
  earned_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id, badge_id)
);

-- Formations
CREATE TABLE IF NOT EXISTS formations (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  theme            TEXT DEFAULT '',
  level            TEXT DEFAULT 'Débutant',
  description      TEXT DEFAULT '',
  cover_emoji      TEXT DEFAULT '📚',
  cover_image      TEXT DEFAULT '',
  status           TEXT DEFAULT 'brouillon' CHECK(status IN ('brouillon','publie','archive')),
  free_for_initiee INTEGER DEFAULT 0,
  unit_price       REAL DEFAULT 0,
  modules          TEXT DEFAULT '[]',
  created_at       INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at       INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Progression des formations par membre
CREATE TABLE IF NOT EXISTS formation_progress (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  formation_id TEXT NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  progress     INTEGER DEFAULT 0,
  completed    INTEGER DEFAULT 0,
  data         TEXT DEFAULT '{}',
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id, formation_id)
);

-- Achats de formations (Initiées)
CREATE TABLE IF NOT EXISTS formation_purchases (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  formation_id TEXT NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  amount       REAL DEFAULT 0,
  purchased_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id, formation_id)
);

-- Avis sur les formations
CREATE TABLE IF NOT EXISTS formation_reviews (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  formation_id TEXT NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  rating       INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment      TEXT DEFAULT '',
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id, formation_id)
);

-- Masterclasses
CREATE TABLE IF NOT EXISTS masterclasses (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  duration    TEXT DEFAULT '',
  theme       TEXT DEFAULT '',
  description TEXT DEFAULT '',
  cover_emoji TEXT DEFAULT '🎬',
  cover_image TEXT DEFAULT '',
  video_url   TEXT DEFAULT '',
  status      TEXT DEFAULT 'brouillon' CHECK(status IN ('brouillon','publie','archive')),
  is_premium  INTEGER DEFAULT 1,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Vues des masterclasses
CREATE TABLE IF NOT EXISTS masterclass_views (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  masterclass_id  TEXT NOT NULL REFERENCES masterclasses(id) ON DELETE CASCADE,
  viewed_at       INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id, masterclass_id)
);

-- Ressources
CREATE TABLE IF NOT EXISTS resources (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  type        TEXT DEFAULT 'guide',
  theme       TEXT DEFAULT '',
  description TEXT DEFAULT '',
  cover_emoji TEXT DEFAULT '📄',
  cover_image TEXT DEFAULT '',
  file_url    TEXT DEFAULT '',
  price       REAL DEFAULT 0,
  is_free     INTEGER DEFAULT 0,
  status      TEXT DEFAULT 'brouillon' CHECK(status IN ('brouillon','publie','archive')),
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Notes sur les ressources
CREATE TABLE IF NOT EXISTS resource_notes (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  retains     TEXT DEFAULT '',
  apply       TEXT DEFAULT '',
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id, resource_id)
);

-- Achats de ressources
CREATE TABLE IF NOT EXISTS resource_purchases (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  amount      REAL DEFAULT 0,
  purchased_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id, resource_id)
);

-- Bibliothèque (eBooks/produits à vendre)
CREATE TABLE IF NOT EXISTS library_items (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  type        TEXT DEFAULT 'ebook',
  description TEXT DEFAULT '',
  cover_emoji TEXT DEFAULT '📖',
  cover_image TEXT DEFAULT '',
  file_url    TEXT DEFAULT '',
  price       REAL NOT NULL DEFAULT 0,
  status      TEXT DEFAULT 'brouillon' CHECK(status IN ('brouillon','publie','archive')),
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Achats bibliothèque
CREATE TABLE IF NOT EXISTS library_purchases (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL REFERENCES library_items(id) ON DELETE CASCADE,
  amount      REAL DEFAULT 0,
  purchased_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id, item_id)
);

-- Articles de blog
CREATE TABLE IF NOT EXISTS blog_posts (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  category     TEXT DEFAULT 'business',
  author_name  TEXT DEFAULT 'La Rédaction',
  excerpt      TEXT DEFAULT '',
  content      TEXT DEFAULT '',
  emoji        TEXT DEFAULT '✍️',
  cover_image  TEXT DEFAULT '',
  read_time    INTEGER DEFAULT 5,
  status       TEXT DEFAULT 'brouillon' CHECK(status IN ('brouillon','publie','archive')),
  access       TEXT DEFAULT 'public' CHECK(access IN ('public','members')),
  is_featured  INTEGER DEFAULT 0,
  published_at INTEGER,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Posts communauté
CREATE TABLE IF NOT EXISTS community_posts (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  images     TEXT DEFAULT '[]',
  is_pinned  INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Commentaires
CREATE TABLE IF NOT EXISTS community_comments (
  id         TEXT PRIMARY KEY,
  post_id    TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  is_deleted INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Likes
CREATE TABLE IF NOT EXISTS community_likes (
  id         TEXT PRIMARY KEY,
  post_id    TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(post_id, user_id)
);

-- Messages privés
CREATE TABLE IF NOT EXISTS messages (
  id          TEXT PRIMARY KEY,
  sender_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_read     INTEGER DEFAULT 0,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Événements
CREATE TABLE IF NOT EXISTS events (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  type          TEXT DEFAULT 'evenement' CHECK(type IN ('evenement','coaching','qr','deadline','masterclass','autre')),
  date          TEXT NOT NULL,
  start_time    TEXT DEFAULT '',
  end_time      TEXT DEFAULT '',
  description   TEXT DEFAULT '',
  host          TEXT DEFAULT '',
  location      TEXT DEFAULT '',
  video_link    TEXT DEFAULT '',
  tier_required TEXT DEFAULT 'initiee' CHECK(tier_required IN ('initiee','stratege','visionnaire')),
  is_member_event INTEGER DEFAULT 1,
  max_attendees   INTEGER DEFAULT 0,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Inscriptions événements
CREATE TABLE IF NOT EXISTS event_registrations (
  id         TEXT PRIMARY KEY,
  event_id   TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registered_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(event_id, user_id)
);

-- Sessions Q&R
CREATE TABLE IF NOT EXISTS qr_sessions (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  date       TEXT DEFAULT '',
  time       TEXT DEFAULT '',
  host       TEXT DEFAULT '',
  status     TEXT DEFAULT 'a-venir' CHECK(status IN ('a-venir','en-cours','termine')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Questions Q&R
CREATE TABLE IF NOT EXISTS qr_questions (
  id         TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES qr_sessions(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  is_private INTEGER DEFAULT 0,
  is_answered INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Tickets Hotline
CREATE TABLE IF NOT EXISTS hotline_tickets (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme      TEXT NOT NULL,
  summary    TEXT DEFAULT '',
  status     TEXT DEFAULT 'ouvert' CHECK(status IN ('ouvert','en-cours','resolu','ferme')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Messages Hotline
CREATE TABLE IF NOT EXISTS hotline_messages (
  id          TEXT PRIMARY KEY,
  ticket_id   TEXT NOT NULL REFERENCES hotline_tickets(id) ON DELETE CASCADE,
  author_role TEXT NOT NULL CHECK(author_role IN ('member','team')),
  author_name TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Réservations coaching
CREATE TABLE IF NOT EXISTS coaching_bookings (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,
  time       TEXT NOT NULL,
  type       TEXT DEFAULT 'individuel',
  notes      TEXT DEFAULT '',
  status     TEXT DEFAULT 'en-attente' CHECK(status IN ('en-attente','confirme','annule','termine')),
  coach_name TEXT DEFAULT '',
  meeting_link TEXT DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Carnets de bord (journal)
CREATE TABLE IF NOT EXISTS journal_entries (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,
  mood       TEXT DEFAULT '',
  content    TEXT DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id, date)
);

-- Actions du carnet
CREATE TABLE IF NOT EXISTS notebook_actions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_done     INTEGER DEFAULT 0,
  priority    TEXT DEFAULT 'normale',
  due_date    TEXT DEFAULT '',
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Partenaires buddy
CREATE TABLE IF NOT EXISTS buddy_pairs (
  id         TEXT PRIMARY KEY,
  user_id_1  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id_2  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id_1, user_id_2)
);

-- Abonnements / paiements
CREATE TABLE IF NOT EXISTS subscriptions (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier            TEXT NOT NULL CHECK(tier IN ('initiee','stratege','visionnaire')),
  billing_cycle   TEXT DEFAULT 'monthly' CHECK(billing_cycle IN ('monthly','yearly')),
  status          TEXT DEFAULT 'active' CHECK(status IN ('active','cancelled','past_due','trialing')),
  stripe_sub_id   TEXT DEFAULT '',
  paypal_sub_id   TEXT DEFAULT '',
  current_period_start INTEGER,
  current_period_end   INTEGER,
  cancel_at_period_end INTEGER DEFAULT 0,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at      INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  amount          REAL NOT NULL,
  currency        TEXT DEFAULT 'EUR',
  status          TEXT DEFAULT 'pending' CHECK(status IN ('pending','succeeded','failed','refunded')),
  description     TEXT DEFAULT '',
  stripe_payment_intent TEXT DEFAULT '',
  paypal_order_id TEXT DEFAULT '',
  metadata        TEXT DEFAULT '{}',
  created_at      INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Messages de contact
CREATE TABLE IF NOT EXISTS contact_messages (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT DEFAULT '',
  message    TEXT NOT NULL,
  status     TEXT DEFAULT 'nouveau' CHECK(status IN ('nouveau','lu','traite')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT DEFAULT '',
  link       TEXT DEFAULT '',
  is_read    INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Annonces admin
CREATE TABLE IF NOT EXISTS announcements (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  type        TEXT DEFAULT 'info' CHECK(type IN ('info','success','warning','urgent')),
  target_tier TEXT DEFAULT 'all',
  is_active   INTEGER DEFAULT 1,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at  INTEGER
);

-- CRM Prospects (admin)
CREATE TABLE IF NOT EXISTS crm_prospects (
  id            TEXT PRIMARY KEY,
  first_name    TEXT DEFAULT '',
  last_name     TEXT DEFAULT '',
  email         TEXT NOT NULL,
  phone         TEXT DEFAULT '',
  source        TEXT DEFAULT '',
  status        TEXT DEFAULT 'nouveau' CHECK(status IN ('nouveau','contacte','interesse','converti','perdu')),
  notes         TEXT DEFAULT '',
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Campagnes email (admin)
CREATE TABLE IF NOT EXISTS email_campaigns (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  subject     TEXT NOT NULL,
  content     TEXT DEFAULT '',
  target      TEXT DEFAULT 'all',
  status      TEXT DEFAULT 'brouillon' CHECK(status IN ('brouillon','planifie','envoye')),
  sent_at     INTEGER,
  scheduled_at INTEGER,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_community_posts_user ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_hotline_tickets_user ON hotline_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_journal_user_date ON journal_entries(user_id, date);
`);

module.exports = db;
