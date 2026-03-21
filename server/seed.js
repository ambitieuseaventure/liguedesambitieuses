/**
 * Script de seeding — Données initiales
 * Exécuter : node server/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

console.log('🌱 Démarrage du seeding...\n');

async function seed() {
  // ── Utilisateurs ─────────────────────────────────────────────
  const users = [
    {
      id: uuidv4(),
      email: 'admin@liguedesambitieuses.fr',
      password: 'Admin2024!',
      firstName: 'Audrey',
      lastName: 'Martin',
      role: 'admin',
      tier: 'visionnaire',
      avatarColor: '#4f85a0'
    },
    {
      id: uuidv4(),
      email: 'sophie.andreu@exemple.fr',
      password: 'Bienvenue2024!',
      firstName: 'Sophie',
      lastName: 'Andreu',
      role: 'member',
      tier: 'visionnaire',
      avatarColor: '#4f85a0',
      businessName: 'Sophie A. Consulting',
      sector: 'Coaching',
      bio: 'Coach business pour entrepreneures ambitieuses.'
    },
    {
      id: uuidv4(),
      email: 'initiee@demo.fr',
      password: 'Bienvenue2024!',
      firstName: 'Léa',
      lastName: 'Fontaine',
      role: 'member',
      tier: 'initiee',
      avatarColor: '#cf6e9e'
    },
    {
      id: uuidv4(),
      email: 'stratege@demo.fr',
      password: 'Bienvenue2024!',
      firstName: 'Emma',
      lastName: 'Rodriguez',
      role: 'member',
      tier: 'stratege',
      avatarColor: '#6b9e7c'
    },
    {
      id: uuidv4(),
      email: 'visionnaire@demo.fr',
      password: 'Bienvenue2024!',
      firstName: 'Clara',
      lastName: 'Dupont',
      role: 'member',
      tier: 'visionnaire',
      avatarColor: '#7b6fa0'
    }
  ];

  for (const u of users) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(u.email);
    if (existing) {
      console.log(`  ↷ Utilisateur déjà existant : ${u.email}`);
      continue;
    }

    const passwordHash = await bcrypt.hash(u.password, 12);
    db.prepare(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, role, tier, avatar_color,
        business_name, sector, bio, is_active, is_verified, points)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)
    `).run(
      u.id, u.email, passwordHash, u.firstName, u.lastName,
      u.role, u.tier, u.avatarColor,
      u.businessName || '', u.sector || '', u.bio || '',
      u.role === 'admin' ? 0 : Math.floor(Math.random() * 500) + 100
    );
    console.log(`  ✓ Créé : ${u.email} (${u.role}/${u.tier})`);
  }

  // ── Formations ───────────────────────────────────────────────
  const formations = [
    {
      id: uuidv4(),
      title: 'Lancer son business en 30 jours',
      theme: '🚀 Entrepreneuriat',
      level: 'Débutant',
      description: 'Tout ce dont tu as besoin pour passer de l\'idée à la première vente en 30 jours.',
      coverEmoji: '🚀',
      freeForInitiee: false,
      unitPrice: 0,
      status: 'publie',
      modules: JSON.stringify([
        { id: 'm1', title: 'Valider ton idée', lessons: ['La méthode des 3 questions', 'Tes 10 premiers clients'] },
        { id: 'm2', title: 'Structurer ton offre', lessons: ['Positionnement prix', 'Créer une offre irrésistible'] },
        { id: 'm3', title: 'Trouver tes premiers clients', lessons: ['Le cercle chaud', 'LinkedIn pour les entrepreneurs'] }
      ])
    },
    {
      id: uuidv4(),
      title: 'Maîtriser sa communication sur les réseaux',
      theme: '📣 Marketing',
      level: 'Intermédiaire',
      description: 'Construis une présence authentique qui attire tes clients idéaux.',
      coverEmoji: '📱',
      freeForInitiee: false,
      unitPrice: 39,
      status: 'publie',
      modules: JSON.stringify([
        { id: 'm1', title: 'Stratégie de contenu', lessons: ['Les 3 piliers du contenu', 'Calendrier éditorial'] },
        { id: 'm2', title: 'Instagram', lessons: ['Stories efficaces', 'Reels engageants'] },
        { id: 'm3', title: 'LinkedIn', lessons: ['Profil optimisé', 'Contenu B2B'] }
      ])
    },
    {
      id: uuidv4(),
      title: 'Gérer ses finances d\'entrepreneur',
      theme: '💰 Finance',
      level: 'Intermédiaire',
      description: 'Comprends ta trésorerie, fixe tes prix et sors-toi un salaire.',
      coverEmoji: '💰',
      freeForInitiee: false,
      unitPrice: 0,
      status: 'publie',
      modules: JSON.stringify([
        { id: 'm1', title: 'Bases comptables', lessons: ['TVA simplifiée', 'Suivi trésorerie'] },
        { id: 'm2', title: 'Fixer ses prix', lessons: ['Méthode coût+marge', 'Prix psychologiques'] },
        { id: 'm3', title: 'Se rémunérer', lessons: ['Statut juridique', 'Optimisation fiscale'] }
      ])
    }
  ];

  for (const f of formations) {
    const existing = db.prepare('SELECT id FROM formations WHERE title = ?').get(f.title);
    if (existing) { console.log(`  ↷ Formation déjà existante : ${f.title}`); continue; }

    db.prepare(`
      INSERT INTO formations (id, title, theme, level, description, cover_emoji, free_for_initiee, unit_price, modules, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(f.id, f.title, f.theme, f.level, f.description, f.coverEmoji, f.freeForInitiee ? 1 : 0, f.unitPrice, f.modules, f.status);
    console.log(`  ✓ Formation : ${f.title}`);
  }

  // ── Masterclasses ─────────────────────────────────────────────
  const masterclasses = [
    {
      id: uuidv4(),
      title: 'Mindset de l\'entrepreneur qui réussit',
      duration: '45 min',
      theme: '🧠 Mindset',
      description: 'Les croyances et habitudes mentales qui font la différence.',
      coverEmoji: '🧠',
      isPremium: true,
      status: 'publie'
    },
    {
      id: uuidv4(),
      title: 'De 0 à 10k€/mois : la méthode',
      duration: '1h20',
      theme: '🚀 Business',
      description: 'Retour d\'expérience et stratégie concrète pour scaler ton business.',
      coverEmoji: '🚀',
      isPremium: true,
      status: 'publie'
    }
  ];

  for (const m of masterclasses) {
    const existing = db.prepare('SELECT id FROM masterclasses WHERE title = ?').get(m.title);
    if (existing) { console.log(`  ↷ Masterclass déjà existante : ${m.title}`); continue; }

    db.prepare(`
      INSERT INTO masterclasses (id, title, duration, theme, description, cover_emoji, is_premium, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(m.id, m.title, m.duration, m.theme, m.description, m.coverEmoji, m.isPremium ? 1 : 0, m.status);
    console.log(`  ✓ Masterclass : ${m.title}`);
  }

  // ── Ressources ───────────────────────────────────────────────
  const resources = [
    {
      id: uuidv4(),
      title: 'Template Business Plan',
      type: 'template',
      theme: '📋 Business',
      description: 'Business plan complet en 12 slides, prêt à personnaliser.',
      coverEmoji: '📋',
      price: 0,
      isFree: true,
      status: 'publie'
    },
    {
      id: uuidv4(),
      title: 'Calculateur de prix',
      type: 'outil',
      theme: '💰 Finance',
      description: 'Calcule tes tarifs en tenant compte de tous tes coûts réels.',
      coverEmoji: '🧮',
      price: 0,
      isFree: true,
      status: 'publie'
    }
  ];

  for (const r of resources) {
    const existing = db.prepare('SELECT id FROM resources WHERE title = ?').get(r.title);
    if (existing) { console.log(`  ↷ Ressource déjà existante : ${r.title}`); continue; }

    db.prepare(`
      INSERT INTO resources (id, title, type, theme, description, cover_emoji, price, is_free, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(r.id, r.title, r.type, r.theme, r.description, r.coverEmoji, r.price, r.isFree ? 1 : 0, r.status);
    console.log(`  ✓ Ressource : ${r.title}`);
  }

  // ── Articles blog ─────────────────────────────────────────────
  const blogPosts = [
    {
      id: uuidv4(),
      title: 'Comment se fixer des objectifs qui tiennent vraiment',
      category: 'business',
      authorName: 'Ana Martin',
      excerpt: 'La méthode SMART c\'est bien, mais voici comment aller plus loin et te fixer des objectifs qui te motivent vraiment.',
      content: '<h2>Le problème avec les objectifs classiques</h2><p>On nous apprend la méthode SMART : Spécifique, Mesurable, Atteignable, Réaliste, Temporel. C\'est un bon cadre, mais il manque souvent le plus important : l\'alignement avec tes valeurs profondes.</p><h2>La méthode des 3 niveaux</h2><p><strong>Niveau 1 : Le résultat</strong> — Ce que tu veux obtenir concrètement.<br><strong>Niveau 2 : Le processus</strong> — Les actions répétables qui mènent au résultat.<br><strong>Niveau 3 : L\'identité</strong> — Qui tu dois devenir pour atteindre cet objectif.</p><blockquote>L\'objectif n\'est pas ce que tu veux faire, c\'est qui tu veux devenir.</blockquote>',
      emoji: '🎯',
      isFeatured: true,
      readTime: 6,
      access: 'public',
      status: 'publie'
    },
    {
      id: uuidv4(),
      title: 'Instagram : publier moins pour gagner plus',
      category: 'marketing',
      authorName: 'Sophie Blanc',
      excerpt: 'Non, tu n\'as pas besoin de poster tous les jours. Voici comment créer un système de contenu efficace.',
      content: '<h2>Le mythe du "faut poster tous les jours"</h2><p>Les algorithmes adorent la régularité, c\'est vrai. Mais entre poster tous les jours du contenu vide et poster deux fois par semaine quelque chose de vraiment utile, le choix est vite fait. La cohérence prime sur la fréquence.</p><h2>Le système des 3 piliers de contenu</h2><h3>Pilier 1 : Éduquer</h3><p>Partage ton expertise. Réponds aux questions que tes clients se posent.</p><h3>Pilier 2 : Inspirer</h3><p>Montre les coulisses, partage tes victoires ET tes galères.</p><h3>Pilier 3 : Convertir</h3><p>Parle de tes offres. Pas de manière agressive — mais clairement.</p>',
      emoji: '📱',
      isFeatured: false,
      readTime: 7,
      access: 'public',
      status: 'publie'
    }
  ];

  for (const p of blogPosts) {
    const existing = db.prepare('SELECT id FROM blog_posts WHERE title = ?').get(p.title);
    if (existing) { console.log(`  ↷ Article déjà existant : ${p.title}`); continue; }

    const publishedAt = Math.floor(Date.now() / 1000);
    db.prepare(`
      INSERT INTO blog_posts (id, title, category, author_name, excerpt, content, emoji, is_featured, read_time, access, status, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(p.id, p.title, p.category, p.authorName, p.excerpt, p.content, p.emoji,
      p.isFeatured ? 1 : 0, p.readTime, p.access, p.status, publishedAt);
    console.log(`  ✓ Article : ${p.title}`);
  }

  // ── Événements ───────────────────────────────────────────────
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const events = [
    {
      id: uuidv4(),
      title: 'Q&R Live — Stratégie business',
      type: 'qr',
      date: nextWeek.toISOString().split('T')[0],
      startTime: '18:00',
      endTime: '19:30',
      description: 'Pose toutes tes questions business en direct avec Audrey.',
      host: 'Audrey Martin',
      tierRequired: 'initiee'
    },
    {
      id: uuidv4(),
      title: 'Masterclass : Pricing & valeur',
      type: 'masterclass',
      date: nextMonth.toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '12:00',
      description: 'Comment fixer tes prix et défendre ta valeur face aux clients.',
      host: 'Ana Martin',
      tierRequired: 'stratege'
    }
  ];

  for (const e of events) {
    const existing = db.prepare('SELECT id FROM events WHERE title = ?').get(e.title);
    if (existing) { console.log(`  ↷ Événement déjà existant : ${e.title}`); continue; }

    db.prepare(`
      INSERT INTO events (id, title, type, date, start_time, end_time, description, host, tier_required)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e.id, e.title, e.type, e.date, e.startTime, e.endTime, e.description, e.host, e.tierRequired);
    console.log(`  ✓ Événement : ${e.title}`);
  }

  console.log('\n✅ Seeding terminé !\n');
  console.log('Comptes de test :');
  console.log('  Admin       : admin@liguedesambitieuses.fr / Admin2024!');
  console.log('  Sophie      : sophie.andreu@exemple.fr / Bienvenue2024!');
  console.log('  Initiée     : initiee@demo.fr / Bienvenue2024!');
  console.log('  Stratège    : stratege@demo.fr / Bienvenue2024!');
  console.log('  Visionnaire : visionnaire@demo.fr / Bienvenue2024!\n');
}

seed().catch(err => {
  console.error('Erreur seeding:', err);
  process.exit(1);
});
