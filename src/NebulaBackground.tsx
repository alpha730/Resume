import { useEffect, useRef } from 'react';

/**
 * A cluttered deep-field, drawn procedurally — no photograph, no video.
 *
 * The scene is built in depth-sorted layers so it reads as a volume of space
 * rather than a flat wallpaper:
 *
 *   nebula + stars  →  far decor (galaxies, distant worlds)
 *                   →  mid decor (asteroid belts, drifting rocks)
 *                   →  near decor (foreground boulders closing the corners)
 *
 * The nebula and starfield are redrawn every frame because they animate. The
 * three decor layers are static art, so each is rendered once into its own
 * offscreen canvas and blitted with a parallax offset — hundreds of shaded
 * rocks then cost three drawImage calls per frame instead of thousands of
 * path fills.
 */

const PLUMES = [
  { color: '#ff5a0e', scale: 1.30, spin: 0.0000110, drift: 0.000055, alpha: 0.85 }, // deep orange body
  { color: '#ff9a20', scale: 0.98, spin: -0.0000160, drift: 0.000082, alpha: 0.80 }, // amber mid
  { color: '#ffd873', scale: 0.62, spin: 0.0000240, drift: 0.000120, alpha: 0.62 }, // hot inner wisps
  { color: '#1aa3ad', scale: 1.50, spin: -0.0000085, drift: 0.000042, alpha: 0.55 }, // teal counter-tone
];

const STAR_COUNT = 340;
const TEXTURE_SIZE = 512;
/** Slack around each decor layer so parallax never exposes an edge. */
const MARGIN = 60;

interface Star {
  x: number;
  y: number;
  r: number;
  base: number;
  phase: number;
  speed: number;
  /** Only the brightest few get diffraction spikes. */
  spikes: boolean;
}

