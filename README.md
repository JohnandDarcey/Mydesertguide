# The Desert Insider

Darcey's personal Coachella Valley guide to restaurants, happy hours, golf, and local favorites.

## Netlify Deployment

This project is configured for Netlify using `netlify.toml`.

- Build command: none
- Publish directory: `outputs/desert-insider`

Connect this GitHub repository to Netlify and enable automatic deploys from the main branch.
Every committed change pushed to GitHub will be published by Netlify.

## Local Preview

From the repository root:

```bash
python3 -m http.server 4173 --directory outputs/desert-insider
```

Then open:

```text
http://127.0.0.1:4173/
```
