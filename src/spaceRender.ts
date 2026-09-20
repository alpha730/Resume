/**
 * Per-pixel renderers for the bodies in the scene.
 *
 * Flat SVG gradients read as cartoon art. Photographs of planets have four
 * things vector shapes cannot fake, so every renderer here does them:
 *
 *   1. surface texture from fbm noise, sampled in spherical coordinates
 *   2. Lambert shading against a fixed light, giving a hard terminator
 *   3. limb darkening — a sphere dims toward its edge, it does not just end
 *   4. atmospheric scattering as a thin bright rim on the lit limb
 *
 * Everything is rendered once into an offscreen canvas at load and then
 * treated as an image, so the per-pixel cost never touches the frame loop.
 */

/** Deterministic PRNG — the scene must be identical on every load. */
export function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Value noise on a wrapping lattice.
 *
 * The lattice has to wrap in x, or the seam where longitude comes back round
 * to 0 shows as a visible stripe down the planet.
 */
function makeNoise(seed: number, period: number) {
  const rand = prng(seed);
  const g = new Float32Array(period * period);
  for (let i = 0; i < g.length; i++) g[i] = rand();

  return (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = x - xi;
    const fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const at = (a: number, b: number) =>
      g[(((b % period) + period) % period) * period + (((a % period) + period) % period)];
    const a = at(xi, yi);
    const b = at(xi + 1, yi);
    const c = at(xi, yi + 1);
    const d = at(xi + 1, yi + 1);
    return a * (1 - sx) * (1 - sy) + b * sx * (1 - sy) + c * (1 - sx) * sy + d * sx * sy;
  };
}

function makeFbm(seed: number, octaves = 5, period = 64) {
  const noise = makeNoise(seed, period);
  return (x: number, y: number) => {
    let v = 0;
    let amp = 0.5;
    let freq = 1;
    let total = 0;
    for (let o = 0; o < octaves; o++) {
      v += noise(x * freq, y * freq) * amp;
      total += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return v / total;
  };
}

type RGB = [number, number, number];

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Samples a colour ramp defined as [position, colour] stops. */
function ramp(stops: [number, RGB][], t: number): RGB {
  if (t <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [p0, c0] = stops[i - 1];
      const [p1, c1] = stops[i];
      return mix(c0, c1, (t - p0) / (p1 - p0));
    }
  }
  return stops[stops.length - 1][1];
}

// Light comes from the upper left, everywhere, always.
const LIGHT: RGB = [-0.52, -0.58, 0.63];
const LIGHT_LEN = Math.hypot(LIGHT[0], LIGHT[1], LIGHT[2]);
const LX = LIGHT[0] / LIGHT_LEN;
const LY = LIGHT[1] / LIGHT_LEN;
const LZ = LIGHT[2] / LIGHT_LEN;

export type PlanetType = 'gas' | 'ice' | 'rocky' | 'terran' | 'neptunian' | 'martian';

export interface PlanetOptions {
  type: PlanetType;
  seed: number;
  /** Fraction of the canvas the globe occupies, leaving room for glow/rings. */
  fill?: number;
  atmosphere?: RGB;
  ring?: { inner: number; outer: number; tilt: number; color: RGB; opacity: number };
  /** Night side brightness — 0 is airless and black, higher reads as hazy. */
  ambient?: number;
}

