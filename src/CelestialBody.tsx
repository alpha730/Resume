/**
 * The seven bodies that stand in for the resume sections.
 *
 * Each one is inline SVG rather than an image or video: they have to scale
 * from ~60px on a phone to ~180px on a desktop, tint against the nebula, and
 * stay crisp while being scaled during the open animation.
 */

export type BodyKind =
  | 'gasGiant'
  | 'ringedPlanet'
  | 'crateredMoon'
  | 'asteroidCluster'
  | 'comet'
  | 'icePlanet'
  | 'station';

interface Props {
  kind: BodyKind;
  /** Unique suffix for gradient ids — duplicated ids would cross-tint bodies. */
  uid: string;
  size: number;
}

export default function CelestialBody({ kind, uid, size }: Props) {
  const id = (name: string) => `${name}-${uid}`;

  // Everything is drawn in a 100x100 box and scaled by the caller.
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 100 100',
    xmlns: 'http://www.w3.org/2000/svg',
    style: { overflow: 'visible' as const, display: 'block' as const },
  };

  switch (kind) {
    // Amber banded giant — the warmest body, pairs with the nebula core.
    case 'gasGiant':
      return (
        <svg {...common}>
          <defs>
            <radialGradient id={id('gg')} cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#ffd9a0" />
              <stop offset="35%" stopColor="#f59c3c" />
              <stop offset="70%" stopColor="#c2571a" />
              <stop offset="100%" stopColor="#3d1608" />
            </radialGradient>
            <clipPath id={id('ggClip')}>
              <circle cx="50" cy="50" r="38" />
            </clipPath>
          </defs>
          <circle cx="50" cy="50" r="46" fill="#ff9a3c" opacity="0.12" />
          <circle cx="50" cy="50" r="38" fill={`url(#${id('gg')})`} />
          <g clipPath={`url(#${id('ggClip')})`} opacity="0.42">
            <ellipse cx="50" cy="34" rx="42" ry="4.5" fill="#ffe0b0" opacity="0.5" />
            <ellipse cx="50" cy="46" rx="42" ry="3" fill="#8a3a10" />
            <ellipse cx="50" cy="58" rx="42" ry="5" fill="#ffc074" opacity="0.4" />
            <ellipse cx="50" cy="68" rx="42" ry="3.5" fill="#7a3210" />
          </g>
          <circle cx="50" cy="50" r="38" fill="none" stroke="#ffd9a0" strokeOpacity="0.35" />
        </svg>
      );

    // Ringed world — the rings read instantly as "orbit", so it carries EDUCATION.
    case 'ringedPlanet':
      return (
        <svg {...common}>
          <defs>
            <radialGradient id={id('rp')} cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#cfe4ff" />
              <stop offset="40%" stopColor="#6d92c9" />
              <stop offset="100%" stopColor="#16223d" />
            </radialGradient>
            <linearGradient id={id('rpRing')} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8fb6e8" stopOpacity="0.1" />
              <stop offset="35%" stopColor="#dbe9ff" stopOpacity="0.75" />
              <stop offset="65%" stopColor="#dbe9ff" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#8fb6e8" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="44" fill="#7fa8e0" opacity="0.10" />
          {/* Back half of the ring, then the planet, then the front half. */}
          <g transform="rotate(-18 50 50)">
            <path
              d="M6 50 A44 13 0 0 1 94 50"
              fill="none"
              stroke={`url(#${id('rpRing')})`}
              strokeWidth="5"
            />
          </g>
          <circle cx="50" cy="50" r="30" fill={`url(#${id('rp')})`} />
          <g transform="rotate(-18 50 50)">
            <path
              d="M94 50 A44 13 0 0 1 6 50"
              fill="none"
              stroke={`url(#${id('rpRing')})`}
              strokeWidth="5"
            />
          </g>
        </svg>
      );

    case 'crateredMoon':
      return (
        <svg {...common}>
          <defs>
            <radialGradient id={id('cm')} cx="33%" cy="28%" r="80%">
              <stop offset="0%" stopColor="#efeae0" />
              <stop offset="45%" stopColor="#a49c90" />
              <stop offset="100%" stopColor="#2b2721" />
            </radialGradient>
            <clipPath id={id('cmClip')}>
              <circle cx="50" cy="50" r="36" />
            </clipPath>
          </defs>
          <circle cx="50" cy="50" r="42" fill="#d8d0c0" opacity="0.08" />
          <circle cx="50" cy="50" r="36" fill={`url(#${id('cm')})`} />
          <g clipPath={`url(#${id('cmClip')})`} opacity="0.5">
            {[
              [38, 36, 7],
              [60, 44, 5],
              [46, 62, 8],
              [66, 68, 4],
              [30, 54, 4.5],
              [58, 26, 3.5],
            ].map(([cx, cy, r], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r} fill="#6f675c" opacity="0.6" />
                <circle cx={cx - r * 0.22} cy={cy - r * 0.22} r={r * 0.78} fill="#b8b0a2" opacity="0.5" />
              </g>
            ))}
          </g>
        </svg>
      );

    // A scatter of rocks rather than one body — PROJECTS is plural.
    case 'asteroidCluster':
      return (
        <svg {...common}>
          <defs>
            <radialGradient id={id('ast')} cx="32%" cy="28%" r="85%">
              <stop offset="0%" stopColor="#b9a894" />
              <stop offset="55%" stopColor="#6e6053" />
              <stop offset="100%" stopColor="#241e18" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="#c2a58a" opacity="0.07" />
          {/* Irregular silhouettes — deliberately not circles. */}
          <path
            d="M50 22 L64 28 L72 42 L66 58 L52 66 L36 60 L28 46 L34 30 Z"
            fill={`url(#${id('ast')})`}
            stroke="#d8c6ae"
            strokeOpacity="0.25"
          />
          <path
            d="M74 62 L84 66 L86 76 L78 82 L68 78 L66 68 Z"
            fill={`url(#${id('ast')})`}
            stroke="#d8c6ae"
            strokeOpacity="0.2"
          />
          <path
            d="M20 66 L28 68 L31 76 L25 82 L16 79 L14 71 Z"
            fill={`url(#${id('ast')})`}
            stroke="#d8c6ae"
            strokeOpacity="0.2"
          />
          <g opacity="0.45" fill="#3b332b">
            <circle cx="46" cy="38" r="4" />
            <circle cx="58" cy="50" r="3" />
            <circle cx="40" cy="52" r="2.5" />
          </g>
        </svg>
      );

    // Comet — a one-off arrival, which suits a certificate. The art stays
    // inside the upper two thirds of the box so the label below stays clear.
    case 'comet':
      return (
        <svg {...common}>
          <defs>
            <radialGradient id={id('cHead')} cx="38%" cy="34%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#ffe9a8" />
              <stop offset="100%" stopColor="#e08a2a" />
            </radialGradient>
            <radialGradient id={id('cGlow')} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffd07a" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ff9a3c" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={id('cTail')} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fff0c0" stopOpacity="0.9" />
              <stop offset="35%" stopColor="#ffb457" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ff7a1a" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Tapered plume: wide at the head, dissolving down-left. */}
          <path
            d="M68 30 Q40 46 10 76 Q30 58 42 56 Q30 62 20 74 Q44 50 68 44 Z"
            fill={`url(#${id('cTail')})`}
          />
          <path d="M66 34 Q44 48 18 72 Q46 54 68 42 Z" fill={`url(#${id('cTail')})`} opacity="0.55" />
          <circle cx="68" cy="34" r="24" fill={`url(#${id('cGlow')})`} />
          <circle cx="68" cy="34" r="10" fill={`url(#${id('cHead')})`} />
          <circle cx="65" cy="31" r="3.4" fill="#ffffff" opacity="0.85" />
        </svg>
      );

    case 'icePlanet':
      return (
        <svg {...common}>
          <defs>
            <radialGradient id={id('ip')} cx="34%" cy="28%" r="80%">
              <stop offset="0%" stopColor="#dffbff" />
              <stop offset="40%" stopColor="#4fb9c4" />
              <stop offset="100%" stopColor="#0c2f3a" />
            </radialGradient>
            <clipPath id={id('ipClip')}>
              <circle cx="50" cy="50" r="35" />
            </clipPath>
          </defs>
          {/* Atmospheric halo, the cool answer to the gas giant. */}
          <circle cx="50" cy="50" r="44" fill="#4fd0dd" opacity="0.13" />
          <circle cx="50" cy="50" r="39" fill="#4fd0dd" opacity="0.10" />
          <circle cx="50" cy="50" r="35" fill={`url(#${id('ip')})`} />
          <g clipPath={`url(#${id('ipClip')})`} opacity="0.35" fill="#eafcff">
            <ellipse cx="50" cy="22" rx="24" ry="8" />
            <ellipse cx="50" cy="78" rx="20" ry="7" />
            <ellipse cx="38" cy="52" rx="10" ry="4" opacity="0.6" />
          </g>
        </svg>
      );

    // Built, not born — a station for the one section about people and contact.
    case 'station':
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={id('st')} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e8eef7" />
              <stop offset="50%" stopColor="#95a3b8" />
              <stop offset="100%" stopColor="#3a4454" />
            </linearGradient>
            <linearGradient id={id('stPanel')} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1b3a6b" />
              <stop offset="50%" stopColor="#4d86d6" />
              <stop offset="100%" stopColor="#12294c" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="44" fill="#8fb6e8" opacity="0.08" />
          {/* Solar arrays */}
          <rect x="4" y="42" width="26" height="16" rx="1.5" fill={`url(#${id('stPanel')})`} />
          <rect x="70" y="42" width="26" height="16" rx="1.5" fill={`url(#${id('stPanel')})`} />
          <line x1="30" y1="50" x2="40" y2="50" stroke="#c3cddb" strokeWidth="2.5" />
          <line x1="60" y1="50" x2="70" y2="50" stroke="#c3cddb" strokeWidth="2.5" />
          {/* Core module */}
          <rect x="40" y="34" width="20" height="32" rx="6" fill={`url(#${id('st')})`} />
          <rect x="44" y="26" width="12" height="10" rx="3" fill={`url(#${id('st')})`} />
          <circle cx="50" cy="46" r="3.4" fill="#0e1520" />
          <circle cx="50" cy="56" r="3.4" fill="#0e1520" />
          <circle cx="50" cy="30" r="1.8" fill="#ff5f52" />
        </svg>
      );
  }
}
