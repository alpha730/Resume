# Aryan Kumar — portfolio

A resume site set in space. The landing page is a spiral galaxy; clicking it
dives into the core and opens a star system where each body is a section of
the resume. Clicking a body pulls it aside and slides in its content.

Everything is drawn procedurally on canvas — no photographs, no video, no
sprite sheets. Planets are shaded per pixel with fbm surface texture, a single
light direction, limb darkening and atmospheric rim.

Live: https://alpha730.github.io/Resume/

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Edit your content

All resume text lives in `src/sections.ts` — one entry per section, each with
a title, subtitle, the teaser lines shown under its body, and the detail
blocks shown in the panel. Links go in a block's `link` field.

Which celestial body represents which section is set by `PLACEMENTS` in
`src/SpaceField.tsx`: kind, position, size, drift and spin, with a separate
position for narrow screens.

## Layout

| File | What it does |
| --- | --- |
| `src/App.tsx` | Switches between the landing galaxy and the star system |
| `src/GalaxyHero.tsx` | Landing page: the main galaxy, its hover response and the dive, plus background galaxies |
| `src/SpaceField.tsx` | The star system: body placement, drift, parallax, and the detail panel |
| `src/CelestialBody.tsx` | Builds each interactive body from the renderers |
| `src/NebulaBackground.tsx` | Nebula, starfield, and the depth-sorted decor layers behind the bodies |
| `src/spaceRender.ts` | The renderers: planets, asteroids, the satellite, galaxies, film grain |
| `src/sections.ts` | Resume content |

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- No animation libraries — plain canvas, `requestAnimationFrame`, and CSS

## Deploy

Pushing to `main` builds and publishes to GitHub Pages via
`.github/workflows/deploy.yml`. `vite.config.ts` sets the base path to
`/Resume/` only under GitHub Actions, so local dev still serves from root.