const PALETTES: Record<PlanetType, [number, RGB][]> = {
  // Jupiter: cream bands over rust, with dark belts between.
  gas: [
    [0.0, [92, 54, 32]],
    [0.3, [158, 104, 62]],
    [0.5, [214, 173, 128]],
    [0.68, [238, 218, 186]],
    [0.85, [201, 146, 92]],
    [1.0, [120, 70, 40]],
  ],
  // Enceladus-white with faint blue in the cracks.
  ice: [
    [0.0, [120, 158, 178]],
    [0.4, [186, 214, 228]],
    [0.72, [226, 240, 246]],
    [1.0, [248, 252, 255]],
  ],
  // Lunar regolith: narrow value range, which is what makes it read as rock.
  rocky: [
    [0.0, [58, 53, 48]],
    [0.35, [104, 98, 90]],
    [0.62, [146, 139, 128]],
    [0.85, [178, 171, 160]],
    [1.0, [206, 200, 190]],
  ],
  // Ocean, shelf, land, arid highland.
  terran: [
    [0.0, [8, 24, 56]],
    [0.46, [16, 52, 96]],
    [0.5, [28, 86, 120]],
    [0.54, [58, 96, 58]],
    [0.68, [92, 116, 62]],
    [0.82, [140, 122, 82]],
    [1.0, [206, 198, 184]],
  ],
  // Mars: iron oxide. Dark basalt lowlands through rust to pale dust.
  martian: [
    [0.0, [78, 40, 28]],
    [0.22, [116, 56, 34]],
    [0.45, [158, 80, 44]],
    [0.66, [192, 108, 62]],
    [0.84, [214, 146, 96]],
    [1.0, [232, 186, 144]],
  ],
  // Neptune: deep blue with lighter banding.
  neptunian: [
    [0.0, [16, 38, 96]],
    [0.35, [36, 76, 154]],
    [0.6, [72, 122, 196]],
    [0.82, [132, 176, 224]],
    [1.0, [198, 222, 244]],
  ],
};

/**
 * Renders a lit, textured globe.
 *
 * The surface is a height/albedo field sampled in spherical coordinates. Its
 * gradient perturbs the sphere normal, which is what makes craters and storm
 * bands catch light rather than look painted on.
 */