/** Deterministic PRNG — the scene must be identical on every load. */
function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Bilinear value noise summed over octaves, returned as a grayscale alpha map. */
function fbmTexture(size: number, seed: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const rand = prng(seed);

  const octaves = 7;
  const grids: number[][] = [];
  const sizes: number[] = [];
  for (let o = 0; o < octaves; o++) {
    const g = 4 << o; // 4 … 256, the fine end being what reads as filaments
    sizes.push(g);
    const grid = new Array(g * g);
    for (let i = 0; i < g * g; i++) grid[i] = rand();
    grids.push(grid);
  }

  const sample = (grid: number[], g: number, x: number, y: number) => {
    const gx = x * g;
    const gy = y * g;
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const fx = gx - x0;
    const fy = gy - y0;
    // Smoothstep keeps the lattice from showing as diamonds.
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const i = (xi: number, yi: number) => grid[(((yi % g) + g) % g) * g + (((xi % g) + g) % g)];
    const a = i(x0, y0);
    const b = i(x0 + 1, y0);
    const c = i(x0, y0 + 1);
    const d = i(x0 + 1, y0 + 1);
    return a * (1 - sx) * (1 - sy) + b * sx * (1 - sy) + c * (1 - sx) * sy + d * sx * sy;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;

      let value = 0;
      let amplitude = 0.5;
      let total = 0;
      for (let o = 0; o < octaves; o++) {
        value += sample(grids[o], sizes[o], u, v) * amplitude;
        total += amplitude;
        amplitude *= 0.62;
      }
      value /= total;

      // Push contrast so the plumes read as filaments, not flat fog.
      value = Math.pow(Math.max(0, value - 0.42) / 0.58, 2.1);

      // Radial falloff — the cloud has to dissolve before the texture edge,
      // otherwise the rotating squares become visible as hard seams.
      const dx = u - 0.5;
      const dy = v - 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy) * 2;
      const falloff = Math.max(0, 1 - dist * dist);

      const idx = (y * size + x) * 4;
      img.data[idx] = 255;
      img.data[idx + 1] = 255;
      img.data[idx + 2] = 255;
      img.data[idx + 3] = Math.min(255, value * falloff * 255 * 2.4);
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Tints a grayscale alpha map with a single colour. */
function tint(alphaMap: HTMLCanvasElement, color: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = alphaMap.width;
  canvas.height = alphaMap.height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(alphaMap, 0, 0);
  return canvas;
}

// ----------------------------------------------------------------- decor art

/** Face-on spiral: bright core, swept arms, a dust lane cutting across. */
function drawGalaxy(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rot: number,
  tiltY: number,
  arm: string,
  seed: number,
) {
  const rand = prng(seed);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(1, tiltY);
  ctx.globalCompositeOperation = 'lighter';

  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  halo.addColorStop(0, 'rgba(255, 240, 210, 0.42)');
  halo.addColorStop(0.18, `${arm}55`);
  halo.addColorStop(0.6, `${arm}1e`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Arms as stars scattered along two logarithmic spirals.
  for (let a = 0; a < 2; a++) {
    const offset = a * Math.PI;
    for (let i = 0; i < 260; i++) {
      const t = i / 260;
      const theta = offset + t * Math.PI * 2.1;
      const rad = r * 0.12 + t * r * 0.85;
      const px = Math.cos(theta) * rad + (rand() - 0.5) * r * 0.12;
      const py = Math.sin(theta) * rad + (rand() - 0.5) * r * 0.1;
      ctx.globalAlpha = (1 - t) * 0.5 + 0.08;
      ctx.fillStyle = rand() > 0.72 ? '#ffffff' : arm;
      ctx.beginPath();
      ctx.arc(px, py, rand() * 1.5 + 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.3);
  core.addColorStop(0, 'rgba(255,255,248,0.95)');
  core.addColorStop(0.35, 'rgba(255,226,170,0.55)');
  core.addColorStop(1, 'rgba(255,180,90,0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Dust lane — subtractive, so it has to leave 'lighter' behind.
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.1, r * 0.85, r * 0.06, 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** A distant world: lit limb, terminator falling away, optional ring. */
function drawPlanet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  hi: string,
  lo: string,
  opts: { ring?: boolean; ringTilt?: number; glow?: string } = {},
) {
  ctx.save();
  ctx.translate(x, y);

  if (opts.glow) {
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, r * 0.9, 0, 0, r * 1.7);
    g.addColorStop(0, opts.glow);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  // Back half of the ring, then the body, then the front half.
  if (opts.ring) {
    ctx.save();
    ctx.rotate(opts.ringTilt ?? -0.4);
    ctx.strokeStyle = 'rgba(210,190,160,0.30)';
    ctx.lineWidth = r * 0.16;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 2.0, r * 0.52, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  const body = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.05, 0, 0, r);
  body.addColorStop(0, hi);
  body.addColorStop(0.55, lo);
  body.addColorStop(1, '#05070c');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  if (opts.ring) {
    ctx.save();
    ctx.rotate(opts.ringTilt ?? -0.4);
    ctx.strokeStyle = 'rgba(225,205,175,0.42)';
    ctx.lineWidth = r * 0.16;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 2.0, r * 0.52, 0, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(255,225,190,0.30)';
  ctx.lineWidth = Math.max(0.6, r * 0.045);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.98, Math.PI * 0.72, Math.PI * 1.72);
  ctx.stroke();

  ctx.restore();
}

/**
 * Irregular shaded rock, lit from the upper left like everything else here.
 *
 * Detail scales with radius: gravel gets a plain silhouette, while a
 * foreground boulder gets a curved outline, many craters and a rim light,
 * because at that size a flat polygon reads as a paper cut-out.
 */
function drawRock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  seed: number,
  opts: { dark?: boolean } = {},
) {
  const rand = prng(seed);
  const points = Math.round(Math.min(22, Math.max(8, 8 + r / 14)));
  const radii: number[] = [];
  for (let i = 0; i < points; i++) radii.push(r * (0.66 + rand() * 0.44));

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rand() * Math.PI * 2);

  // Curved outline through vertex midpoints — organic, never faceted.
  const px = (i: number) => Math.cos((i / points) * Math.PI * 2) * radii[i % points];
  const py = (i: number) => Math.sin((i / points) * Math.PI * 2) * radii[i % points];
  ctx.beginPath();
  ctx.moveTo((px(0) + px(1)) / 2, (py(0) + py(1)) / 2);
  for (let i = 1; i <= points; i++) {
    const mx = (px(i) + px(i + 1)) / 2;
    const my = (py(i) + py(i + 1)) / 2;
    ctx.quadraticCurveTo(px(i), py(i), mx, my);
  }
  ctx.closePath();

  const shade = ctx.createRadialGradient(-r * 0.4, -r * 0.45, r * 0.05, 0, 0, r * 1.15);
  if (opts.dark) {
    // Foreground rock is mostly in shadow; only its lit shoulder catches light.
    shade.addColorStop(0, '#85786a');
    shade.addColorStop(0.35, '#443b31');
    shade.addColorStop(1, '#0c0a09');
  } else {
    shade.addColorStop(0, '#9c8d7c');
    shade.addColorStop(0.45, '#5d5246');
    shade.addColorStop(1, '#171310');
  }
  ctx.fillStyle = shade;
  ctx.fill();

  if (r > 7) {
    ctx.save();
    ctx.clip();

    const craters = opts.dark ? 10 + Math.floor(rand() * 10) : 2 + Math.floor(rand() * 3);
    for (let i = 0; i < craters; i++) {
      const cr = r * (0.06 + rand() * (opts.dark ? 0.16 : 0.2));
      const ccx = (rand() - 0.5) * r * 1.5;
      const ccy = (rand() - 0.5) * r * 1.5;
      ctx.fillStyle = opts.dark ? 'rgba(10,8,7,0.6)' : 'rgba(28,22,18,0.55)';
      ctx.beginPath();
      ctx.arc(ccx, ccy, cr, 0, Math.PI * 2);
      ctx.fill();
      // Lit inner wall on the side facing the light.
      ctx.fillStyle = opts.dark ? 'rgba(150,134,112,0.18)' : 'rgba(180,165,145,0.22)';
      ctx.beginPath();
      ctx.arc(ccx - cr * 0.28, ccy - cr * 0.28, cr * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Terminator: a soft shadow sweeping the unlit side.
    if (opts.dark) {
      const term = ctx.createLinearGradient(-r, -r, r, r);
      term.addColorStop(0, 'rgba(0,0,0,0)');
      term.addColorStop(0.45, 'rgba(0,0,0,0.25)');
      term.addColorStop(1, 'rgba(0,0,0,0.8)');
      ctx.fillStyle = term;
      ctx.fillRect(-r * 1.6, -r * 1.6, r * 3.2, r * 3.2);
    }
    ctx.restore();
  }

  if (opts.dark) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,215,170,0.24)';
    ctx.lineWidth = Math.max(1, r * 0.012);
    ctx.stroke();
  }

  ctx.restore();
}

/** A stream of rubble along a quadratic arc. */
function drawBelt(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  count: number,
  spread: number,
  maxR: number,
  seed: number,
) {
  const rand = prng(seed);
  for (let i = 0; i < count; i++) {
    const t = rand();
    const mt = 1 - t;
    const bx = mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
    const by = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
    const off = (rand() - 0.5) * spread;
    const perp = (rand() - 0.5) * spread * 0.6;
    // Biased small: a belt is mostly gravel with a few real rocks in it.
    const size = maxR * (0.12 + Math.pow(rand(), 2.2) * 0.9);
    drawRock(ctx, bx + off, by + perp, size, seed + i * 977);
  }
}

// ------------------------------------------------------------------ component

export default function NebulaBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const layers = PLUMES.map((plume, i) => ({
      ...plume,
      texture: tint(fbmTexture(TEXTURE_SIZE, 1337 + i * 7919), plume.color),
    }));

    let stars: Star[] = [];
    let w = 0;
    let h = 0;
    let far: HTMLCanvasElement | null = null;
    let mid: HTMLCanvasElement | null = null;
    let near: HTMLCanvasElement | null = null;

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    const makeLayer = (paint: (c: CanvasRenderingContext2D) => void) => {
      const c = document.createElement('canvas');
      c.width = w + MARGIN * 2;
      c.height = h + MARGIN * 2;
      const cc = c.getContext('2d')!;
      cc.translate(MARGIN, MARGIN);
      paint(cc);
      return c;
    };

    // Composition follows a deep-field photograph: galaxies and worlds pushed
    // to the edges, rubble streaming diagonally, boulders closing the corners.
    // The middle stays open so the interactive bodies keep their space.
    const buildDecor = () => {
      const s = Math.min(w, h);
      // Rubble is sized in absolute pixels, so without this a phone gets
      // boulders where a desktop gets gravel.
      const k = Math.min(1.15, Math.max(0.42, s / 900));

      far = makeLayer((c) => {
        drawGalaxy(c, w * 0.80, h * 0.09, s * 0.17, -0.5, 0.42, '#b9a6ff', 4211);
        drawGalaxy(c, w * 0.06, h * 0.52, s * 0.20, 0.35, 0.62, '#ffc79a', 991);
        drawGalaxy(c, w * 0.44, h * 0.90, s * 0.09, 1.1, 0.30, '#9fd8ff', 7717);

        drawPlanet(c, w * 0.965, h * 0.17, s * 0.075, '#3a3f52', '#14161f', { ring: true, ringTilt: -0.35 });
        drawPlanet(c, w * 0.235, h * 0.45, s * 0.022, '#c98d63', '#5a3520');
        drawPlanet(c, w * 0.61, h * 0.23, s * 0.030, '#b9b1a2', '#4a453c');
        drawPlanet(c, w * 0.905, h * 0.60, s * 0.018, '#8fa6c4', '#2c3546');
        drawPlanet(c, w * 0.035, h * 0.93, s * 0.085, '#6f86a8', '#1b2333', {
          glow: 'rgba(120,170,230,0.18)',
        });
        drawPlanet(c, w * 0.30, h * 0.92, s * 0.020, '#a89a88', '#3d362e');

        // Thin, distant rubble — small and low contrast, so it stays far away.
        drawBelt(c, w * 0.52, -h * 0.02, w * 0.78, h * 0.3, w * 1.02, h * 0.62, 150, 26 * k, 5 * k, 313);
      });

      mid = makeLayer((c) => {
        drawBelt(c, w * 0.46, -h * 0.05, w * 0.80, h * 0.34, w * 0.86, h * 1.05, 210, 40 * k, 11 * k, 5150);
        drawBelt(c, w * 1.02, h * 0.34, w * 0.72, h * 0.52, w * 0.36, h * 0.82, 90, 34 * k, 8 * k, 8123);
        drawRock(c, w * 0.40, h * 0.54, s * 0.022, 6011);
        drawRock(c, w * 0.53, h * 0.72, s * 0.016, 6421);
        drawRock(c, w * 0.88, h * 0.46, s * 0.020, 6733);
      });

      near = makeLayer((c) => {
        // Anchored off-canvas so they read as very close to the camera.
        drawRock(c, w * 1.04, h * 1.02, s * 0.46, 1777, { dark: true });
        drawRock(c, w * 0.86, h * 1.18, s * 0.22, 1801, { dark: true });
        drawRock(c, -w * 0.06, h * 1.10, s * 0.22, 2299, { dark: true });
        drawRock(c, w * 0.17, h * 1.20, s * 0.16, 2411, { dark: true });
        drawRock(c, -w * 0.03, h * -0.04, s * 0.13, 2833, { dark: true });
      });
    };

    const resize = () => {
      // Capped DPR: fidelity here matters far less than leaving headroom.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const rand = prng(20260921);
      stars = Array.from({ length: STAR_COUNT }, () => ({
        x: rand() * w,
        y: rand() * h,
        r: rand() * 0.9 + 0.25,
        base: rand() * 0.5 + 0.35,
        phase: rand() * Math.PI * 2,
        speed: rand() * 0.0016 + 0.0006,
        spikes: rand() > 0.955,
      }));

      buildDecor();
    };

    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      mouse.tx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      mouse.ty = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    };
    window.addEventListener('mousemove', onMouseMove);

    let frame = 0;

    const render = (time: number) => {
      const t = reduced ? 0 : time;
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      // Deep space base — a navy that lifts very slightly toward the core.
      const base = ctx.createLinearGradient(0, 0, 0, h);
      base.addColorStop(0, '#03040c');
      base.addColorStop(0.55, '#070713');
      base.addColorStop(1, '#02030a');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);

      // Starfield sits under the plumes so the gas occludes it.
      for (const star of stars) {
        const twinkle = star.base + Math.sin(t * star.speed + star.phase) * 0.3;
        const alpha = Math.max(0.05, twinkle);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();

        if (star.spikes) {
          // Four-point diffraction, the giveaway that a star is bright.
          const len = star.r * 16;
          ctx.globalAlpha = alpha * 0.4;
          ctx.strokeStyle = '#dfefff';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(star.x - len, star.y);
          ctx.lineTo(star.x + len, star.y);
          ctx.moveTo(star.x, star.y - len);
          ctx.lineTo(star.x, star.y + len);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      const cx = w / 2;
      const cy = h / 2;
      // Cover the viewport diagonal so rotation never exposes a texture corner.
      const span = Math.sqrt(w * w + h * h) * 1.15;

      ctx.globalCompositeOperation = 'lighter';
      for (const layer of layers) {
        const size = span * layer.scale;
        // Each layer drifts on its own slow path, so the plumes shear past
        // each other instead of moving as one rigid image.
        const dx = Math.sin(t * layer.drift) * w * 0.06;
        const dy = Math.cos(t * layer.drift * 0.77) * h * 0.05;
        const pulse = 1 + Math.sin(t * layer.drift * 1.3) * 0.06;

        ctx.save();
        ctx.translate(cx + dx, cy + dy);
        ctx.rotate(t * layer.spin);
        ctx.globalAlpha = layer.alpha;
        ctx.drawImage(layer.texture, (-size * pulse) / 2, (-size * pulse) / 2, size * pulse, size * pulse);
        ctx.restore();

        const fine = size * 0.46;
        ctx.save();
        ctx.translate(cx - dx * 1.4 + w * 0.05, cy - dy * 1.4 - h * 0.04);
        ctx.rotate(-t * layer.spin * 1.7);
        ctx.globalAlpha = layer.alpha * 0.72;
        ctx.drawImage(layer.texture, -fine / 2, -fine / 2, fine, fine);
        ctx.restore();
      }

      // The burning core, pushed off-centre so the bodies do not sit on it.
      const breathe = 1 + Math.sin(t * 0.00022) * 0.12;
      const hotX = cx - w * 0.26;
      const hotY = cy - h * 0.10;
      const coreR = Math.min(w, h) * 0.46 * breathe;
      const core = ctx.createRadialGradient(hotX, hotY, 0, hotX, hotY, coreR);
      core.addColorStop(0, 'rgba(255, 238, 190, 0.42)');
      core.addColorStop(0.24, 'rgba(255, 150, 45, 0.30)');
      core.addColorStop(0.60, 'rgba(190, 70, 20, 0.12)');
      core.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, w, h);

      // Cool answering glow on the opposite side.
      const coolX = cx + w * 0.30;
      const coolY = cy + h * 0.16;
      const coolR = Math.min(w, h) * 0.42;
      const cool = ctx.createRadialGradient(coolX, coolY, 0, coolX, coolY, coolR);
      cool.addColorStop(0, 'rgba(40, 170, 180, 0.20)');
      cool.addColorStop(0.55, 'rgba(20, 90, 110, 0.08)');
      cool.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = cool;
      ctx.fillRect(0, 0, w, h);

      // Depth layers, each riding the cursor a little harder than the last.
      ctx.globalCompositeOperation = 'source-over';
      const blit = (layer: HTMLCanvasElement | null, k: number) => {
        if (!layer) return;
        ctx.drawImage(layer, -MARGIN - mouse.x * k, -MARGIN - mouse.y * k * 0.7);
      };
      blit(far, 7);
      blit(mid, 18);
      blit(near, 38);

      // Vignette pulls the eye back to the centre.
      const vignette = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.25, cx, cy, Math.max(w, h) * 0.78);
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
