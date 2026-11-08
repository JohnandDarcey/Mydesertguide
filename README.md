# My Desert Guide

Darcey's personal Coachella Valley guide to food and drink, happy hours, golf, and local favorites.

## Netlify Deployment

This project is configured for Netlify using `netlify.toml`.

- Netlify build command: `npm run build`
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

## Approved SolCal presentation and Events

Run `npm run build` before publishing. The build first regenerates place data,
production SEO heads, sitemap and robots, then applies the curated page bodies
in `src/approved-pages/`. These body templates preserve the approved design and
editorial additions independently of generated metadata. Edit a page's template
for curated content/layout changes; edit `outputs/desert-insider/data.js` for
place data and homepage content. Keep corresponding listing/detail templates in
sync when editing place information. Brand styles live in `brand.css` and the
shared menu in `guide-header.css` / `guide-header.js` within the publish folder.
Production integration scripts and Netlify functions are not copied from previews.

The single public Events snapshot is
`outputs/desert-insider/events/events-data.json`. Builds preserve this file.
The calendar and homepage fetch it without cache, and the service worker excludes
it. The homepage shows at most three distinct listings overlapping today and the
next two calendar days in America/Los_Angeles, including events already in progress.
It never fills gaps with later events. The date window rolls forward within a minute
on a visible page and immediately when returning to the tab. It reloads the snapshot
every 30 minutes and on reconnect; new listings still depend on the existing event
refresh process publishing source-checked data. Empty or unavailable windows retain
a full-calendar link. Run `npm run test:home-events` for boundary and refresh tests.
Refresh only its public event fields; do not publish credentials, source
maintenance records or private automation metadata. Calendar/PDF helpers are
local browser modules under `outputs/desert-insider/events/`.

`validate-production.mjs` checks prior page paths, immutable production
integrations, canonical metadata, active forms, absence of preview restrictions,
calendar filtering, and PDF generation. Newsletter tests use mocked requests and
do not create live registrations.