export function renderPlanet(size: number, opts: PlanetOptions): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const data = img.data;

  const fill = opts.fill ?? 0.78;
  const R = (size / 2) * fill;
  const cx = size / 2;
  const cy = size / 2;
  const ambient = opts.ambient ?? 0.045;

  const fbm = makeFbm(opts.seed, 5, 64);
  const detail = makeFbm(opts.seed + 7919, 4, 64);
  const rand = prng(opts.seed + 33);

  // Craters live in spherical coordinates so they stay round near the limb.
  const craters: { lon: number; lat: number; r: number; depth: number }[] = [];
  if (opts.type === 'rocky' || opts.type === 'martian') {
    const isMoon = opts.type === 'rocky';
    for (let i = 0; i < (isMoon ? 46 : 22); i++) {
      craters.push({
        lon: rand() * Math.PI * 2,
        lat: Math.asin(rand() * 2 - 1),
        r: 0.05 + Math.pow(rand(), 2.4) * (isMoon ? 0.30 : 0.2),
        depth: (isMoon ? 0.35 : 0.18) + rand() * (isMoon ? 0.65 : 0.34),
      });
    }
  }

  /** Surface field in [0,1]: albedo for banded worlds, height for rock. */
  const surface = (lon: number, lat: number): number => {
    switch (opts.type) {
      case 'gas': {
        // Bands run along latitude; noise warps them so they are not stripes.
        const warp = fbm(lon * 1.6, lat * 2.2) - 0.5;
        const bands = Math.sin(lat * 9.0 + warp * 3.4);
        const turbulence = detail(lon * 4.0, lat * 6.0) - 0.5;
        return Math.min(1, Math.max(0, 0.5 + bands * 0.33 + turbulence * 0.34));
      }
      case 'neptunian': {
        const warp = fbm(lon * 1.2, lat * 1.8) - 0.5;
        const bands = Math.sin(lat * 6.0 + warp * 2.6);
        return Math.min(1, Math.max(0, 0.52 + bands * 0.22 + (detail(lon * 3, lat * 4) - 0.5) * 0.26));
      }
      case 'ice': {
        const v = fbm(lon * 2.4, lat * 2.4);
        const cracks = Math.abs(detail(lon * 5, lat * 5) - 0.5) * 2;
        return Math.min(1, Math.max(0, v * 0.55 + 0.45 - Math.pow(1 - cracks, 8) * 0.5));
      }
      case 'terran': {
        // Continents from ridged noise; the 0.5 stop in the ramp is sea level.
        const c = fbm(lon * 1.5, lat * 1.5);
        const d = detail(lon * 4, lat * 4);
        return Math.min(1, Math.max(0, c * 0.78 + d * 0.22));
      }
      case 'martian': {
        // Big albedo provinces — the dark patches that are visible from Earth
        // — over finer dust and ridges.
        const province = fbm(lon * 1.15, lat * 1.15);
        const dust = detail(lon * 4.5, lat * 4.5);
        let v = province * 0.62 + dust * 0.38;
        // A ridged component reads as canyon and scarp rather than rolling hills.
        v += (1 - Math.abs(detail(lon * 2.6 + 9, lat * 2.6) - 0.5) * 2) * 0.1;
        // Stretch around the midpoint: fbm clusters near 0.5, which left the
        // whole globe one flat orange instead of dark basalt against pale dust.
        v = (v - 0.52) * 1.75 + 0.5;
        for (const c of craters) {
          if (Math.abs(lat - c.lat) > c.r) continue;
          const dl = Math.abs(lon - c.lon);
          const dLon = Math.min(dl, Math.PI * 2 - dl);
          const d = Math.hypot(dLon * Math.cos((lat + c.lat) / 2), lat - c.lat);
          if (d < c.r) {
            const t = d / c.r;
            const rim = Math.exp(-Math.pow((t - 0.82) / 0.16, 2)) * 0.4;
            const floor = -(1 - Math.pow(t / 0.82, 2)) * c.depth * 0.34;
            v += (t < 0.82 ? floor : 0) + rim * c.depth;
          }
        }
        return Math.min(1, Math.max(0, v));
      }
      case 'rocky': {
        let v = fbm(lon * 2.2, lat * 2.2) * 0.72 + detail(lon * 7, lat * 7) * 0.28;
        for (const c of craters) {
          // Cheap latitude reject first — most craters are nowhere near.
          if (Math.abs(lat - c.lat) > c.r) continue;
          // Angular distance on the sphere.
          const dl = Math.abs(lon - c.lon);
          const dLon = Math.min(dl, Math.PI * 2 - dl);
          const d = Math.hypot(dLon * Math.cos((lat + c.lat) / 2), lat - c.lat);
          if (d < c.r) {
            const t = d / c.r;
            // Raised rim, sunken floor — the profile that makes a crater read.
            const rim = Math.exp(-Math.pow((t - 0.82) / 0.16, 2)) * 0.5;
            const floor = -(1 - Math.pow(t / 0.82, 2)) * c.depth * 0.42;
            v += (t < 0.82 ? floor : 0) + rim * c.depth;
          }
        }
        return Math.min(1, Math.max(0, v));
      }
    }
  };

  const palette = PALETTES[opts.type];
  // Finite-difference step for the normal; too small and it turns to noise.
  const eps = 0.012;
  const bump = opts.type === 'rocky' ? 2.6 : opts.type === 'martian' ? 1.7 : opts.type === 'gas' ? 0.55 : 0.8;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const nx = (x + 0.5 - cx) / R;
      const ny = (y + 0.5 - cy) / R;
      const r2 = nx * nx + ny * ny;
      if (r2 >= 1) continue; // outside the globe; glow is drawn separately

      const nz = Math.sqrt(1 - r2);

      // Spherical coordinates for this point on the visible hemisphere.
      const lat = Math.asin(Math.max(-1, Math.min(1, ny)));
      const lon = Math.atan2(nx, nz);

      const hC = surface(lon, lat);
      const hX = surface(lon + eps, lat);
      const hY = surface(lon, lat + eps);

      // Perturb the sphere normal by the surface gradient.
      let vx = nx - (hX - hC) * bump;
      let vy = ny - (hY - hC) * bump;
      let vz = nz;
      const len = Math.hypot(vx, vy, vz) || 1;
      vx /= len;
      vy /= len;
      vz /= len;

      const diffuse = Math.max(0, vx * LX + vy * LY + vz * LZ);
      // Limb darkening: the classic astronomical falloff toward the edge.
      const limb = Math.pow(nz, 0.42);

      let [r, g, b] = ramp(palette, hC);

      // Polar caps: CO2 frost, with a ragged edge rather than a drawn circle.
      if (opts.type === 'martian') {
        const edge = 1.16 + (detail(lon * 3.4, lat * 3.4) - 0.5) * 0.34;
        const cap = (Math.abs(lat) - edge * 0.58) / 0.34;
        if (cap > 0) {
          [r, g, b] = mix([r, g, b], [238, 235, 230], Math.min(1, cap) * 0.95);
        }
        // Thin haze of suspended dust over everything.
        [r, g, b] = mix([r, g, b], [206, 150, 110], 0.1);
      }

      // Terran worlds get a cloud deck over the surface, not baked into it.
      if (opts.type === 'terran') {
        const cloud = Math.max(0, detail(lon * 2.6 + 11, lat * 2.6) - 0.46) / 0.54;
        const cover = Math.pow(cloud, 0.8) * 0.85;
        [r, g, b] = mix([r, g, b], [236, 240, 246], cover);
      }

      const light = ambient + diffuse * 1.06;
      r = r * light * limb;
      g = g * light * limb;
      b = b * light * limb;

      // Atmospheric scattering: a rim that brightens toward the limb, but
      // only where the limb is actually lit.
      if (opts.atmosphere) {
        const rim = Math.pow(1 - nz, 3.2);
        const lit = Math.max(0, nx * LX + ny * LY + nz * LZ);
        const k = rim * (0.35 + lit * 1.5) * 1.5;
        r += opts.atmosphere[0] * k;
        g += opts.atmosphere[1] * k;
        b += opts.atmosphere[2] * k;
      }

      // Antialias the silhouette over the last pixel of radius.
      const edge = Math.min(1, (1 - Math.sqrt(r2)) * R);

      data[idx] = Math.min(255, r);
      data[idx + 1] = Math.min(255, g);
      data[idx + 2] = Math.min(255, b);
      data[idx + 3] = 255 * edge;
    }
  }

  ctx.putImageData(img, 0, 0);

  // Outer atmospheric halo, drawn on top of the globe's own rim.
  if (opts.atmosphere) {
    const [ar, ag, ab] = opts.atmosphere;
    ctx.globalCompositeOperation = 'lighter';
    const halo = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.16);
    halo.addColorStop(0, `rgba(${ar | 0}, ${ag | 0}, ${ab | 0}, 0.30)`);
    halo.addColorStop(1, `rgba(${ar | 0}, ${ag | 0}, ${ab | 0}, 0)`);
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = 'source-over';
  }

  if (opts.ring) return withRing(canvas, opts, R);
  return canvas;
}

