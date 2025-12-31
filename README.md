# Idea Galli — Deployment & Backend Setup

This project is a static marketing website with optional serverless functions for sending contact/booking emails via SendGrid. It can be hosted on **Vercel** or **Netlify**.

## What I added
- Serverless functions:
  - `api/send-email.js` (Vercel)
  - `netlify/functions/send-email.js` (Netlify)
- Client-side form wiring in `js/scripts.js` that tries `/api/send-email` then falls back to `/.netlify/functions/send-email`.
- Google Analytics (replace ID) and JSON-LD SEO schema.
- WhatsApp floating chat button (replace phone number in `index.html`).

## Environment variables (required)
Set these in your hosting dashboard (Vercel Project > Settings > Environment Variables or Netlify Site settings > Build & deploy > Environment):
- `SENDGRID_API_KEY` — your SendGrid API key
- `FROM_EMAIL` — e.g. `no-reply@yourdomain.com` (must be a verified sender for SendGrid)
- `TO_EMAIL` — destination email that receives form submissions

Optional (update in `index.html`):
- Replace `G-XXXXXXXX` with your Google Analytics Measurement ID
- Update JSON-LD values: `url`, `logo`, `sameAs` and `telephone`
- Update WhatsApp link in `index.html` with your international number (no plus sign)

## Deploy to Vercel
1. Push this repo to GitHub/GitLab.
2. Create a new project on Vercel and import the repository.
3. Vercel will automatically detect the project as static and deploy. Serverless functions in `api/` will be available at `/api/send-email`.
4. Add the environment variables to Vercel (see above).

## Deploy to Netlify
1. Push to GitHub/GitLab.
2. Create a new site on Netlify and connect the repo.
3. In Netlify, the function in `netlify/functions/send-email.js` will be built and available at `/.netlify/functions/send-email`.
4. Add the environment variables in Netlify site settings.

## Testing email locally
- You can run the static site locally (`python -m http.server 8000`) and test serverless functions by using `netlify dev` (Netlify CLI) or Vercel CLI (`vercel dev`) which emulate serverless functions locally and let you set env vars locally.

## Analytics & GDPR
- The Google Analytics snippet is added to `<head>`. If you need cookie consent management (GDPR), I can add a lightweight consent banner that disables `gtag` until consent is given.

## Next steps I can do for you
- Deploy the site for you if you provide access (or invite me as a collaborator) ✅
- Add server-side form storage (MongoDB Atlas) and a WhatsApp webhook + auto-reply bot (I scaffolded a Heroku-ready webhook in `/server`) ✅
- Add an Admin dashboard (React) to view leads and reply via WhatsApp
- Add cookie consent management for GDPR
- Configure SMTP (Mailgun, SES) instead of SendGrid

## WhatsApp + Lead backend
I scaffolded an Express webhook app under `server/` that:
- Receives Meta WhatsApp Cloud webhooks on `/webhook` (verification + signature check)
- Saves leads to MongoDB Atlas (`Lead` model)
- Notifies Slack and sends email via SendGrid when a lead arrives
- Auto-replies with simple rule-based messages
- Exposes `/leads` (protected by `ADMIN_SECRET`) to list leads

See `server/README.md` for deploy steps and env var list.
---
If you'd like, provide:
- Which host you prefer (Vercel or Netlify)
- SendGrid API key / or tell me if you prefer another email provider
- WhatsApp number (international format, no +) and Google Analytics Measurement ID

I will then finish environment setup instructions and help deploy live.  