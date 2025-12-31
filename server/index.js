require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const Lead = require('./models/Lead');

const app = express();
const PORT = process.env.PORT || 5000;

// Capture raw body for signature verification
app.use(bodyParser.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

// Connect MongoDB
if(!process.env.MONGODB_URI){ console.warn('MONGODB_URI not set. Leads will not be persisted.'); }
mongoose.connect(process.env.MONGODB_URI || '', { useNewUrlParser: true, useUnifiedTopology: true }).then(()=> console.log('MongoDB connected')).catch(err=> console.warn('MongoDB connect failed:', err.message));

function verifySignature(req){
  const sig = req.headers['x-hub-signature-256'];
  if(!sig || !process.env.META_APP_SECRET) return false;
  const hmac = crypto.createHmac('sha256', process.env.META_APP_SECRET).update(req.rawBody).digest('hex');
  const expected = `sha256=${hmac}`;
  try{ return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)); }catch(e){return false;}
}

// Webhook verification endpoint
app.get('/webhook', (req,res)=>{
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if(mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN){ return res.status(200).send(challenge); }
  return res.status(403).send('Verification failed');
});

// Enable basic CORS for browser forms
app.use((req,res,next)=>{ res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS'); res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization'); if(req.method==='OPTIONS') return res.sendStatus(200); next(); });

// Endpoint to accept leads from website forms
app.post('/leads', express.json(), async (req,res)=>{
  try{
    const { name, email, phone, message, service } = req.body || {};
    const lead = await Lead.create({ name: name || (req.body.firstName||''), phone: phone || (req.body.phone||''), message: message || '', source: 'website', language: req.body.language || 'en', metadata: { service, email } });

    // notify Slack
    if(process.env.SLACK_WEBHOOK_URL){
      fetch(process.env.SLACK_WEBHOOK_URL, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:`New website lead: *${name || phone}*\nService: ${service || 'N/A'}\nMessage: ${message || '-'} `, unfurl_links:false})})
        .then(()=> lead.notifiedSlack = true).catch(()=>{}).finally(()=> lead.save());
    }

    // send email
    if(process.env.SENDGRID_API_KEY && process.env.TO_EMAIL && process.env.FROM_EMAIL){
      const payload = { personalizations:[{to:[{email:process.env.TO_EMAIL}]}], from:{email:process.env.FROM_EMAIL}, subject:`New website lead: ${name || phone}`, content:[{type:'text/plain',value:`Name: ${name}\nPhone: ${phone}\nEmail: ${email}\nService: ${service}\nMessage:\n${message}`} ] };
      fetch('https://api.sendgrid.com/v3/mail/send',{method:'POST',headers:{Authorization:`Bearer ${process.env.SENDGRID_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(payload)})
        .then(r=>{ if(r.ok) lead.notifiedEmail = true; return r.text(); }).catch(()=>{}).finally(()=> lead.save());
    }

    res.json({ok:true});
  }catch(err){ console.error(err); res.status(500).json({error:err.message}); }
});

// Webhook receiver
app.post('/webhook', async (req,res) => {
  // Verify signature
  if(process.env.META_APP_SECRET && !verifySignature(req)){
    console.warn('Invalid signature');
    return res.status(403).send('Invalid signature');
  }

  const body = req.body;
  if(!body || !body.entry) return res.status(200).send('no entries');

  try{
    for(const entry of body.entry){
      const changes = entry.changes || [];
      for(const change of changes){
        const value = change.value || {};
        const messages = value.messages || [];
        const contacts = value.contacts || [];
        for(const message of messages){
          const from = message.from; // phone number
          const text = (message.text && message.text.body) || (message.button && message.button.text) || '';
          const name = (contacts[0] && contacts[0].profile && contacts[0].profile.name) || '';

          const detectedLang = detectLanguage(text);
          const lead = await Lead.create({ name, phone: from, message: text, source: 'whatsapp', language: detectedLang, metadata: message });

          // Notify Slack
          if(process.env.SLACK_WEBHOOK_URL){
            fetch(process.env.SLACK_WEBHOOK_URL, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:`New lead from WhatsApp: *${name || from}*\n${text}`, unfurl_links:false})})
              .then(()=> lead.notifiedSlack = true).catch(()=>{}).finally(()=> lead.save());
          }

          // Send email via SendGrid
          if(process.env.SENDGRID_API_KEY && process.env.TO_EMAIL && process.env.FROM_EMAIL){
            const payload = { personalizations:[{to:[{email:process.env.TO_EMAIL}]}], from:{email:process.env.FROM_EMAIL}, subject:`New WhatsApp lead: ${name || from}`, content:[{type:'text/plain',value:`Name: ${name}\nPhone: ${from}\nMessage: ${text}`} ] };
            fetch('https://api.sendgrid.com/v3/mail/send',{method:'POST',headers:{Authorization:`Bearer ${process.env.SENDGRID_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(payload)})
              .then(r=>{ if(r.ok) lead.notifiedEmail = true; return r.text(); }).catch(()=>{}).finally(()=> lead.save());
          }

          // Simple rule-based replies
          const reply = generateReply(text || '');
          if(reply){
            sendWhatsAppText(from, reply).catch(err=>console.warn('send failed',err));
          }
        }
      }
    }
    return res.status(200).json({ handled:true });
  }catch(err){ console.error(err); return res.status(500).json({error:err.message}); }
});

