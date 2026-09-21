import { useCallback, useMemo } from 'react';
import { renderPlanet, renderAsteroid, renderSatellite, prng, type PlanetOptions } from './spaceRender';

/**
 * The seven bodies that stand in for the resume sections.
 *
 * Each is rendered per-pixel by `spaceRender` — textured, lit from the upper
 * left, with a hard terminator and limb darkening — rather than drawn as
 * vector shapes, which is what made the earlier version look illustrated.
 * Rendering happens once per body and is memoised; the result is an image.
 */

export type BodyKind =
  | 'gasGiant'
  | 'marsPlanet'
  | 'crateredMoon'
  | 'asteroidCluster'
  | 'comet'
  | 'terranPlanet'
  | 'station';

interface Props {
  kind: BodyKind;
  uid: string;
  size: number;
}

/** Texture resolution, capped: the bodies never display larger than this. */
const texSize = (size: number) => Math.min(360, Math.round(size * 2));

function buildBody(kind: BodyKind, size: number, seed: number): HTMLCanvasElement | null {
  const s = texSize(size);

  const planet = (opts: PlanetOptions) => renderPlanet(s, opts);

  switch (kind) {
    case 'gasGiant':
      return planet({ type: 'gas', seed, fill: 0.84, atmosphere: [70, 44, 20] });

    case 'marsPlanet':
      // fill 0.78 keeps the globe the same diameter it had inside the old ring
      // canvas, so dropping the ring does not shrink the body.
      return planet({ type: 'martian', seed, fill: 0.78, atmosphere: [128, 74, 44], ambient: 0.035 });

    case 'crateredMoon':
      return planet({ type: 'rocky', seed, fill: 0.84, ambient: 0.02 });

    case 'terranPlanet':
      return planet({ type: 'terran', seed, fill: 0.82, atmosphere: [48, 108, 196], ambient: 0.05 });

    case 'station':
      return renderSatellite(s, seed);

    default:
      return null; // composed from several pieces below
  }
}

export default function CelestialBody({ kind, uid, size }: Props) {
  const seed = useMemo(() => {
    let h = 2166136261;
    for (let i = 0; i < uid.length; i++) h = Math.imul(h ^ uid.charCodeAt(i), 16777619);
    return h >>> 0;
  }, [uid]);

  const painted = useMemo(() => buildBody(kind, size, seed), [kind, size, seed]);

  // A cluster is several rocks at different depths, each rendered separately.
  const cluster = useMemo(() => {
    if (kind !== 'asteroidCluster') return null;
    const rand = prng(seed);
    return [
      { x: 0.03, y: -0.02, s: 0.62, seed: seed + 1 },
      { x: 0.34, y: 0.26, s: 0.30, seed: seed + 2 },
      { x: -0.30, y: 0.30, s: 0.24, seed: seed + 3 },
      { x: 0.26, y: -0.32, s: 0.18, seed: seed + 4 },
      { x: -0.34, y: -0.18, s: 0.13, seed: seed + 5 },
    ].map((r) => ({
      ...r,
      rot: rand() * 360,
      canvas: renderAsteroid(Math.max(28, Math.round(texSize(size) * r.s)), { seed: r.seed }),
    }));
  }, [kind, size, seed]);

  /** Mounts a pre-rendered canvas at a given CSS size. */
  const mount = useCallback((canvas: HTMLCanvasElement | null, box: number) => {
    return (host: HTMLDivElement | null) => {
      if (!host) return;
      host.replaceChildren();
      if (!canvas) return;
      canvas.style.width = `${box}px`;
      canvas.style.height = `${box}px`;
      canvas.style.display = 'block';
      host.appendChild(canvas);
    };
  }, []);

  if (kind === 'asteroidCluster' && cluster) {
    return (
      <div style={{ width: size, height: size, position: 'relative' }}>
        {cluster.map((r, i) => (
          <div
            key={i}
            ref={mount(r.canvas, size * r.s)}
            style={{
              position: 'absolute',
              left: size * (0.5 + r.x) - (size * r.s) / 2,
              top: size * (0.5 + r.y) - (size * r.s) / 2,
              transform: `rotate(${r.rot}deg)`,
            }}
          />
        ))}
      </div>
    );
  }

  if (kind === 'comet') {
    // A comet is light, not surface: a bright nucleus, a coma, and a tail
    // that is brightest at the head and dissolves outward.
    const id = `comet-${uid}`;
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible', display: 'block' }}
      >
        <defs>
          <radialGradient id={`${id}-nuc`} cx="42%" cy="38%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#dff7ff" />
            <stop offset="100%" stopColor="#7fd6e8" />
          </radialGradient>
          <radialGradient id={`${id}-coma`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(200,248,255,0.85)" />
            <stop offset="35%" stopColor="rgba(120,220,245,0.35)" />
            <stop offset="100%" stopColor="rgba(60,170,220,0)" />
          </radialGradient>
          <linearGradient id={`${id}-tail`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(215,250,255,0.75)" />
            <stop offset="30%" stopColor="rgba(140,215,245,0.34)" />
            <stop offset="100%" stopColor="rgba(80,150,220,0)" />
          </linearGradient>
        </defs>
        <path d="M70 30 Q40 48 4 86 Q34 56 50 52 Q32 62 16 80 Q46 48 70 42 Z" fill={`url(#${id}-tail)`} />
        <path d="M68 34 Q44 50 14 78 Q46 54 68 43 Z" fill={`url(#${id}-tail)`} opacity="0.6" />
        <circle cx="70" cy="32" r="26" fill={`url(#${id}-coma)`} />
        <circle cx="70" cy="32" r="7.5" fill={`url(#${id}-nuc)`} />
      </svg>
    );
  }

  if (!painted) return null;

  return <div ref={mount(painted, size)} style={{ width: size, height: size }} />;
}
