# My Desert Guide

Darcey's personal Coachella Valley guide to food and drink, happy hours, golf, and local favorites.

## Netlify Deployment

This project is configured for Netlify using `netlify.toml`.

- Netlify build command: `node scripts/validate-analytics.mjs`
- Publish directory: `outputs/desert-insider`
- Functions directory: `netlify/functions`

Connect this GitHub repository to Netlify and enable automatic deploys from the main branch.
Every committed change pushed to GitHub will be published by Netlify.

## Private Analytics

The guide includes first-party aggregate analytics, a single consent-based real-estate lead form at `/ask-darcey/`, a private lead dashboard, and a scheduled daily email report.

## My Desert Guide Updates signup

The footer form and delayed engagement popup both submit to `/api/newsletter/signup`. The Netlify function records a Follow Up Boss `Registration` event, relies on Follow Up Boss email deduplication, then adds the `My Desert Guide Updates` tag with `mergeTags=true` so existing contact tags are preserved.

Configure these server-side Netlify environment variables before publishing:

- `FUB_API_KEY`
- `FUB_X_SYSTEM` (optional; defaults to `My Desert Guide`)
- `FUB_X_SYSTEM_KEY` (optional; use when Follow Up Boss issues a registered system key)

Do not place these values in browser code. The Follow Up Boss Pixel is installed once in each page head with account ID `WT-WCOHTMTK`; Pixel form capture remains off because newsletter registrations are sent through the API.

- Dashboard: `/admin/analytics.html`
- Ask Darcey lead page: `/ask-darcey/`
- Lead alerts: immediate email to John and Darcey
- Buyer lead magnet: Darcey's 2026 First-Time Homebuyer Guide
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
