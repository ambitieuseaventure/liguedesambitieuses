/**
 * Routes paiement — Stripe & PayPal
 *
 * Ces routes sont prêtes à être connectées.
 * Il suffit d'ajouter les clés dans .env
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// ── Stripe ────────────────────────────────────────────────────

/**
 * Créer une session de paiement Stripe
 * POST /api/payment/stripe/checkout
 */
router.post('/stripe/checkout', requireAuth, async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe non configuré — ajouter STRIPE_SECRET_KEY dans .env' });
  }

  try {
    const Stripe = require('stripe');
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const { tier, billingCycle } = req.body;
    if (!tier || !billingCycle) return res.status(400).json({ error: 'Tier et cycle de facturation requis' });

    const priceKey = `STRIPE_PRICE_${tier.toUpperCase()}_${billingCycle.toUpperCase()}`;
    const priceId = process.env[priceKey];
    if (!priceId) {
      return res.status(400).json({ error: `Prix Stripe non configuré pour ${tier}/${billingCycle}` });
    }

    const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: req.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?payment=cancelled`,
      metadata: {
        userId: req.user.id,
        tier,
        billingCycle
      }
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Webhook Stripe
 * POST /api/payment/stripe/webhook
 */
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe non configuré' });
  }

  const Stripe = require('stripe');
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature invalide: ${err.message}` });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { userId, tier, billingCycle } = session.metadata;

      if (userId && tier) {
        // Mettre à jour le tier
        db.prepare('UPDATE users SET tier = ?, updated_at = unixepoch() WHERE id = ?').run(tier, userId);

        // Enregistrer l'abonnement
        const existing = db.prepare('SELECT id FROM subscriptions WHERE user_id = ?').get(userId);
        if (existing) {
          db.prepare('UPDATE subscriptions SET tier=?, billing_cycle=?, status=?, stripe_sub_id=?, updated_at=unixepoch() WHERE id=?')
            .run(tier, billingCycle, 'active', session.subscription || '', existing.id);
        } else {
          db.prepare('INSERT INTO subscriptions (id, user_id, tier, billing_cycle, status, stripe_sub_id) VALUES (?, ?, ?, ?, ?, ?)')
            .run(uuidv4(), userId, tier, billingCycle, 'active', session.subscription || '');
        }

        // Enregistrer la transaction
        db.prepare(`
          INSERT INTO transactions (id, user_id, type, amount, status, description, stripe_payment_intent)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), userId, 'subscription', session.amount_total / 100, 'succeeded',
          `Abonnement ${tier} (${billingCycle})`, session.payment_intent || '');
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      db.prepare('UPDATE subscriptions SET status = ?, updated_at = unixepoch() WHERE stripe_sub_id = ?')
        .run('cancelled', sub.id);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      db.prepare('UPDATE subscriptions SET status = ?, updated_at = unixepoch() WHERE stripe_sub_id = ?')
        .run('past_due', invoice.subscription);
      break;
    }
  }

  res.json({ received: true });
});

// ── Achat one-time (formations, ressources, bibliothèque) ─────
router.post('/stripe/one-time', requireAuth, async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe non configuré' });
  }

  try {
    const Stripe = require('stripe');
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const { itemType, itemId, amount, name } = req.body;
    if (!itemType || !itemId || !amount) return res.status(400).json({ error: 'Données manquantes' });

    const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: req.user.email,
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(amount * 100),
          product_data: { name: name || 'Achat' }
        },
        quantity: 1
      }],
      success_url: `${siteUrl}/?payment=success&item=${itemType}&id=${itemId}`,
      cancel_url: `${siteUrl}/?payment=cancelled`,
      metadata: { userId: req.user.id, itemType, itemId }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe one-time error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── PayPal ────────────────────────────────────────────────────

/**
 * Créer une commande PayPal
 * POST /api/payment/paypal/order
 */
router.post('/paypal/order', requireAuth, async (req, res) => {
  if (!process.env.PAYPAL_CLIENT_ID) {
    return res.status(503).json({ error: 'PayPal non configuré — ajouter PAYPAL_CLIENT_ID dans .env' });
  }

  try {
    const { amount, description, itemType, itemId } = req.body;
    if (!amount) return res.status(400).json({ error: 'Montant requis' });

    const baseUrl = process.env.PAYPAL_MODE === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    // Obtenir le token d'accès
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });
    const tokenData = await tokenRes.json();

    // Créer la commande
    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'EUR', value: amount.toFixed(2) },
          description: description || 'Achat La Ligue des Ambitieuses'
        }],
        application_context: {
          return_url: `${process.env.SITE_URL}/?payment=success&provider=paypal`,
          cancel_url: `${process.env.SITE_URL}/?payment=cancelled`
        }
      })
    });
    const order = await orderRes.json();

    if (order.id) {
      // Stocker la commande en attendant la capture
      db.prepare('INSERT INTO transactions (id, user_id, type, amount, status, description, paypal_order_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), req.user.id, itemType || 'purchase', amount, 'pending', description || '', order.id);

      const approveUrl = order.links?.find(l => l.rel === 'approve')?.href;
      res.json({ orderId: order.id, approveUrl });
    } else {
      res.status(400).json({ error: 'Erreur PayPal', details: order });
    }
  } catch (err) {
    console.error('PayPal order error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Capturer le paiement PayPal
 * POST /api/payment/paypal/capture/:orderId
 */
router.post('/paypal/capture/:orderId', requireAuth, async (req, res) => {
  if (!process.env.PAYPAL_CLIENT_ID) {
    return res.status(503).json({ error: 'PayPal non configuré' });
  }

  try {
    const baseUrl = process.env.PAYPAL_MODE === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });
    const tokenData = await tokenRes.json();

    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${req.params.orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
    const capture = await captureRes.json();

    if (capture.status === 'COMPLETED') {
      db.prepare('UPDATE transactions SET status = ?, metadata = ? WHERE paypal_order_id = ?')
        .run('succeeded', JSON.stringify(capture), req.params.orderId);
      res.json({ status: 'success', capture });
    } else {
      res.status(400).json({ error: 'Capture échouée', details: capture });
    }
  } catch (err) {
    console.error('PayPal capture error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Historique transactions ───────────────────────────────────
router.get('/transactions', requireAuth, (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const transactions = isAdmin
    ? db.prepare('SELECT t.*, u.first_name, u.last_name FROM transactions t JOIN users u ON u.id = t.user_id ORDER BY t.created_at DESC').all()
    : db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(transactions);
});

module.exports = router;
