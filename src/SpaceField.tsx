import { useState, useEffect, useRef } from 'react';
import NebulaBackground from './NebulaBackground';
import CelestialBody, { type BodyKind } from './CelestialBody';
import { SECTIONS } from './sections';

/**
 * The resume as a scattered star system: one celestial body per section,
 * drifting across the nebula. Clicking a body pulls it aside and opens the
 * detail panel with that section's content.
 *
 * Two transform layers per body, deliberately separated:
 *   - the outer element handles the open/close move, driven by CSS transition
 *   - the inner element handles drift and parallax, driven by rAF
 * Sharing one element would mean the animation frame fights the transition.
 */

interface Placement {
  kind: BodyKind;
  /** Position as a percentage of the viewport. */
  x: number;
  y: number;
  /** Diameter at desktop scale, in px. */
  size: number;
  /** Parallax weight — higher reads as nearer the camera. */
  depth: number;
  /** Drift speed and phase, so no two bodies move in step. */
  speed: number;
  phase: number;
  /** Degrees per second; 0 leaves the body unrotated. */
  spin: number;
  /**
   * Narrow screens need their own scatter: the desktop one pushes long
   * labels off the left edge and collides PROJECTS with CERTIFICATIONS.
   */
  mobile: { x: number; y: number };
}

// Hand-placed rather than random: the scatter has to stay legible, keep
// bodies off each other, and leave the centre readable.
const PLACEMENTS: Placement[] = [
  { kind: 'gasGiant', x: 19, y: 30, size: 168, depth: 1.0, speed: 0.10, phase: 0.0, spin: 0, mobile: { x: 30, y: 24 } },
  { kind: 'marsPlanet', x: 55, y: 15, size: 138, depth: 0.65, speed: 0.13, phase: 1.7, spin: 0, mobile: { x: 64, y: 11 } },
  { kind: 'crateredMoon', x: 81, y: 39, size: 116, depth: 1.15, speed: 0.16, phase: 3.1, spin: 1.5, mobile: { x: 74, y: 38 } },
  { kind: 'asteroidCluster', x: 34, y: 66, size: 146, depth: 0.8, speed: 0.11, phase: 4.6, spin: -4, mobile: { x: 36, y: 62 } },
  { kind: 'comet', x: 12, y: 71, size: 122, depth: 1.3, speed: 0.19, phase: 2.3, spin: 0, mobile: { x: 34, y: 82 } },
  { kind: 'terranPlanet', x: 67, y: 74, size: 130, depth: 0.55, speed: 0.12, phase: 5.4, spin: 0, mobile: { x: 72, y: 72 } },
  { kind: 'station', x: 46, y: 41, size: 150, depth: 1.45, speed: 0.22, phase: 0.9, spin: 0, mobile: { x: 30, y: 45 } },
];

interface SpaceFieldProps {
  onExit: () => void;
}