// leads endpoint (protected by ADMIN_SECRET)
app.get('/leads', async (req,res)=>{
  const auth = req.headers.authorization || '';
  if(!process.env.ADMIN_SECRET || auth !== `Bearer ${process.env.ADMIN_SECRET}`) return res.status(401).json({error:'Unauthorized'});
  const leads = await Lead.find().sort({createdAt:-1}).limit(200).lean();
  res.json({leads});
});

// Placeholder conversion endpoint
app.post('/convert', express.json(), (req,res)=>{
  // TODO: call Google Ads conversions API server-side
  res.json({ok:true});
});

// simple health
app.get('/health', (req,res)=> res.json({ok:true}));

app.listen(PORT, ()=> console.log('Server listening on', PORT));

// helpers
async function sendWhatsAppText(to, body){
  if(!process.env.META_ACCESS_TOKEN || !process.env.META_PHONE_NUMBER_ID) throw new Error('WhatsApp not configured');
  const url = `https://graph.facebook.com/v17.0/${process.env.META_PHONE_NUMBER_ID}/messages`;
  const payload = { messaging_product: 'whatsapp', to, text: { body } };
  const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if(!r.ok) { const txt = await r.text(); throw new Error('WhatsApp send failed: '+txt); }
  return r.json();
}

function detectLanguage(text){
  if(!text) return 'en';
  // Tamil unicode block: \u0B80-\u0BFF, Devanagari (Hindi) \u0900-\u097F
  if(/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  if(/[\u0900-\u097F]/.test(text)) return 'hi';
  return 'en';
}

function generateReply(text, lang){
  const t = (text||'').toLowerCase();
  const pricing = ['price','pricing','cost','quote','estimate','how much'];
  const demo = ['demo','sample','trial','show'];
  const working = ['hi','hello','hey','hello.','thanks','thank'];

  // templates per language
  const templates = {
    en: {
      pricing: 'Thanks for asking about pricing — we offer tailored packages depending on your product. Could you share your product and monthly budget?',
      demo: 'Great — we can schedule a demo. What date/time works for you?',
      working: 'Thanks for reaching out! How can we help you today?',
      default: 'Thanks for contacting Idea Galli — we received your message and will reply shortly.'
    },
    ta: {
      pricing: 'பிறசார்ந்து கேட்டதற்கு நன்றி — உங்கள் தயாரிப்பின் அடிப்படையில் தொகுப்புகளை வழங்குகிறோம். உங்கள் தயாரிப்பு மற்றும் மாதாந்திர பட்ஜெட்டை பகிரவும்.',
      demo: 'சிறந்தது — ஒரு டெமோ திட்டமிடலாம். எந்த தேதி/நேரம் உங்களுக்கு பொருத்தமாய் இருக்கும்?',
      working: 'தொடர்பு கொண்டதற்கு நன்றி! எவ்வாறு உதவலாம்?',
      default: 'Idea Galli இல் தொடர்பு கொண்டதற்கு நன்றி — உங்களது செய்தி பெற்றுக்கொண்டோம், விரைவில் பதிலளிக்கப்படும்.'
    },
    hi: {
      pricing: 'मूल्य पूछने के लिए धन्यवाद — हम आपके उत्पाद के अनुसार अनुकूल पैकेज प्रदान करते हैं। क्या आप अपना उत्पाद और मासिक बजट बता सकते हैं?',
      demo: 'बहुत बढ़िया — हम एक डेमो शेड्यूल कर सकते हैं। कौन सी तारीख/समय आपके लिए सही है?',
      working: 'संपर्क करने के लिए धन्यवाद! हम आपकी कैसे मदद कर सकते हैं?',
      default: 'Idea Galli से संपर्क करने के लिए धन्यवाद — हमें आपका संदेश मिल गया है और हम शीघ्र ही जवाब देंगे।'
    }
  };

  const pick = templates[lang] || templates.en;

  if(pricing.some(k=> t.includes(k))) return pick.pricing;
  if(demo.some(k=> t.includes(k))) return pick.demo;
  if(working.some(k=> t.includes(k))) return pick.working;
  return pick.default;
}
