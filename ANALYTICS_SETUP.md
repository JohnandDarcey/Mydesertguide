# My Desert Guide Analytics Setup

This project adds a lightweight analytics and daily reporting layer for Darcey's My Desert Guide. It is intentionally single-Realtor for now, with the implementation split into small modules so it can be expanded later without rebuilding from scratch.

## What Is Tracked

The browser sends these event names to `/api/analytics/collect`:

- `guide_view`
- `category_view`
- `place_view`
- `darcey_website_click`
- `real_estate_contact_click`
- `real_estate_cta_impression`
- `real_estate_home_search_click`
- `lead_form_started`
- `lead_form_submitted`
- `lead_form_error`
- `ask_darcey_page_view`
- `buyer_guide_requested`
- `darcey_call_click`
- `darcey_text_click`
- `darcey_email_click`
- `maps_click`
- `business_website_click`
- `menu_click`
- `favorite_save`
- `install_cta_displayed`
- `install_cta_clicked`
- `ios_instructions_opened`
- `native_prompt_opened`
- `native_prompt_accepted`
- `native_prompt_dismissed`
- `pwa_install_confirmed`
- `pwa_standalone_launch`

Favorites are device-local and shared across the homepage, category pages, recommendation pages, and installed mode. Installation events intentionally distinguish interest, instructions, native prompt outcomes, confirmed installation, and standalone launches.

The hybrid homepage also records `homepage_category_click`, `curated_favorite_click`, and `explore_desert_click` so category routing, editorial highlights, and the intentional homepage scroll action remain distinct without duplicate hash-based category events.

## Client Engagements

Client Engagements are the sum of:

- Darcey website clicks
- Darcey call clicks
- Darcey text clicks
- Darcey email/contact clicks
- Google Maps/directions clicks
- Favorites saved

Business website and menu clicks are shown separately as guide engagement, but they are not included in Client Engagements.

## Privacy

The site creates a random anonymous visitor ID in the visitor's browser. The server hashes that ID before storing it. No raw IP addresses are stored long-term. Aggregate analytics do not contain names, email addresses, phone numbers, or inquiry messages.

People who explicitly submit the real-estate form create a separate private lead record in Netlify Blobs. Those records contain the contact details and consent needed for Darcey to respond, are available only through the admin-token-protected dashboard API, and are never mixed into aggregate event storage.

The dashboard excludes `/admin` traffic, and the server ignores obvious bot and crawler user agents.

## Netlify Environment Variables

Add these in Netlify:

```text
ANALYTICS_ADMIN_TOKEN=choose-a-long-private-password
ANALYTICS_REPORT_TO=john@darceydeetz.com,darcey@darceydeetz.com
LEAD_NOTIFICATION_TO=john@darceydeetz.com,darcey@darceydeetz.com
ANALYTICS_FROM_EMAIL=My Desert Guide <reports@mydesertguide.com>
RESEND_API_KEY=your-resend-api-key
SITE_URL=https://mydesertguide.com
ANALYTICS_HASH_SALT=choose-a-random-private-string
```

Notes:

- `ANALYTICS_ADMIN_TOKEN` protects the private dashboard API and the test email button.
- `ANALYTICS_REPORT_TO` accepts a comma-separated list of recipients.
- `LEAD_NOTIFICATION_TO` accepts a comma-separated list for immediate new-lead alerts. If omitted, it uses `ANALYTICS_REPORT_TO`.
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

The dashboard defaults to 30 days and also offers 24 hours, 7 days, 90 days, and all time. It intentionally shows only first-party engagement and lead activity: recommendation opens, category interest, popular places, Darcey contact actions, Ask Darcey page activity, form starts and conversion, lead sources and types, content producing leads, buyer-guide requests, and reliable PWA activity when present. Recent lead names, contact details, messages, source pages, and New/Contacted status appear only after the private dashboard is unlocked.

Netlify Web Analytics is the authoritative source for pageviews, unique visitors, locations, and traffic sources. Those server-side metrics are not duplicated in the private dashboard because Netlify does not provide them through a supported API. Keeping traffic in Netlify and engagement in the existing first-party dashboard avoids additional analytics-service costs.

## Real-Estate Lead Flow

The homepage real-estate section is an editorial invitation that sends visitors to the single consent-based form at `/ask-darcey/`. The form captures buying, selling, relocation, exploratory, and general-question intent plus name, email, optional phone/message, and anonymous source/campaign context. A submitted form is a confirmed lead. Phone, text, email, home-search, and website clicks remain intent signals and must not be described as inquiries or missed messages. Lead status can be changed from New to Contacted in the private dashboard.

When a buyer asks for Darcey's first-time homebuyer guide and provides an email address, the system emails the PDF automatically and records the request as a conversion. The PDF also remains available from the post-submit confirmation screen.

## Daily Email Report

The scheduled function is `netlify/functions/analytics-daily-report.mjs`.

It uses Netlify Scheduled Functions with this UTC schedule:

```text
0 15,16 * * *
```

Netlify cron runs in UTC, so the function is checked at both 15:00 UTC and 16:00 UTC. The function only sends when that moment is 8 AM in `America/Los_Angeles`. This handles Pacific daylight and standard time.

Each report summarizes the previous completed calendar day in `America/Los_Angeles`.

The email subject is:

```text
Your Desert Guide Daily Report — [Date]
```

Subheading:

```text
Darcey's guide performance at a glance
```

## Duplicate Prevention

Before sending a scheduled daily report, the function checks Netlify Blobs for a sent-history record keyed by:

```text
guide ID + report date + recipient
```

If the daily job runs twice, it will not send the same report twice. Manual test emails are stored under separate test-history records so they do not interfere with the real daily send record.

## Send Test Report

From the private dashboard, click:

```text
Send Test Report
```

`Preview Daily Report` opens the exact generated email in a new browser window without sending it. `Send Test Report` sends a test version using real analytics data for the previous completed Pacific-time day.

## Production Testing Checklist

After Netlify deploys and environment variables are added:

1. Open `https://mydesertguide.com` in a normal browser.
2. Visit a few categories and open several recommendations.
3. Click a Google Maps link, a business website link, a menu link, and Darcey's real estate website link.
4. Open `https://mydesertguide.com/admin/analytics.html`.
5. Paste the admin token and confirm the dashboard updates.
6. Click `Send Test Report`.
7. Confirm `darcey@darceydeetz.com` receives the email.
8. Confirm the email images load and the layout looks good on mobile.

## Future Expansion

The analytics modules are separated into config, time, storage, metrics, email rendering, email provider, and report service files. Records and report history include `guideId` / `profileId`, and templates receive a guide report object. That makes it possible to add additional Realtors later through guide-specific configuration and storage namespaces without rebuilding the dashboard or report engine. Multi-Realtor UI is intentionally not included yet.
