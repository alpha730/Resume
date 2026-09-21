import { useEffect, useRef, useState } from 'react';
import { renderGalaxy } from './spaceRender';

const ZOOM_DURATION = 1500; // ms from click to arriving inside the galaxy

/**
 * Background galaxies — decoration only, they just turn.
 *
 * Positions are fractions of the viewport, kept to the corners and edges so
 * they never crowd the main galaxy. Size is a fraction of the short side.
 * Varying inclination is what makes them read as different galaxies: near
 * face-on shows the spiral, near edge-on collapses to a streak.
 */
const BG_GALAXIES = [
  { x: 0.11, y: 0.19, size: 0.30, pa: 0.6, inc: 0.55, pitch: 0.36, spin: 0.000034, alpha: 0.8, seed: 1101 },
  { x: 0.88, y: 0.16, size: 0.24, pa: -1.1, inc: 0.3, pitch: 0.5, spin: -0.000046, alpha: 0.75, seed: 2203 },
  { x: 0.90, y: 0.80, size: 0.34, pa: 0.3, inc: 0.72, pitch: 0.48, spin: 0.000026, alpha: 0.8, seed: 3307 },
  { x: 0.12, y: 0.83, size: 0.22, pa: -0.4, inc: 0.24, pitch: 0.4, spin: -0.00004, alpha: 0.7, seed: 4409 },
  { x: 0.50, y: 0.08, size: 0.13, pa: 1.2, inc: 0.62, pitch: 0.44, spin: 0.00006, alpha: 0.65, seed: 5501 },
  { x: 0.66, y: 0.93, size: 0.15, pa: -0.9, inc: 0.45, pitch: 0.34, spin: -0.000052, alpha: 0.65, seed: 6607 },
];

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
  drift: number; // parallax factor: bigger/closer stars drift faster
  warm: boolean;
}

interface SpikedStar {
  x: number;
  y: number;
  size: number; // spike length
  color: string; // rgb triplet
  twinklePhase: number;
  twinkleSpeed: number;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1 -> 0
  decay: number;
}

interface GalaxyHeroProps {
  onOpen: () => void;
}

/**
 * Landing scene: a spiral galaxy hanging in deep space. Clicking dives into
 * its core and hands off to the star system inside it.
 *
 * The galaxy is rendered once, face-on, then tilted and slowly turned each
 * frame. Rotation is applied before the tilt so it spins in its own plane
 * the way a real inclined disc does, instead of spinning flat on screen.
 */
