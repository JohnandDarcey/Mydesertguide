# My Desert Guide

Darcey's personal Coachella Valley guide to restaurants, happy hours, golf, and local favorites.

## Netlify Deployment

This project is configured for Netlify using `netlify.toml`.

- Netlify build command: `node scripts/validate-analytics.mjs`
- Publish directory: `outputs/desert-insider`
- Functions directory: `netlify/functions`

Connect this GitHub repository to Netlify and enable automatic deploys from the main branch.
Every committed change pushed to GitHub will be published by Netlify.

## Private Analytics

The guide includes first-party aggregate analytics, a private dashboard, and a scheduled daily email report.

- Dashboard: `/admin/analytics.html`
- Daily report: My Desert Guide Daily Pulse
- Report recipient: `john@darceydeetz.com` by default
- Storage: Netlify Blobs
- Email provider: Resend

See `ANALYTICS_SETUP.md` for production environment variables, privacy notes, and testing steps.

## Local Preview

From the repository root:

```bash
python3 -m http.server 4173 --directory outputs/desert-insider
```

Then open:

```text
http://127.0.0.1:4173/
```
