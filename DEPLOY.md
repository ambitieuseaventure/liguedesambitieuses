# Guide de déploiement — La Ligue des Ambitieuses

## Architecture réelle du projet
- Frontend: `app/index.html` (HTML/CSS/JS inline, application mono-fichier côté client)
- Backend: `api/index.js` (Express + routes `/api/*`)
- Base de données: SQLite (`data/ligue.db` via `better-sqlite3`)

Important: il faut toujours lancer le backend (`npm start`). Ouvrir `app/index.html` directement dans le navigateur ne suffit pas.

## Prérequis
- Node.js >= 18.0.0
- npm >= 9.0.0

Note compatibilité: le projet est actuellement compatible avec Node 22 (dépendance `better-sqlite3` mise à jour).

## Installation locale

### Windows (PowerShell)
```powershell
# 1. Installer les dépendances
npm install

# 2. Copier la config exemple
Copy-Item .env.example .env

# 3. Éditer .env (VS Code)
code .env

# 4. Initialiser la base et les données de test
npm run seed

# 5. Démarrer le serveur
npm start
# ou en dev:
npm run dev
```

### macOS/Linux
```bash
# 1. Installer les dépendances
npm install

# 2. Copier la config exemple
cp .env.example .env

# 3. Éditer .env
nano .env

# 4. Initialiser la base et les données de test
npm run seed

# 5. Démarrer le serveur
npm start
# ou en dev:
npm run dev
```

## URL locale
L'application est accessible sur `http://localhost:<PORT>` où `<PORT>` vient de `.env`.

Exemple: si `.env` contient `PORT=3003`, l'URL est `http://localhost:3003`.

## Comptes de test (après seed)

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | admin@liguedesambitieuses.fr | Admin2024! |
| Membre Initiée | initiee@demo.fr | Bienvenue2024! |
| Membre Stratège | stratege@demo.fr | Bienvenue2024! |
| Membre Visionnaire | visionnaire@demo.fr | Bienvenue2024! |

## Configuration `.env` recommandée en local
```env
NODE_ENV=development
PORT=3003
SITE_URL=http://localhost:3003
DB_PATH=./data/ligue.db
JWT_SECRET=change_me
```

Important: `SITE_URL` doit correspondre au port réel utilisé (`PORT`).

## Configuration API tierces

### SMTP (emails serveur)
Option recommandée: Brevo.

Variables requises:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `EMAIL_FROM_NAME`

### Stripe
Variables principales:
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_*`

Webhook local:
```bash
stripe listen --forward-to localhost:<PORT>/api/payment/stripe/webhook
```

### PayPal
Variables:
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_MODE` (`sandbox` ou `live`)

## Déploiement production

### Hostinger VPS (recommandé pour ton contexte)
Guide pas-à-pas prêt à exécuter:
- `deploy/hostinger/HOSTINGER_VPS_DEPLOY.md`
- Fichier Nginx fourni: `deploy/hostinger/nginx-ligue.conf`
- Exemple env prod: `deploy/hostinger/.env.production.example`

### Option 1 — Railway
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

Configurer les variables d'environnement dans le dashboard Railway.

### Option 2 — Render
1. Créer un service Web depuis le repo GitHub.
2. Build Command: `npm install && npm run seed`
3. Start Command: `npm start`
4. Ajouter toutes les variables d'environnement.

### Option 3 — VPS + PM2
```bash
git clone https://github.com/votre-repo/ligue-des-ambitieuses.git
cd ligue-des-ambitieuses
npm install
npm run seed

npm install -g pm2
pm2 start api/index.js --name ligue
pm2 save
pm2 startup
```

## Reverse proxy Nginx
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

    location /uploads/ {
        alias /chemin/vers/ligue-des-ambitieuses/uploads/;
        expires 30d;
    }
}
```

## Variables d'environnement minimales en production
```env
NODE_ENV=production
PORT=3000
SITE_URL=https://votredomaine.fr
DB_PATH=/data/ligue.db
JWT_SECRET=cle_longue_et_aleatoire

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=votre@email.fr
SMTP_PASS=votre_cle_api

STRIPE_SECRET_KEY=sk_live_XXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXX
```

## Dépannage rapide

### 1) "Je vois juste le design, rien ne répond"
- Vérifier que tu utilises bien `http://localhost:<PORT>` (pas `file://...`).
- Vérifier que le serveur est lancé (`npm start`).
- Faire un hard refresh: `Ctrl+F5`.
- Vérifier la console navigateur (`F12`) pour les erreurs JS.

### 2) Erreur `EADDRINUSE`
Le port est déjà occupé.

PowerShell:
```powershell
Get-NetTCPConnection -LocalPort 3003 -State Listen
Stop-Process -Id <PID> -Force
```

Puis relancer `npm start`.

### 3) API non joignable
- Tester: `http://localhost:<PORT>/api/auth/login`
- Vérifier `PORT` dans `.env` et l'URL ouverte dans le navigateur.

## Sauvegarde
La base est `data/ligue.db`.

Exemple Linux cron:
```bash
0 2 * * * cp /chemin/vers/data/ligue.db /backups/ligue_$(date +\%Y\%m\%d).db
```