export default function GalaxyHero({ onOpen }: GalaxyHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const zoomStart = useRef<number | null>(null);
  const openFired = useRef(false);
  // Drives the hint text only; the canvas reads hover from its own loop.
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let cx = 0;
    let cy = 0;

    let stars: Star[] = [];
    let spiked: SpikedStar[] = [];
    let meteors: Meteor[] = [];
    let skyTex: HTMLCanvasElement | null = null;
    let galaxyTex: HTMLCanvasElement | null = null;
    let galaxyBorn = 0;
    let frameId = 0;

    // ---- hover state ----
    const mouse = { x: -9999, y: -9999 };
    let hoverT = 0; // eased 0 → 1 while the cursor is over the disc
    let hoverOn = false;
    let spin = 0; // accumulated so hovering can speed it up without a jump
    let lastNow = 0;
    // Scratch canvas for the cursor highlight: the galaxy masked to a soft
    // spot, so only stars and arms under the cursor light up, not empty space.
    let spot: HTMLCanvasElement | null = null;
    const bgTex: (HTMLCanvasElement | null)[] = BG_GALAXIES.map(() => null);
    const bgBorn: number[] = BG_GALAXIES.map(() => 0);
    const bgTimers: number[] = [];
    let spotCtx: CanvasRenderingContext2D | null = null;

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);

    // ---- faint background: distant galaxies and star dust, baked once ----
    const renderSky = () => {
      const tex = document.createElement('canvas');
      const tw = Math.round(width * 1.2);
      const th = Math.round(height * 1.2);
      tex.width = tw;
      tex.height = th;
      const tctx = tex.getContext('2d');
      if (!tctx) return null;

      tctx.globalCompositeOperation = 'lighter';

      // Fuzzy distant galaxies: tiny tilted ellipses.
      for (let i = 0; i < 22; i++) {
        const x = Math.random() * tw;
        const y = Math.random() * th;
        const gr = 3 + Math.random() * 9;
        const warm = Math.random() < 0.4;
        const rgb = warm ? '255, 220, 180' : '190, 210, 255';
        tctx.save();
        tctx.translate(x, y);
        tctx.rotate(Math.random() * Math.PI);
        tctx.scale(1, 0.35 + Math.random() * 0.4);
        const g = tctx.createRadialGradient(0, 0, 0, 0, 0, gr);
        g.addColorStop(0, `rgba(${rgb}, ${(0.3 + Math.random() * 0.25).toFixed(3)})`);
        g.addColorStop(1, `rgba(${rgb}, 0)`);
        tctx.fillStyle = g;
        tctx.beginPath();
        tctx.arc(0, 0, gr, 0, Math.PI * 2);
        tctx.fill();
        tctx.restore();
      }

      tctx.globalCompositeOperation = 'source-over';
      const dustCount = Math.round((tw * th) / 900);
      for (let i = 0; i < dustCount; i++) {
        const a = 0.05 + Math.random() * 0.3;
        tctx.fillStyle = `rgba(255, 255, 255, ${a.toFixed(3)})`;
        tctx.fillRect(Math.random() * tw, Math.random() * th, 1, 1);
      }

      return tex;
    };

    const build = () => {
      cx = width * 0.5;
      cy = height * 0.5;

      const starCount = Math.round((width * height) / 1400);
      stars = Array.from({ length: starCount }, () => {
        const r = 0.25 + Math.pow(Math.random(), 2.4) * 1.5;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r,
          baseAlpha: 0.2 + Math.random() * 0.6,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.0006 + Math.random() * 0.0022,
          drift: 0.25 + (r / 1.75) * 1.1,
          warm: Math.random() < 0.22,
        };
      });

      const spikeColors = ['210, 230, 255', '255, 255, 255', '255, 230, 190'];
      spiked = Array.from({ length: 9 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 9 + Math.random() * 26,
        color: spikeColors[Math.floor(Math.random() * spikeColors.length)],
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.0008 + Math.random() * 0.0018,
      }));

      skyTex = renderSky();
      meteors = [];
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      build();
    };

    resize();
    window.addEventListener('resize', resize);

    // The galaxy is the expensive part, so it is built after the first frame
    // and fades in — the sky appears instantly and the galaxy materialises.
    const galaxyTimer = window.setTimeout(() => {
      galaxyTex = renderGalaxy(820, 424242);
      galaxyBorn = performance.now();
      spot = document.createElement('canvas');
      spot.width = galaxyTex.width;
      spot.height = galaxyTex.height;
      spotCtx = spot.getContext('2d');

      // Background galaxies follow one per task, so no single task blocks
      // the frame loop for long.
      BG_GALAXIES.forEach((g, i) => {
        bgTimers.push(
          window.setTimeout(() => {
            bgTex[i] = renderGalaxy(300, g.seed, g.pitch);
            bgBorn[i] = performance.now();
          }, 60 * (i + 1)),
        );
      });
    }, 30);

    // Ease-in-cubic: the dive starts gently and accelerates into the core.
    const easeInCubic = (t: number) => t * t * t;

    const draw = (now: number) => {
      let zoomT = 0;
      if (zoomStart.current !== null) {
        zoomT = Math.min(1, (now - zoomStart.current) / ZOOM_DURATION);
      }
      const scale = 1 + easeInCubic(zoomT) * 14;
      const dt = lastNow ? Math.min(64, now - lastNow) : 16;
      lastNow = now;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#02020a';
      ctx.fillRect(0, 0, width, height);

      if (skyTex) {
        const t = now * 0.001;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.translate(
          -skyTex.width / 2 + Math.sin(t * 0.021) * width * 0.02,
          -skyTex.height / 2 + Math.cos(t * 0.017) * height * 0.02,
        );
        ctx.drawImage(skyTex, 0, 0);
        ctx.restore();
      }

      // ---- starfield: drifting with parallax ----
      const driftX = -0.045;
      const driftY = 0.018;
      for (const s of stars) {
        s.x += driftX * s.drift;
        s.y += driftY * s.drift;
        if (s.x < -4) s.x = width + 4;
        if (s.x > width + 4) s.x = -4;
        if (s.y < -4) s.y = height + 4;
        if (s.y > height + 4) s.y = -4;

        const twinkle = 0.55 + 0.45 * Math.sin(s.twinklePhase + now * s.twinkleSpeed);
        const a = (s.baseAlpha * twinkle).toFixed(3);
        ctx.fillStyle = s.warm ? `rgba(255, 214, 170, ${a})` : `rgba(255, 255, 255, ${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- bright stars with diffraction spikes ----
      for (const sp of spiked) {
        const tw = 0.65 + 0.35 * Math.sin(sp.twinklePhase + now * sp.twinkleSpeed);
        const len = sp.size * tw;

        const g = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, len * 0.45);
        g.addColorStop(0, `rgba(${sp.color}, ${(0.9 * tw).toFixed(3)})`);
        g.addColorStop(1, `rgba(${sp.color}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, len * 0.45, 0, Math.PI * 2);
        ctx.fill();

        for (let k = 0; k < 8; k++) {
          const ang = (k / 8) * Math.PI * 2 + Math.PI / 8;
          const L = k % 2 === 0 ? len : len * 0.45;
          const lg = ctx.createLinearGradient(sp.x, sp.y, sp.x + Math.cos(ang) * L, sp.y + Math.sin(ang) * L);
          lg.addColorStop(0, `rgba(${sp.color}, ${(0.75 * tw).toFixed(3)})`);
          lg.addColorStop(1, `rgba(${sp.color}, 0)`);
          ctx.strokeStyle = lg;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(sp.x, sp.y);
          ctx.lineTo(sp.x + Math.cos(ang) * L, sp.y + Math.sin(ang) * L);
          ctx.stroke();
        }
      }

      // ---- occasional shooting star ----
      if (Math.random() < 0.004 && meteors.length < 2) {
        const fromTop = Math.random() < 0.7;
        meteors.push({
          x: Math.random() * width,
          y: fromTop ? -10 : Math.random() * height * 0.4,
          vx: 3.5 + Math.random() * 4,
          vy: 2 + Math.random() * 2.5,
          life: 1,
          decay: 0.008 + Math.random() * 0.008,
        });
      }
      meteors = meteors.filter((m) => m.life > 0 && m.x < width + 60 && m.y < height + 60);
      for (const m of meteors) {
        m.x += m.vx;
        m.y += m.vy;
        m.life -= m.decay;
        const tailX = m.x - m.vx * 12;
        const tailY = m.y - m.vy * 12;
        const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${(0.8 * m.life).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }

      // ---- background galaxies: turning slowly, each at its own rate ----
      const short = Math.min(width, height);
      for (let i = 0; i < BG_GALAXIES.length; i++) {
        const tex = bgTex[i];
        if (!tex) continue;
        const g = BG_GALAXIES[i];
        const D = short * g.size;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = g.alpha * Math.min(1, (now - bgBorn[i]) / 1400);
        ctx.translate(width * g.x, height * g.y);
        ctx.rotate(g.pa);
        ctx.scale(1, g.inc);
        ctx.rotate(now * g.spin);
        ctx.drawImage(tex, -D / 2, -D / 2, D, D);
        ctx.restore();
      }

      // ---- the galaxy: everything from here zooms on click ----
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);

      if (galaxyTex) {
        const fadeIn = Math.min(1, (now - galaxyBorn) / 1400);
        // Major axis sized to the screen, capped so the tilted disc fits
        // vertically. Portrait phones have height to spare, so it can run
        // nearly edge to edge there.
        const D = Math.min(width * (width < 640 ? 1.05 : 0.66), height * 1.75);
        const PA = -0.38; // position angle on the sky
        const INC = 0.44; // inclination (minor/major axis ratio)

        // Hit-test against the tilted disc, not the screen: undo the position
        // angle and the inclination, then compare against the disc radius.
        const dx = mouse.x - cx;
        const dy = mouse.y - cy;
        const lx = dx * Math.cos(-PA) - dy * Math.sin(-PA);
        const ly = (dx * Math.sin(-PA) + dy * Math.cos(-PA)) / INC;
        const rNorm = Math.hypot(lx, ly) / (D / 2);
        const over = zoomT === 0 && fadeIn > 0.5 && rNorm < 0.8;
        if (over !== hoverOn) {
          hoverOn = over;
          setHovered(over);
        }
        hoverT += ((over ? 1 : 0) - hoverT) * 0.08;

        // Hovering quickens the spin; accumulating avoids a jump in angle.
        spin += dt * 0.000018 * (1 + hoverT * 5);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = fadeIn;
        ctx.translate(cx, cy);
        ctx.rotate(PA);
        ctx.scale(1, INC);
        ctx.rotate(spin); // spin in its own plane
        ctx.drawImage(galaxyTex, -D / 2, -D / 2, D, D);

        if (hoverT > 0.01) {
          // Whole disc lifts a little…
          ctx.globalAlpha = fadeIn * hoverT * 0.4;
          ctx.drawImage(galaxyTex, -D / 2, -D / 2, D, D);

          // …and the region under the cursor lights up. The cursor is taken
          // into the disc's own spinning frame, then the galaxy is masked to a
          // soft spot there and added back on top.
          if (spot && spotCtx) {
            const sx = lx * Math.cos(spin) + ly * Math.sin(spin);
            const sy = -lx * Math.sin(spin) + ly * Math.cos(spin);
            const T = spot.width;
            const tx = ((sx + D / 2) / D) * T;
            const ty = ((sy + D / 2) / D) * T;
            spotCtx.globalCompositeOperation = 'source-over';
            spotCtx.clearRect(0, 0, T, T);
            // Stacked additively: the outer disc is faint, and brightening a
            // faint region once barely registers.
            spotCtx.drawImage(galaxyTex, 0, 0);
            spotCtx.globalCompositeOperation = 'lighter';
            spotCtx.drawImage(galaxyTex, 0, 0);
            spotCtx.drawImage(galaxyTex, 0, 0);
            spotCtx.globalCompositeOperation = 'destination-in';
            const g = spotCtx.createRadialGradient(tx, ty, 0, tx, ty, T * 0.2);
            g.addColorStop(0, 'rgba(0,0,0,1)');
            g.addColorStop(0.45, 'rgba(0,0,0,0.5)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            spotCtx.fillStyle = g;
            spotCtx.fillRect(0, 0, T, T);
            // globalAlpha caps at 1, so a stronger highlight needs a second pass.
            ctx.globalAlpha = fadeIn * hoverT;
            ctx.drawImage(spot, -D / 2, -D / 2, D, D);
            ctx.drawImage(spot, -D / 2, -D / 2, D, D);
          }
        }
        ctx.restore();

        // Soft core bloom — the bulge overexposes, as it does in photographs,
        // and swells when the galaxy is hovered.
        const pulse = 1 + Math.sin(now * 0.0012) * 0.06;
        const bloomR = D * 0.09 * pulse * (1 + hoverT * 0.45);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = fadeIn;
        const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, bloomR);
        bloom.addColorStop(0, `rgba(255, 246, 226, ${(0.55 + hoverT * 0.3).toFixed(3)})`);
        bloom.addColorStop(0.4, `rgba(255, 214, 160, ${(0.16 + hoverT * 0.12).toFixed(3)})`);
        bloom.addColorStop(1, 'rgba(255, 190, 120, 0)');
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(cx, cy, bloomR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ---- the dive: the core flares, then the frame whites into black ----
      if (zoomT > 0) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const flare = Math.max(0, (zoomT - 0.35) / 0.4);
        if (flare > 0) {
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.8);
          g.addColorStop(0, `rgba(255, 240, 215, ${Math.min(0.9, flare * 0.9).toFixed(3)})`);
          g.addColorStop(1, 'rgba(255, 210, 160, 0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, width, height);
        }
        const fadeAlpha = Math.max(0, (zoomT - 0.72) / 0.28);
        if (fadeAlpha > 0) {
          ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha.toFixed(3)})`;
          ctx.fillRect(0, 0, width, height);
        }
        if (zoomT >= 1 && !openFired.current) {
          openFired.current = true;
          onOpen();
          return; // stop the loop; the scene is being unmounted
        }
      }

      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(galaxyTimer);
      bgTimers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [onOpen]);

  const startZoom = () => {
    if (zoomStart.current !== null) return;
    zoomStart.current = performance.now();
  };

  return (
    <div className="absolute inset-0 select-none overflow-hidden bg-[#02020a]">
      <canvas
        ref={canvasRef}
        onClick={startZoom}
        className="fixed top-0 left-0 w-full h-screen cursor-pointer"
        style={{ zIndex: 0 }}
      />
      <div
        className={`absolute bottom-8 inset-x-0 text-center font-mono-jb text-[10px] uppercase pointer-events-none z-10
          transition-all duration-500 ${hovered ? 'text-amber-200/90 tracking-[0.42em]' : 'text-white/30 tracking-[0.3em]'}`}
      >
        {hovered ? 'click to enter the galaxy' : 'click the galaxy to enter'}
      </div>
    </div>
  );
}
