# My Desert Guide Analytics Setup

This project adds a lightweight analytics and daily reporting layer for Darcey's My Desert Guide. It is intentionally single-Realtor for now, with the implementation split into small modules so it can be expanded later without rebuilding from scratch.

## What Is Tracked

The browser sends these event names to `/api/analytics/collect`:

- `guide_view`
- `category_view`
- `place_view`
- `darcey_website_click`
- `darcey_call_click`
- `darcey_text_click`
- `darcey_email_click`
- `maps_click`
- `business_website_click`
- `menu_click`
- `favorite_save`

`favorite_save` is reserved for the future. Favorites were not added as part of this project.

## Client Engagements

Client Engagements are the sum of:

- Darcey website clicks
- Darcey call clicks
- Darcey text clicks
- Darcey email/contact clicks
- Google Maps/directions clicks
- Favorites saved, if that feature exists later

Business website and menu clicks are shown separately as guide engagement, but they are not included in Client Engagements.

## Privacy

The site creates a random anonymous visitor ID in the visitor's browser. The server hashes that ID before storing it. No raw IP addresses are stored long-term, and the dashboard shows aggregate totals only.

The dashboard excludes `/admin` traffic, and the server ignores obvious bot and crawler user agents.

## Netlify Environment Variables

Add these in Netlify:

```text
ANALYTICS_ADMIN_TOKEN=choose-a-long-private-password
ANALYTICS_REPORT_TO=john@darceydeetz.com
ANALYTICS_FROM_EMAIL=My Desert Guide <reports@mydesertguide.com>
RESEND_API_KEY=your-resend-api-key
SITE_URL=https://mydesertguide.com
ANALYTICS_HASH_SALT=choose-a-random-private-string
```

Notes:

- `ANALYTICS_ADMIN_TOKEN` protects the private dashboard API and the test email button.
- `RESEND_API_KEY` is required before emails can actually send.
- `ANALYTICS_FROM_EMAIL` must be a sender address/domain verified in Resend.
- `SITE_URL` is used to generate absolute dashboard and image URLs in email clients.
- `ANALYTICS_HASH_SALT` helps keep anonymous visitor hashes project-specific.

## Private Dashboard

Open:

```text
https://mydesertguide.com/admin/analytics.html
```

Paste the `ANALYTICS_ADMIN_TOKEN` when prompted. The token is saved only in that browser's local storage and is not placed in the URL.

The dashboard shows:

- Today
- Yesterday
- Last 7 days
- Last 30 days
- Guide views
- Unique visitors
- Returning visitors
- Client Engagements
- Top categories
- Top places
- Darcey/contact clicks
- Maps clicks
- Business website and menu clicks
- Referral source summary when available

## Daily Email Report

The scheduled function is `netlify/functions/analytics-daily-report.mjs`.

It uses Netlify Scheduled Functions with this UTC schedule:

```text
0 15,16 * * *
```

Netlify cron runs in UTC, so the function is checked at both 15:00 UTC and 16:00 UTC. The function only sends when that moment is 8 AM in `America/Los_Angeles`. This handles Pacific daylight and standard time.

Each report summarizes the previous completed calendar day in `America/Los_Angeles`.

The email is called:

```text
My Desert Guide Daily Pulse
```

Subheading:

```text
Darcey's guide performance at a glance
```

## Duplicate Prevention

Before sending a scheduled daily report, the function checks Netlify Blobs for a sent-history record keyed by:

```text
report date + recipient
```

If the daily job runs twice, it will not send the same report twice. Manual test emails are stored under separate test-history records so they do not interfere with the real daily send record.

## Send Test Report

From the private dashboard, click:

```text
Send Test Report
```

This sends a test version of the Daily Pulse email using real analytics data for the previous completed day.

## Production Testing Checklist

After Netlify deploys and environment variables are added:

1. Open `https://mydesertguide.com` in a normal browser.
2. Visit a few categories and open several recommendations.
3. Click a Google Maps link, a business website link, a menu link, and Darcey's real estate website link.
4. Open `https://mydesertguide.com/admin/analytics.html`.
5. Paste the admin token and confirm the dashboard updates.
6. Click `Send Test Report`.
7. Confirm `john@darceydeetz.com` receives the email.
8. Confirm the email images load and the layout looks good on mobile.

## Future Expansion

The analytics modules are separated into config, time, storage, metrics, email rendering, email provider, and report service files. That makes it possible to add additional Realtors later by introducing guide-specific configuration and storage namespaces. Multi-Realtor behavior is not included yet.
