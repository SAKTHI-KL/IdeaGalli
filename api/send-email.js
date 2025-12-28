// Vercel Serverless Function (Node 18+)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { name, email, phone, message, service } = req.body || {};
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL; // e.g. no-reply@yourdomain.com
  const TO_EMAIL = process.env.TO_EMAIL;     // where contact emails should go

  if (!SENDGRID_API_KEY || !FROM_EMAIL || !TO_EMAIL) {
    return res.status(500).json({ error: 'Email service not configured' });
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
      return res.status(500).json({ error: 'SendGrid error', detail: text });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Unexpected error', detail: err.message });
  }
}
