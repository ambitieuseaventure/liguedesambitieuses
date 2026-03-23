# Deploy sur VPS Hostinger

Ce guide deploye l'application Node.js avec PM2 + Nginx + SSL Let's Encrypt.

## 1) Connexion au VPS

```bash
ssh root@IP_DU_VPS
```

## 2) Installer les prerequis

```bash
apt update && apt upgrade -y
apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm i -g pm2
```

Verifier:

```bash
node -v
npm -v
pm2 -v
```

## 3) Recuperer le projet

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/ambitieuseaventure/liguedesambitieuses.git
cd liguedesambitieuses
npm install
```

## 4) Configurer l'environnement production

```bash
cp deploy/hostinger/.env.production.example .env
nano .env
```

Variables critiques:
- `SITE_URL=https://votre-domaine.fr`
- `JWT_SECRET` (longue valeur aleatoire)
- `SMTP_*`
- `STRIPE_*`
- `PAYPAL_*`

## 5) Initialiser la base

```bash
npm run seed
```

## 6) Lancer l'app avec PM2

Creer le dossier de logs:

```bash
mkdir -p /var/log/ligue-des-ambitieuses
```

Lancer:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Verifier:

```bash
pm2 status
pm2 logs ligue-des-ambitieuses --lines 100
```

## 7) Configurer Nginx

Copier le fichier fourni:

```bash
cp deploy/hostinger/nginx-ligue.conf /etc/nginx/sites-available/ligue-des-ambitieuses
ln -s /etc/nginx/sites-available/ligue-des-ambitieuses /etc/nginx/sites-enabled/ligue-des-ambitieuses
nginx -t
systemctl reload nginx
```

Avant SSL, verifier en HTTP:
- `http://votre-domaine.fr`

## 8) Activer HTTPS (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d votre-domaine.fr -d www.votre-domaine.fr
```

Verifier le renouvellement automatique:

```bash
systemctl status certbot.timer
```

## 9) Commandes utiles exploitation

Redemarrer app:

```bash
cd /var/www/liguedesambitieuses
pm2 restart ligue-des-ambitieuses
```

Redeploiement apres git pull:

```bash
cd /var/www/liguedesambitieuses
git pull
npm install
npm run seed
pm2 restart ligue-des-ambitieuses
```

Verifier Nginx:

```bash
nginx -t
systemctl status nginx
```

## 10) Pare-feu (optionnel mais recommande)

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

## Depannage rapide

`502 Bad Gateway`:
- verifier `pm2 status`
- verifier `pm2 logs ligue-des-ambitieuses`
- verifier que l'app ecoute bien sur `PORT=3000`

`EADDRINUSE`:

```bash
ss -ltnp | grep 3000
```

Erreur CORS/session:
- verifier que `SITE_URL` correspond exactement au domaine public HTTPS.