/**
 * Draws a banded ring system around an already-rendered globe.
 *
 * The back half goes behind the planet and the front half in front, with the
 * planet's shadow falling across the front arc — without that the ring looks
 * like a decal.
 */
function withRing(planet: HTMLCanvasElement, opts: PlanetOptions, R: number): HTMLCanvasElement {
  const ring = opts.ring!;
  const size = planet.width;
  const out = document.createElement('canvas');
  // Room for the ring, which reaches well beyond the globe.
  out.width = size * 1.9;
  out.height = size * 1.9;
  const ctx = out.getContext('2d')!;
  const cx = out.width / 2;
  const cy = out.height / 2;

  const rand = prng(opts.seed + 1201);
  const [rr, rg, rb] = ring.color;

  const drawArc = (from: number, to: number, shadow: boolean) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ring.tilt);
    // Many thin bands of varying opacity read as ring structure; one thick
    // stroke reads as a hoop.
    const bands = 46;
    for (let i = 0; i < bands; i++) {
      const t = i / bands;
      const rad = R * (ring.inner + (ring.outer - ring.inner) * t);
      const gap = rand();
      if (gap < 0.16) continue; // Cassini-style divisions
      const alpha = ring.opacity * (0.35 + rand() * 0.65) * (shadow ? 0.32 : 1);
      ctx.strokeStyle = `rgba(${rr | 0}, ${rg | 0}, ${rb | 0}, ${alpha.toFixed(3)})`;
      ctx.lineWidth = Math.max(0.6, (R * (ring.outer - ring.inner)) / bands);
      ctx.beginPath();
      ctx.ellipse(0, 0, rad, rad * 0.26, 0, from, to);
      ctx.stroke();
    }
    ctx.restore();
  };

  drawArc(Math.PI, Math.PI * 2, false); // behind
  ctx.drawImage(planet, cx - size / 2, cy - size / 2);
  drawArc(0, Math.PI, false); // in front

  // Planet shadow cast onto the front arc, on the side away from the light.
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.translate(cx + R * 0.35, cy + R * 0.42);
  ctx.rotate(ring.tilt);
  ctx.scale(1, 0.26);
  const shadow = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R * 1.25);
  shadow.addColorStop(0, 'rgba(0,0,0,0.75)');
  shadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.arc(0, 0, R * 1.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  return out;
}

