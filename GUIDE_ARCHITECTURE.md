# My Desert Guide architecture

## Current delivery model

The homepage remains the existing client-rendered editorial experience in `outputs/desert-insider/app.js`.
Public category and recommendation routes are statically generated at build time so their headings, descriptions,
metadata, canonical URLs, structured data, images, and internal links are present in the initial HTML response.

Run `pnpm run build` to regenerate and validate all public pages.

## Content model

`outputs/desert-insider/data.js` remains the current editorial source. `guide-model.js` normalizes it into:

- a guide/profile identity;
- master-compatible place records with stable `placeId` values;
- guide recommendation relationships with `recommendationId`, personal notes, tags, ratings, and featured status;
- category view models used to generate the public pages.

The build writes `data/catalog.json` with distinct `places` and `recommendations` collections. This is the migration
boundary for a future master Places database without forcing a database project into the current phase.

Coordinates are supported as nullable `latitude` and `longitude` fields. They can be populated later without changing
the route or page architecture.

## Public routes

- `/food-drink/`
- `/golf/`
- `/things-to-do/`
- `/shopping/`
- `/utilities/`
- `/trusted-professionals/`
- `/place/:slug/`
- `/saved/` (device-local and excluded from the sitemap)

The static generator also writes `sitemap.xml` and `robots.txt`.

## Favorites and installation

Favorites are stored on the visitor's device and shared across the homepage, category pages, recommendation pages,
and installed mode. `site-features.js` owns favorites, saved-list rendering, install prompts, iOS instructions,
already-installed detection, mobile navigation, and service-worker registration.

The service worker uses network-first navigation for fresh deep links and cached fallback behavior for previously
visited pages. The manifest scopes the installed app to the complete site.

## Analytics

The existing analytics collector remains the only analytics system. Page events include guide/profile identity plus
category and place context. Installation engagement uses accurate staged events; only `appinstalled` is counted as a
confirmed installation.
