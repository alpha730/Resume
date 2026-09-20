import { useEffect, useRef } from 'react';

/**
 * Procedural golden nebula, drawn on a canvas — no video.
 *
 * The look comes from the reference clip: a near-black navy void, an amber
 * core burning through layered plumes, cool teal answering it at the edges,
 * and a dense starfield over the top.
 *
 * Plumes are generated once as fbm noise textures, then animated by slowly
 * rotating and drifting those textures against each other in 'lighter'
 * blend. Per-pixel noise every frame would be far too heavy to sit behind
 * the 3D card ring; this costs a handful of drawImage calls instead.
 */

const PLUMES = [
  { color: '#ff5a0e', scale: 1.30, spin: 0.0000110, drift: 0.000055, alpha: 0.85 }, // deep orange body
  { color: '#ff9a20', scale: 0.98, spin: -0.0000160, drift: 0.000082, alpha: 0.80 }, // amber mid
  { color: '#ffd873', scale: 0.62, spin: 0.0000240, drift: 0.000120, alpha: 0.62 }, // hot inner wisps
  { color: '#1aa3ad', scale: 1.50, spin: -0.0000085, drift: 0.000042, alpha: 0.55 }, // teal counter-tone
];

const STAR_COUNT = 300;
const TEXTURE_SIZE = 512;

interface Star {
  x: number;
  y: number;
  r: number;
  base: number;
  phase: number;
  speed: number;
}

/** Bilinear value noise summed over octaves, returned as a grayscale alpha map. */
function fbmTexture(size: number, seed: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);

  // Deterministic PRNG so the nebula is the same shape on every load.
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };

  // Pre-generate the coarsest lattice for each octave.
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
    const i = (xi: number, yi: number) => grid[((yi % g) + g) % g * g + (((xi % g) + g) % g)];
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

    const resize = () => {
      // Capped DPR: this sits behind a 3D transform layer, so fidelity here
      // matters far less than leaving headroom for the cards.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars = Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 0.9 + 0.25,
        base: Math.random() * 0.5 + 0.35,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.0016 + 0.0006,
      }));
    };

    resize();
    window.addEventListener('resize', resize);

    let frame = 0;

    const render = (time: number) => {
      const t = reduced ? 0 : time;

      // Deep space base — a navy that lifts very slightly toward the core.
      const base = ctx.createLinearGradient(0, 0, 0, h);
      base.addColorStop(0, '#03040c');
      base.addColorStop(0.55, '#070713');
      base.addColorStop(1, '#02030a');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);

      // Starfield sits under the plumes so the gas occludes it, as in the clip.
      for (const star of stars) {
        const twinkle = star.base + Math.sin(t * star.speed + star.phase) * 0.3;
        ctx.globalAlpha = Math.max(0.05, twinkle);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const cx = w / 2;
      const cy = h / 2;
      // Cover the viewport diagonal so rotation never exposes a texture corner.
      const span = Math.sqrt(w * w + h * h) * 1.15;

      ctx.globalCompositeOperation = 'lighter';
      for (const layer of layers) {
        const size = span * layer.scale;
        // Each layer drifts on its own slow Lissajous path, so the plumes
        // shear past each other instead of moving as one rigid image.
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

      // The burning core: a hot centre that breathes under the plumes.
      const breathe = 1 + Math.sin(t * 0.00022) * 0.12;
      // Pushed off-centre and to the left: the card ring occupies the middle
      // of the screen, so a centred core would simply be hidden behind it.
      const hotX = cx - w * 0.26;
      const hotY = cy - h * 0.10;
      const coreR = Math.min(w, h) * 0.46 * breathe;
      ctx.globalCompositeOperation = 'lighter';
      const core = ctx.createRadialGradient(hotX, hotY, 0, hotX, hotY, coreR);
      core.addColorStop(0, 'rgba(255, 238, 190, 0.42)');
      core.addColorStop(0.24, 'rgba(255, 150, 45, 0.30)');
      core.addColorStop(0.60, 'rgba(190, 70, 20, 0.12)');
      core.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, w, h);

      // Cool answering glow on the opposite side, as in the reference.
      const coolX = cx + w * 0.30;
      const coolY = cy + h * 0.16;
      const coolR = Math.min(w, h) * 0.42;
      const cool = ctx.createRadialGradient(coolX, coolY, 0, coolX, coolY, coolR);
      cool.addColorStop(0, 'rgba(40, 170, 180, 0.20)');
      cool.addColorStop(0.55, 'rgba(20, 90, 110, 0.08)');
      cool.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = cool;
      ctx.fillRect(0, 0, w, h);

      // Vignette pulls the eye back to the cards in the centre.
      ctx.globalCompositeOperation = 'source-over';
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