export default function SpaceField({ onExit }: SpaceFieldProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [viewport, setViewport] = useState({ w: 1440, h: 900 });

  // Keeps the panel populated through the closing slide.
  const lastFocused = useRef<number>(0);

  const driftRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Spin goes on the body alone — on the drift layer it turned the labels too.
  const spinRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const frame = useRef<number>(0);

  const open = focusedIndex !== null;
  if (focusedIndex !== null) lastFocused.current = focusedIndex;
  const panelSection = SECTIONS[focusedIndex ?? lastFocused.current];

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    onResize();

    const onMouseMove = (e: MouseEvent) => {
      mouse.current.targetX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      mouse.current.targetY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Escape backs out one level at a time.
      if (focusedIndex !== null) setFocusedIndex(null);
      else onExit();
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [focusedIndex, onExit]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tick = (time: number) => {
      // Damped follow, so parallax lags the cursor instead of snapping.
      mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.045;
      mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.045;

      const t = reduced ? 0 : time / 1000;

      for (let i = 0; i < PLACEMENTS.length; i++) {
        const el = driftRefs.current[i];
        if (!el) continue;
        const p = PLACEMENTS[i];

        const driftX = Math.sin(t * p.speed + p.phase) * 16;
        const driftY = Math.cos(t * p.speed * 0.83 + p.phase) * 12;
        const parX = -mouse.current.x * 26 * p.depth;
        const parY = -mouse.current.y * 18 * p.depth;
        el.style.transform = `translate(${(driftX + parX).toFixed(2)}px, ${(driftY + parY).toFixed(2)}px)`;

        const spinEl = spinRefs.current[i];
        if (spinEl && p.spin) spinEl.style.transform = `rotate(${(t * p.spin) % 360}deg)`;
      }

      frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, []);

  const spotFor = (p: Placement) => (viewport.w < 640 ? p.mobile : { x: p.x, y: p.y });

  // Where a body travels to when opened: left of the panel on desktop,
  // above it on narrow screens.
  const focusOffset = (p: Placement) => {
    const isDesktop = viewport.w >= 1024;
    const spot = spotFor(p);
    const targetX = isDesktop ? viewport.w * 0.26 : viewport.w * 0.5;
    const targetY = isDesktop ? viewport.h * 0.5 : viewport.h * 0.19;
    return {
      dx: targetX - (spot.x / 100) * viewport.w,
      dy: targetY - (spot.y / 100) * viewport.h,
    };
  };

  const scaleFor = (size: number) => {
    // Bodies shrink on small screens so the scatter still fits.
    const factor = Math.min(1, Math.max(0.52, viewport.w / 1440));
    return Math.round(size * factor);
  };

  return (
    <div className="absolute inset-0 bg-black text-white overflow-hidden select-none animate-fade-in">
      <NebulaBackground />

      {/* Clicking empty space closes the panel. */}
      <div className="absolute inset-0 z-[1]" onClick={() => setFocusedIndex(null)} />

      {SECTIONS.map((section, i) => {
        const p = PLACEMENTS[i];
        const spot = spotFor(p);
        const size = scaleFor(p.size);
        const isFocused = focusedIndex === i;
        const dimmed = open && !isFocused;
        const { dx, dy } = isFocused ? focusOffset(p) : { dx: 0, dy: 0 };

        return (
          <button
            key={section.id}
            type="button"
            aria-label={`Open ${section.title}`}
            onClick={(e) => {
              e.stopPropagation();
              setFocusedIndex(isFocused ? null : i);
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer bg-transparent border-0 p-0
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300/70 rounded-full"
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              zIndex: isFocused ? 30 : 10 + Math.round(p.depth * 5),
            }}
          >
            {/* Open/close travel — CSS transition, never touched by the rAF loop. */}
            <div
              className="transition-all duration-[900ms]"
              style={{
                transform: `translate(${dx}px, ${dy}px) scale(${isFocused ? 1.3 : 1})`,
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                opacity: dimmed ? 0.22 : 1,
                filter: dimmed ? 'saturate(0.4)' : 'none',
              }}
            >
              {/* Drift and parallax — rAF, never touched by the transition. */}
              <div
                ref={(el) => {
                  driftRefs.current[i] = el;
                }}
                className="flex flex-col items-center"
              >
                <div
                  className="transition-transform duration-500 ease-out"
                  style={{
                    transform: hovered === i && !open ? 'scale(1.09)' : 'scale(1)',
                    filter: isFocused
                      ? 'drop-shadow(0 0 40px rgba(255,190,110,0.55))'
                      : hovered === i
                        ? 'drop-shadow(0 0 22px rgba(255,190,110,0.45))'
                        : 'drop-shadow(0 0 10px rgba(0,0,0,0.6))',
                  }}
                >
                  <div
                    ref={(el) => {
                      spinRefs.current[i] = el;
                    }}
                  >
                    <CelestialBody kind={p.kind} uid={section.id} size={size} />
                  </div>
                </div>

                <div
                  className="mt-2 text-center font-mono-jb pointer-events-none transition-opacity duration-300"
                  style={{ opacity: isFocused ? 0 : 1 }}
                >
                  <div
                    className={`text-[10px] sm:text-[11px] tracking-[0.22em] uppercase transition-colors duration-300 ${
                      hovered === i ? 'text-amber-200' : 'text-white/60'
                    }`}
                  >
                    {section.title}
                  </div>
                  <div className="text-[8px] sm:text-[9px] tracking-[0.3em] text-white/25 mt-0.5">
                    {section.id}
                  </div>
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {/* ============ DETAIL PANEL ============
          Desktop: slides in from the right, beside the opened body.
          Mobile: rises from the bottom, under it. */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`fixed z-40 bg-[#0a0a0c]/90 backdrop-blur-xl border-white/10 cursor-default
          bottom-0 left-0 right-0 h-[58%] border-t rounded-t-2xl
          lg:top-0 lg:bottom-0 lg:left-auto lg:right-0 lg:h-full lg:w-[46%] lg:border-t-0 lg:border-l lg:rounded-none
          transition-transform duration-700
          ${open ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-y-0 lg:translate-x-full'}`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        <div key={focusedIndex ?? 'closed'} className="h-full overflow-y-auto px-7 sm:px-10 py-8 lg:py-14">
          <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <div className="font-mono-jb text-[10px] tracking-[0.3em] text-amber-300/80 uppercase">
              {panelSection.id} / 0{SECTIONS.length}
            </div>
            <div className="font-helv text-[26px] sm:text-[34px] font-bold tracking-tight text-white uppercase mt-1">
              {panelSection.title}
            </div>
            <div className="font-mono-jb text-[11px] text-white/50 tracking-[0.18em] mt-1">
              {panelSection.subtitle}
            </div>
            <div className="h-px bg-white/10 mt-5" />
          </div>

          <div className="mt-6 flex flex-col gap-6">
            {panelSection.detail.map((block, bi) => (
              <div key={bi} className="animate-fade-up" style={{ animationDelay: `${0.3 + bi * 0.12}s` }}>
                {block.heading && (
                  <div className="font-mono-jb text-[11px] sm:text-[12px] font-bold tracking-[0.16em] text-amber-200/90">
                    {block.heading}
                  </div>
                )}
                {block.lines.map((line, li) => (
                  <p key={li} className="font-mono-jb text-[12px] sm:text-[13px] leading-relaxed text-white/75 mt-2">
                    {line}
                  </p>
                ))}
                {block.link && (
                  <a
                    href={block.link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block font-mono-jb text-[12px] sm:text-[13px] mt-2 text-amber-300 underline underline-offset-2 hover:text-amber-200"
                  >
                    {block.link.label} ↗
                  </a>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setFocusedIndex(null)}
            className="mt-10 font-mono-jb text-[10px] tracking-[0.24em] text-white/50 hover:text-white transition-colors uppercase border border-white/15 hover:border-white/40 rounded-md px-3 py-1.5 cursor-pointer"
          >
            ← close
          </button>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onExit();
        }}
        className="absolute top-5 left-5 z-50 font-mono-jb text-[10px] tracking-[0.24em] text-white/50 hover:text-white transition-colors uppercase border border-white/15 hover:border-white/40 rounded-md px-3 py-1.5 bg-black/40 backdrop-blur-sm cursor-pointer"
      >
        ← esc / back to galaxy
      </button>

      <div className="absolute bottom-6 inset-x-0 text-center font-mono-jb text-[10px] tracking-[0.3em] text-white/25 uppercase pointer-events-none z-30">
        {open ? '' : 'click a body to open it'}
      </div>
    </div>
  );
}
