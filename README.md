# Retro Portfolio

A portfolio/resume site. The hero is a large animated "system network" cluster — orbiting nodes, links, and data packets flowing between them. Clicking the network zooms into its core and opens a 3D carousel of interactive cards, each one a portfolio section (About, Skills, Projects, Experience, Contact).

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Edit your content

- Portfolio text lives in the `SECTIONS` array at the top of `src/CardCarousel.tsx` — change titles, subtitles, and lines there. Card background videos are in `CARD_VIDEOS` in the same file.
- The hero is text-free by design; its look (sphere size, spark count, colors) is configurable at the top of `src/NetworkHero.tsx`.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- No animation libraries — plain canvas, `requestAnimationFrame`, and CSS
