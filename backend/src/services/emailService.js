const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendActivationEmail({ to, firstName, activationUrl, ttlHours, academyName }) {
  return resend.emails.send({
    from: `${academyName || 'Academia'} <noreply@miguesync.es>`,
    to,
    subject: 'Completa tu inscripción',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hola ${firstName},</h2>
        <p>Te han inscrito en <strong>${academyName || 'nuestra academia'}</strong>.</p>
        <p>Para completar tus datos y confirmar tu inscripción, haz clic en el siguiente enlace:</p>
        <p style="margin: 24px 0;">
          <a href="${activationUrl}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
            Completar inscripción
          </a>
        </p>
        <p style="color:#6b7280;font-size:14px;">Este enlace expira en ${ttlHours} horas.</p>
        <p style="color:#6b7280;font-size:14px;">Si no esperabas este email, puedes ignorarlo.</p>
      </div>
    `,
  });
}

async function sendDiplomaEmail({ to, firstName, academyName, courseName, pdfBuffer, fileName }) {
  return resend.emails.send({
    from: `${academyName || 'Academia'} <noreply@miguesync.es>`,
    to,
    subject: `Tu diploma — ${courseName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Enhorabuena, ${firstName}!</h2>
        <p>Adjunto encontrarás tu diploma del curso <strong>${courseName}</strong>.</p>
        <p>Ha sido un placer tenerte en <strong>${academyName || 'nuestra academia'}</strong>.</p>
      </div>
    `,
    attachments: pdfBuffer ? [{ filename: fileName || 'diploma.pdf', content: pdfBuffer }] : [],
  });
}

module.exports = { sendActivationEmail, sendDiplomaEmail };
