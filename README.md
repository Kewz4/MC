# Merchcraft Apparel Lab

A responsive React/Vite site for Merchcraft, built around the brand’s apparel-lab visual system. The site includes the existing homepage plus dedicated Services, About, Contact, and Quote experiences.

## Routes

- `/` — Homepage
- `/services` — Capabilities switchboard, proofing standards, and production flow
- `/about` — Scroll-driven production story and company overview
- `/contact` — Contact routing and Netlify-ready work-order form
- `/quote` — Four-step build request with live summary and optional artwork upload

## Local development

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:3000`.

## Checks

```bash
npm run lint
npm run build
```

## Deployment

The repository includes Netlify SPA redirects and static form definitions in `index.html`, allowing the React-rendered `contact` and `quote` forms to be detected during deployment.

Brand logos, self-hosted WOFF2 fonts, licenses, and production imagery live under `public/assets/`.
