/**
 * Service d'envoi d'emails
 * Utilise Nodemailer avec configuration SMTP (Brevo, Gmail, etc.)
 */

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    // Mode développement : log uniquement
    console.warn('[Email] SMTP non configuré — emails affichés dans la console uniquement');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter;
}

/**
 * Envoie un email
 * @param {Object} options - { to, subject, html, text }
 */
async function sendEmail({ to, subject, html, text }) {
  const transport = getTransporter();

  if (!transport) {
    // Mode dev : afficher dans la console
    console.log('\n📧 ─── EMAIL (mode dev) ─────────────────');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text || html);
    console.log('─────────────────────────────────────────\n');
    return { messageId: 'dev-mode' };
  }

  const from = `"${process.env.EMAIL_FROM_NAME || 'La Ligue des Ambitieuses'}" <${process.env.EMAIL_FROM || 'noreply@liguedesambitieuses.fr'}>`;

  const info = await transport.sendMail({
    from,
    to,
    subject,
    html: html || `<p>${text}</p>`,
    text: text || html?.replace(/<[^>]*>/g, '') || ''
  });

  return info;
}

module.exports = { sendEmail };
