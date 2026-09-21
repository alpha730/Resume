import { useEffect, useRef } from 'react';
import { renderGalaxy } from './spaceRender';

const ZOOM_DURATION = 1500; // ms from click to arriving inside the galaxy

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
    }, 30);

    // Ease-in-cubic: the dive starts gently and accelerates into the core.
    const easeInCubic = (t: number) => t * t * t;

    const draw = (now: number) => {
      let zoomT = 0;
      if (zoomStart.current !== null) {
        zoomT = Math.min(1, (now - zoomStart.current) / ZOOM_DURATION);
      }
      const scale = 1 + easeInCubic(zoomT) * 14;

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
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = fadeIn;
        ctx.translate(cx, cy);
        ctx.rotate(-0.38); // position angle on the sky
        ctx.scale(1, 0.44); // inclination
        ctx.rotate(now * 0.000018); // spin in its own plane
        ctx.drawImage(galaxyTex, -D / 2, -D / 2, D, D);
        ctx.restore();

        // Soft core bloom — the bulge overexposes, as it does in photographs.
        const pulse = 1 + Math.sin(now * 0.0012) * 0.06;
        const bloomR = D * 0.09 * pulse;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = fadeIn;
        const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, bloomR);
        bloom.addColorStop(0, 'rgba(255, 246, 226, 0.55)');
        bloom.addColorStop(0.4, 'rgba(255, 214, 160, 0.16)');
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
      window.removeEventListener('resize', resize);
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
      <div className="absolute bottom-8 inset-x-0 text-center font-mono-jb text-[10px] tracking-[0.3em] text-white/30 uppercase pointer-events-none z-10">
        click the galaxy to enter
      </div>
    </div>
  );
}
