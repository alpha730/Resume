import { useEffect, useRef } from 'react';

const ZOOM_DURATION = 1150; // ms from click to card deck

// Golden hover tint (r, g, b)
const GOLD = { r: 255, g: 196, b: 92 };
const WHITE = { r: 255, g: 255, b: 255 };

// Linear blend white -> gold by t in [0, 1]
const tint = (t: number, alpha: number) => {
  const r = Math.round(WHITE.r + (GOLD.r - WHITE.r) * t);
  const g = Math.round(WHITE.g + (GOLD.g - WHITE.g) * t);
  const b = Math.round(WHITE.b + (GOLD.b - WHITE.b) * t);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
};

interface ClusterNode {
  angle: number; // polar position around the cluster center
  radius: number;
  angularVel: number;
  wobblePhase: number;
  wobbleSpeed: number;
  r: number; // draw size
  x: number;
  y: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
  drift: number; // parallax factor: bigger/closer stars drift faster
  warm: boolean; // a fraction of stars are warm-tinted like the photo
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

interface Packet {
  from: number;
  to: number;
  t: number;
  speed: number;
}

interface NetworkHeroProps {
  onOpen: () => void;
}

/**
 * Hero scene: a white "system network" cluster with golden highlights,
 * floating inside a JWST-style deep field — a ring of rust-orange dust
 * clouds with a magenta core and blue-teal haze (pre-rendered to a texture
 * that slowly drifts and rotates), dense drifting micro-stars, bright stars
 * with diffraction spikes, fuzzy galaxies, and occasional meteors.
 * Clicking zooms into the cluster core, then hands off to the card deck.
 */
export default function NetworkHero({ onOpen }: NetworkHeroProps) {
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
    let cx = 0; // cluster center
    let cy = 0;
    let clusterMaxR = 0;

    let cluster: ClusterNode[] = [];
    let stars: Star[] = [];
    let spiked: SpikedStar[] = [];
    let meteors: Meteor[] = [];
    let packets: Packet[] = [];
    let skyTex: HTMLCanvasElement | null = null;
    const mouse = { x: -9999, y: -9999 };
    let frameId = 0;

    // ---- pre-render the nebula + galaxies to an offscreen texture ----
    // Rich layered gradients are expensive; baking them once keeps the
    // render loop at 60fps. The texture is oversized so it can drift.
    const renderSky = () => {
      const tex = document.createElement('canvas');
      const tw = Math.round(width * 1.3);
      const th = Math.round(height * 1.3);
      tex.width = tw;
      tex.height = th;
      const tctx = tex.getContext('2d');
      if (!tctx) return null;

      const tcx = tw / 2;
      const tcy = th / 2;
      const ringR = Math.min(tw, th) * 0.38;

      const blob = (x: number, y: number, r: number, rgb: string, a: number) => {
        const g = tctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${rgb}, ${a.toFixed(3)})`);
        g.addColorStop(0.55, `rgba(${rgb}, ${(a * 0.45).toFixed(3)})`);
        g.addColorStop(1, `rgba(${rgb}, 0)`);
        tctx.fillStyle = g;
        tctx.beginPath();
        tctx.arc(x, y, r, 0, Math.PI * 2);
        tctx.fill();
      };

      tctx.globalCompositeOperation = 'lighter';

      // Deep violet base wash
      blob(tcx, tcy, Math.min(tw, th) * 0.75, '60, 40, 110', 0.10);

      // Ring of rust-orange / red dust clouds (the wreath in the photo)
      const dustColors = ['255, 110, 50', '230, 80, 55', '255, 150, 70', '200, 60, 70'];
      for (let i = 0; i < 42; i++) {
        const ang = (i / 42) * Math.PI * 2 + Math.random() * 0.3;
        const rr = ringR * (0.85 + Math.random() * 0.35);
        const x = tcx + Math.cos(ang) * rr;
        const y = tcy + Math.sin(ang) * rr * 0.78;
        blob(
          x,
          y,
          Math.min(tw, th) * (0.06 + Math.random() * 0.11),
          dustColors[Math.floor(Math.random() * dustColors.length)],
          0.05 + Math.random() * 0.06,
        );
      }

      // Magenta / pink core glow
      const pinkColors = ['255, 90, 160', '230, 120, 200', '255, 130, 180'];
      for (let i = 0; i < 14; i++) {
        const ang = Math.random() * Math.PI * 2;
        const rr = ringR * 0.45 * Math.random();
        blob(
          tcx + Math.cos(ang) * rr,
          tcy + Math.sin(ang) * rr * 0.8,
          Math.min(tw, th) * (0.08 + Math.random() * 0.12),
          pinkColors[Math.floor(Math.random() * pinkColors.length)],
          0.035 + Math.random() * 0.045,
        );
      }

      // Blue-teal haze inside the ring
      const blueColors = ['90, 160, 220', '100, 200, 210', '120, 140, 230'];
      for (let i = 0; i < 12; i++) {
        const ang = Math.random() * Math.PI * 2;
        const rr = ringR * 0.6 * Math.random();
        blob(
          tcx + Math.cos(ang) * rr,
          tcy + Math.sin(ang) * rr,
          Math.min(tw, th) * (0.07 + Math.random() * 0.1),
          blueColors[Math.floor(Math.random() * blueColors.length)],
          0.03 + Math.random() * 0.04,
        );
      }

      // Fuzzy distant galaxies: tiny tilted ellipses
      for (let i = 0; i < 16; i++) {
        const x = Math.random() * tw;
        const y = Math.random() * th;
        const gr = 3 + Math.random() * 9;
        const rot = Math.random() * Math.PI;
        const warm = Math.random() < 0.4;
        const rgb = warm ? '255, 220, 180' : '190, 210, 255';
        tctx.save();
        tctx.translate(x, y);
        tctx.rotate(rot);
        tctx.scale(1, 0.35 + Math.random() * 0.4);
        const g = tctx.createRadialGradient(0, 0, 0, 0, 0, gr);
        g.addColorStop(0, `rgba(${rgb}, ${(0.35 + Math.random() * 0.25).toFixed(3)})`);
        g.addColorStop(1, `rgba(${rgb}, 0)`);
        tctx.fillStyle = g;
        tctx.beginPath();
        tctx.arc(0, 0, gr, 0, Math.PI * 2);
        tctx.fill();
        tctx.restore();
      }

      // Micro star dust baked into the texture (thousands of sub-pixel dots)
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
      clusterMaxR = Math.min(width, height) * 0.34;

      const clusterCount = Math.max(60, Math.min(110, Math.round((width * height) / 16000)));
      cluster = Array.from({ length: clusterCount }, () => {
        // Bias radius toward the middle of the cluster for a dense core
        const radius = Math.pow(Math.random(), 0.65) * clusterMaxR;
        return {
          angle: Math.random() * Math.PI * 2,
          radius,
          angularVel: (Math.random() - 0.5) * 0.0016 + (Math.random() < 0.5 ? -0.0006 : 0.0006),
          wobblePhase: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.004 + Math.random() * 0.01,
          r: 1.3 + Math.random() * 2.2,
          x: 0,
          y: 0,
        };
      });

      // Dense drifting starfield (parallax: closer stars move faster)
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

      // A handful of bright stars with diffraction spikes
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
      packets = [];
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

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);

    const linkDist = () => Math.min(150, clusterMaxR * 0.42);

    const spawnPacket = () => {
      const a = Math.floor(Math.random() * cluster.length);
      const maxD = linkDist();
      const candidates: number[] = [];
      for (let b = 0; b < cluster.length; b++) {
        if (b === a) continue;
        const dx = cluster[a].x - cluster[b].x;
        const dy = cluster[a].y - cluster[b].y;
        if (dx * dx + dy * dy < maxD * maxD) candidates.push(b);
      }
      if (candidates.length > 0) {
        packets.push({
          from: a,
          to: candidates[Math.floor(Math.random() * candidates.length)],
          t: 0,
          speed: 0.012 + Math.random() * 0.018,
        });
      }
    };

    // Ease-in-cubic: the zoom starts gently and accelerates into the core
    const easeInCubic = (t: number) => t * t * t;

    const draw = (now: number) => {
      // ---- camera / zoom ----
      let zoomT = 0;
      if (zoomStart.current !== null) {
        zoomT = Math.min(1, (now - zoomStart.current) / ZOOM_DURATION);
      }
      const scale = 1 + easeInCubic(zoomT) * 11;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // ---- nebula texture: slow drift + rotation + gentle breathing ----
      if (skyTex) {
        const t = now * 0.001;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.sin(t * 0.013) * 0.05);
        const breathe = 1.02 + Math.sin(t * 0.05) * 0.02;
        ctx.scale(breathe, breathe);
        ctx.translate(
          -skyTex.width / 2 + Math.sin(t * 0.021) * width * 0.03,
          -skyTex.height / 2 + Math.cos(t * 0.017) * height * 0.03,
        );
        ctx.drawImage(skyTex, 0, 0);
        ctx.restore();
      }

      // ---- starfield: drifting with parallax ----
      const driftX = -0.045; // slow voyage direction: left and slightly down
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

        // glow core
        const g = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, len * 0.45);
        g.addColorStop(0, `rgba(${sp.color}, ${(0.9 * tw).toFixed(3)})`);
        g.addColorStop(1, `rgba(${sp.color}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, len * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // 4 long cross spikes + 4 shorter diagonals
        for (let k = 0; k < 8; k++) {
          const ang = (k / 8) * Math.PI * 2 + Math.PI / 8;
          const L = k % 2 === 0 ? len : len * 0.45;
          const lg = ctx.createLinearGradient(
            sp.x,
            sp.y,
            sp.x + Math.cos(ang) * L,
            sp.y + Math.sin(ang) * L,
          );
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

      // ---- camera transform: everything below zooms on click ----
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);

      // ---- advance cluster nodes (slow orbit + radial wobble) ----
      for (const n of cluster) {
        n.angle += n.angularVel;
        n.wobblePhase += n.wobbleSpeed;
        const wobble = Math.sin(n.wobblePhase) * clusterMaxR * 0.04;
        const r = n.radius + wobble;
        n.x = cx + Math.cos(n.angle) * r;
        n.y = cy + Math.sin(n.angle) * r * 0.86; // slightly elliptical
      }

      // ---- cluster links: white, warming to gold near the cursor ----
      const maxD = linkDist();
      for (let i = 0; i < cluster.length; i++) {
        for (let j = i + 1; j < cluster.length; j++) {
          const a = cluster[i];
          const b = cluster[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > maxD * maxD) continue;

          const dist = Math.sqrt(distSq);
          let alpha = (1 - dist / maxD) * 0.17;

          const mx = (a.x + b.x) / 2 - mouse.x;
          const my = (a.y + b.y) / 2 - mouse.y;
          const mDist = Math.sqrt(mx * mx + my * my);
          let goldT = 0;
          if (mDist < 200) {
            goldT = 1 - mDist / 200;
            alpha += goldT * 0.3;
          }

          ctx.strokeStyle = tint(goldT, alpha);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // ---- cluster nodes: white, golden glow near the cursor ----
      for (const n of cluster) {
        const mx = n.x - mouse.x;
        const my = n.y - mouse.y;
        const mDist = Math.sqrt(mx * mx + my * my);
        const goldT = mDist < 200 ? 1 - mDist / 200 : 0;

        // Soft golden halo around hovered nodes
        if (goldT > 0.15) {
          ctx.fillStyle = tint(1, goldT * 0.18);
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = tint(goldT, 0.5 + goldT * 0.45);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- pulsing core hub: bright white with a faint golden rim ----
      const pulse = 1 + Math.sin(now * 0.003) * 0.25;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26 * pulse);
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      coreGrad.addColorStop(0.35, 'rgba(255, 235, 200, 0.35)');
      coreGrad.addColorStop(1, 'rgba(255, 196, 92, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 26 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // ---- data packets: warm golden sparks ----
      if (Math.random() < 0.14 && packets.length < 22) spawnPacket();
      packets = packets.filter((p) => p.t <= 1);
      for (const p of packets) {
        p.t += p.speed;
        const a = cluster[p.from];
        const b = cluster[p.to];
        if (!a || !b) continue;
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        const fade = Math.min(1, Math.min(p.t, 1 - p.t) * 6);

        ctx.fillStyle = `rgba(255, 244, 220, ${(0.95 * fade).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 196, 92, ${(0.3 * fade).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- fade to black at the end of the zoom, then open the deck ----
      if (zoomT > 0) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const fadeAlpha = Math.max(0, (zoomT - 0.55) / 0.45);
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
      {/* The deep-field scene — the whole canvas is the click target */}
      <canvas
        ref={canvasRef}
        onClick={startZoom}
        className="fixed top-0 left-0 w-full h-screen cursor-pointer"
        style={{ zIndex: 0 }}
      />
    </div>
  );
}
