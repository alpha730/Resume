import { useCallback, useMemo } from 'react';
import { renderPlanet, renderAsteroid, prng, type PlanetOptions } from './spaceRender';

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
  | 'ringedPlanet'
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

    case 'ringedPlanet':
      return planet({
        type: 'neptunian',
        seed,
        fill: 0.80,
        atmosphere: [42, 78, 150],
        ring: { inner: 1.36, outer: 2.2, tilt: -0.34, color: [214, 206, 188], opacity: 0.5 },
      });

    case 'crateredMoon':
      return planet({ type: 'rocky', seed, fill: 0.84, ambient: 0.02 });

    case 'terranPlanet':
      return planet({ type: 'terran', seed, fill: 0.82, atmosphere: [48, 108, 196], ambient: 0.05 });

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

  if (kind === 'station') {
    // Hardware, not geology: brushed metal, a cell grid on the arrays, and a
    // shaded side so it sits in the same light as everything else.
    const id = `st-${uid}`;
    const cells = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        cells.push(<rect key={`l${i}${j}`} x={5 + i * 6.2} y={43 + j * 5} width="5" height="4" fill="#0d1c38" />);
        cells.push(<rect key={`r${i}${j}`} x={71 + i * 6.2} y={43 + j * 5} width="5" height="4" fill="#0d1c38" />);
      }
    }
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible', display: 'block' }}
      >
        <defs>
          <linearGradient id={`${id}-metal`} x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#f2f5fa" />
            <stop offset="28%" stopColor="#b9c3d2" />
            <stop offset="55%" stopColor="#6b7686" />
            <stop offset="100%" stopColor="#222a36" />
          </linearGradient>
          <linearGradient id={`${id}-panel`} x1="0%" y1="0%" x2="100%" y2="20%">
            <stop offset="0%" stopColor="#2b5da8" />
            <stop offset="45%" stopColor="#15315e" />
            <stop offset="100%" stopColor="#0a1930" />
          </linearGradient>
        </defs>
        <rect x="3" y="41" width="27" height="18" rx="1" fill={`url(#${id}-panel)`} />
        <rect x="69" y="41" width="27" height="18" rx="1" fill={`url(#${id}-panel)`} />
        {cells}
        <rect x="3" y="41" width="27" height="18" rx="1" fill="none" stroke="#7f8ea6" strokeWidth="0.6" />
        <rect x="69" y="41" width="27" height="18" rx="1" fill="none" stroke="#7f8ea6" strokeWidth="0.6" />
        <rect x="30" y="49" width="10" height="2.4" fill="#9aa7bb" />
        <rect x="60" y="49" width="10" height="2.4" fill="#9aa7bb" />
        <rect x="40" y="33" width="20" height="34" rx="7" fill={`url(#${id}-metal)`} />
        <rect x="44" y="25" width="12" height="10" rx="3" fill={`url(#${id}-metal)`} />
        <rect x="40" y="33" width="20" height="34" rx="7" fill="none" stroke="#0a0e15" strokeOpacity="0.5" strokeWidth="0.6" />
        <circle cx="50" cy="45" r="3.2" fill="#0a1018" />
        <circle cx="50" cy="55" r="3.2" fill="#0a1018" />
        <circle cx="48.8" cy="43.8" r="1.1" fill="#9fd0ff" opacity="0.7" />
        <circle cx="50" cy="29" r="1.6" fill="#ff4a3d" />
      </svg>
    );
  }

  if (!painted) return null;

  if (kind === 'ringedPlanet') {
    // withRing pads the canvas to 1.9x to fit the ring, so the image is drawn
    // oversized and centred; otherwise this globe would read far smaller than
    // its neighbours. The button keeps the nominal size as its hit area.
    const box = size * 1.85;
    return (
      <div style={{ width: size, height: size, position: 'relative' }}>
        <div
          ref={mount(painted, box)}
          style={{ position: 'absolute', left: (size - box) / 2, top: (size - box) / 2 }}
        />
      </div>
    );
  }

  return <div ref={mount(painted, size)} style={{ width: size, height: size }} />;
}