export interface AsteroidOptions {
  seed: number;
  /** Fraction of the canvas the rock occupies. */
  fill?: number;
  ambient?: number;
  /** Surface brightness multiplier — foreground rock is darker than gravel. */
  albedo?: number;
}

/**
 * Renders a lumpy, cratered rock.
 *
 * Same idea as the globe, but the silhouette itself is noise-displaced, so
 * the outline is irregular and the surface still shades as a solid volume.
 */
export function renderAsteroid(size: number, opts: AsteroidOptions): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const data = img.data;

  const fill = opts.fill ?? 0.84;
  const R = (size / 2) * fill;
  const cx = size / 2;
  const cy = size / 2;
  const ambient = opts.ambient ?? 0.03;
  const albedo = opts.albedo ?? 1;

  const shapeNoise = makeFbm(opts.seed + 55, 3, 32);
  const fbm = makeFbm(opts.seed, 5, 64);
  const detail = makeFbm(opts.seed + 4211, 4, 64);
  const rand = prng(opts.seed + 88);

  const craters: { a: number; d: number; r: number; depth: number }[] = [];
  for (let i = 0; i < 18; i++) {
    craters.push({
      a: rand() * Math.PI * 2,
      d: rand() * 0.9,
      r: 0.06 + Math.pow(rand(), 2.2) * 0.26,
      depth: 0.4 + rand() * 0.6,
    });
  }

  /** Silhouette radius at a given angle — this is what makes it not a circle. */
  const shape = (a: number) => 0.68 + shapeNoise(Math.cos(a) * 1.6 + 3, Math.sin(a) * 1.6 + 3) * 0.5;

  const height = (u: number, v: number) => {
    let h = fbm(u * 2.6 + 5, v * 2.6 + 5) * 0.62 + detail(u * 8, v * 8) * 0.38;
    for (const c of craters) {
      const cxp = Math.cos(c.a) * c.d;
      const cyp = Math.sin(c.a) * c.d;
      if (Math.abs(v - cyp) > c.r || Math.abs(u - cxp) > c.r) continue;
      const d = Math.hypot(u - cxp, v - cyp);
      if (d < c.r) {
        const t = d / c.r;
        const rim = Math.exp(-Math.pow((t - 0.8) / 0.18, 2)) * 0.45;
        const floor = -(1 - Math.pow(t / 0.8, 2)) * c.depth * 0.4;
        h += (t < 0.8 ? floor : 0) + rim * c.depth;
      }
    }
    return h;
  };

  const eps = 0.02;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const nx = (x + 0.5 - cx) / R;
      const ny = (y + 0.5 - cy) / R;
      const dist = Math.hypot(nx, ny);
      const a = Math.atan2(ny, nx);
      const edgeR = shape(a);
      if (dist >= edgeR) continue;

      // Fake a rounded body: treat the normalised distance as a hemisphere.
      const t = dist / edgeR;
      const nz = Math.sqrt(Math.max(0.0001, 1 - t * t));

      const hC = height(nx, ny);
      const hX = height(nx + eps, ny);
      const hY = height(nx, ny + eps);

      let vx = nx / edgeR - (hX - hC) * 5.5;
      let vy = ny / edgeR - (hY - hC) * 5.5;
      let vz = nz;
      const len = Math.hypot(vx, vy, vz) || 1;
      vx /= len;
      vy /= len;
      vz /= len;

      const diffuse = Math.max(0, vx * LX + vy * LY + vz * LZ);
      const limb = Math.pow(nz, 0.3);
      // Regolith is a narrow, desaturated value range.
      const base = (74 + hC * 108) * albedo;
      const light = ambient + diffuse * 1.1;

      const edge = Math.min(1, (edgeR - dist) * R);
      data[idx] = Math.min(255, base * light * limb * 1.04);
      data[idx + 1] = Math.min(255, base * light * limb * 0.95);
      data[idx + 2] = Math.min(255, base * light * limb * 0.84);
      data[idx + 3] = 255 * edge;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Fine luminance grain — photographs have it, clean renders do not. */
export function renderGrain(size: number, seed: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const rand = prng(seed);
  for (let i = 0; i < size * size; i++) {
    const v = 128 + (rand() - 0.5) * 255;
    const idx = i * 4;
    img.data[idx] = v;
    img.data[idx + 1] = v;
    img.data[idx + 2] = v;
    img.data[idx + 3] = 22;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
