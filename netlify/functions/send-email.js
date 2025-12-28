// Netlify Function to send email via SendGrid
const fetch = (...args) => import('node-fetch').then(({default:fetch})=>fetch(...args));

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  const body = JSON.parse(event.body || '{}');
  const { name, email, phone, message, service } = body;

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL; // e.g. no-reply@yourdomain.com
  const TO_EMAIL = process.env.TO_EMAIL;     // where contact emails should go

  if (!SENDGRID_API_KEY || !FROM_EMAIL || !TO_EMAIL) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Email service not configured' }) };
  }

  const content = `New contact submission:\nName: ${name || '-'}\nEmail: ${email || '-'}\nPhone: ${phone || '-'}\nService: ${service || '-'}\nMessage:\n${message || '-'} `;

  const payload = {
    personalizations: [{ to: [{ email: TO_EMAIL }] }],
    from: { email: FROM_EMAIL },
    subject: `Website contact: ${name || email || 'New lead'}`,
    content: [{ type: 'text/plain', value: content }]
  };

  try {
    const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const text = await r.text();
      return { statusCode: 500, body: JSON.stringify({ error: 'SendGrid error', detail: text }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Unexpected error', detail: err.message }) };
  }
};
