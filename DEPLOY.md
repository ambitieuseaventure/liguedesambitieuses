# Guide de déploiement — La Ligue des Ambitieuses

## Prérequis
- Node.js >= 18.0.0
- npm >= 9.0.0

## Installation locale

```bash
# 1. Installer les dépendances
npm install

# 2. Copier le fichier de configuration
cp .env.example .env

# 3. Éditer .env avec vos valeurs
nano .env

# 4. Initialiser la base de données et les données de test
npm run seed

# 5. Démarrer le serveur
npm start
# ou en développement avec rechargement automatique :
npm run dev
```

L'application sera accessible sur http://localhost:3000

## Comptes de test (après seed)

| Rôle        | Email                              | Mot de passe    |
|-------------|-----------------------------------|-----------------|
| Admin       | admin@liguedesambitieuses.fr      | Admin2024!      |
| Membre Initiée | initiee@demo.fr               | Bienvenue2024!  |
| Membre Stratège | stratege@demo.fr             | Bienvenue2024!  |
| Membre Visionnaire | visionnaire@demo.fr       | Bienvenue2024!  |

## Configuration des API tierces

### MailJS (emails depuis le frontend)
1. Créer un compte sur [emailjs.com](https://emailjs.com)
2. Créer un service email
3. Créer un template
4. Remplir dans `.env` : `MAILJS_SERVICE_ID`, `MAILJS_TEMPLATE_ID`, `MAILJS_PUBLIC_KEY`

### Emails serveur (SMTP)
Option recommandée : [Brevo (ex-SendinBlue)](https://brevo.com)
1. Créer un compte gratuit (300 emails/jour offerts)
2. Aller dans SMTP & API → SMTP
3. Copier les identifiants dans `.env`

### Stripe (paiements)
1. Créer un compte sur [stripe.com](https://stripe.com)
2. Récupérer les clés dans Dashboard → Développeurs → Clés API
3. Créer les produits/prix pour chaque abonnement
4. Remplir dans `.env` les `STRIPE_*` variables
5. Configurer le webhook : `stripe listen --forward-to localhost:3000/api/payment/stripe/webhook`

### PayPal (paiements alternatifs)
1. Créer une app sur [developer.paypal.com](https://developer.paypal.com)
2. Récupérer Client ID et Client Secret
3. Remplir dans `.env` les `PAYPAL_*` variables

## Déploiement en production

### Option 1 : Railway (recommandé, gratuit pour démarrer)
```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter et déployer
railway login
railway init
railway up
```
Configurer les variables d'environnement dans le dashboard Railway.

### Option 2 : Render
1. Créer un compte sur [render.com](https://render.com)
2. Nouveau service Web → connecter GitHub
3. Build Command : `npm install && npm run seed`
4. Start Command : `npm start`
5. Ajouter les variables d'environnement dans le dashboard

### Option 3 : VPS (DigitalOcean, OVH, etc.)
```bash
# Sur le serveur
git clone https://github.com/votre-repo/ligue-des-ambitieuses.git
cd ligue-des-ambitieuses
npm install
npm run seed
npm start

# Avec PM2 pour la production
npm install -g pm2
pm2 start server/index.js --name ligue
pm2 save
pm2 startup
```

### Nginx (reverse proxy)
```nginx
server {
    listen 80;
    server_name votredomaine.fr;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Fichiers uploadés
    location /uploads/ {
        alias /chemin/vers/ligue-des-ambitieuses/uploads/;
        expires 30d;
    }
}
```

## Variables d'environnement de production

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=générer_avec_openssl_rand_hex_64
SITE_URL=https://votredomaine.fr
DB_PATH=/data/ligue.db

# Email
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=votre@email.fr
SMTP_PASS=votre_cle_api

# Stripe
STRIPE_SECRET_KEY=sk_live_XXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXX
```

## Sauvegarde

La base de données est dans `data/ligue.db`. Sauvegarder régulièrement :
```bash
# Sauvegarde quotidienne (crontab)
0 2 * * * cp /chemin/vers/data/ligue.db /backups/ligue_$(date +\%Y\%m\%d).db
```
