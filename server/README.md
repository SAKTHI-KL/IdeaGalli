# Idea Galli — WhatsApp webhook & lead backend

This small Express app receives WhatsApp Cloud messages (Meta), stores leads in MongoDB Atlas, sends Slack and SendGrid notifications, and replies automatically based on simple rules.

## Environment variables
Copy `.env.example` to `.env` and set the values.

Required:
- MONGODB_URI - MongoDB Atlas connection string
- META_VERIFY_TOKEN - token for webhook verification
- META_ACCESS_TOKEN - WhatsApp Cloud API access token (from Meta)
- META_PHONE_NUMBER_ID - phone number ID used in the API URL
- META_APP_SECRET - app secret for signature verification (recommended)
- ADMIN_SECRET - bearer token for admin /leads access
- SLACK_WEBHOOK_URL - optional Slack incoming webhook URL
- SENDGRID_API_KEY - optional SendGrid API key
- FROM_EMAIL, TO_EMAIL - optional email addresses for notifications

## Deploy to Heroku
1. Create Heroku app: `heroku create your-app-name`
2. Add buildpacks and set Node engines are fine by default.
3. Set config vars in Heroku Dashboard or CLI: `heroku config:set MONGODB_URI=... META_VERIFY_TOKEN=... META_ACCESS_TOKEN=... ADMIN_SECRET=...` etc.
4. `git push heroku main` (or your branch)
5. Ensure your webhook URL (`https://your-app-name.herokuapp.com/webhook`) is configured in your Meta WhatsApp app and verify using the verify token.

## Local testing
- Install deps: `npm install`
- `npm run dev` (requires nodemon) or `npm start` to run
- Use `ngrok` to expose local port to test webhook for Meta

## Notes
- The service implements a simple rule-based reply generator in `generateReply`. You can extend or replace with AI-driven replies.
- For security, set `META_APP_SECRET` to verify webhook signatures.
