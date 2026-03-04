import * as THREE from 'three';

export type StoneType = 'sandstone' | 'limestone' | 'granite';

const TEXTURE_SIZE = 256;

export class TextureFactory {
  private static textureCache: Map<StoneType, THREE.CanvasTexture> = new Map();
  private static normalMapCache: Map<StoneType, THREE.CanvasTexture> = new Map();

  // Value noise using hashed grid points — no external library needed
  private static noise2D(x: number, y: number): number {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const hash = (a: number, b: number): number => {
      let h = a * 374761393 + b * 668265263;
      h = (h ^ (h >> 13)) * 1274126177;
      return (h ^ (h >> 16)) / 2147483648;
    };
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const n00 = hash(ix, iy), n10 = hash(ix + 1, iy);
    const n01 = hash(ix, iy + 1), n11 = hash(ix + 1, iy + 1);
    return n00 + (n10 - n00) * sx + (n01 - n00) * sy + (n00 - n10 - n01 + n11) * sx * sy;
  }

  // Layered octave noise for richer variation
  private static fbm(x: number, y: number, octaves: number, amplitude: number, frequency: number): number {
    let value = 0;
    let amp = amplitude;
    let freq = frequency;
    for (let i = 0; i < octaves; i++) {
      value += TextureFactory.noise2D(x * freq, y * freq) * amp;
      amp *= 0.5;
      freq *= 2.0;
    }
    return value;
  }

  private static createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = TEXTURE_SIZE;
    canvas.height = TEXTURE_SIZE;
    return canvas;
  }

  private static makeTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private static makeNormalTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    // Normal maps should NOT be in sRGB — they encode linear direction vectors
    return texture;
  }

  // --- Sandstone: tan base, layered noise, small dark pores, wavy horizontal grain ---
  private static generateSandstone(): THREE.CanvasTexture {
    const canvas = TextureFactory.createCanvas();
    const ctx = canvas.getContext('2d')!;
    const size = TEXTURE_SIZE;

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    // Base color: tan #d4b896 = rgb(212, 184, 150)
    const baseR = 212, baseG = 184, baseB = 150;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / size;
        const ny = y / size;

        // Multi-octave noise for surface variation
        const noise = TextureFactory.fbm(nx * 8, ny * 8, 4, 0.35, 1.0);

        // Horizontal grain lines with slight waviness
        const waveOffset = TextureFactory.noise2D(nx * 3, ny * 0.5) * 0.08;
        const grainY = ny + waveOffset;
        const grain = Math.sin(grainY * size * 0.8) * 0.04
                    + Math.sin(grainY * size * 0.3 + 1.2) * 0.03;

        const brightness = 1.0 + noise + grain;

        let r = Math.round(baseR * brightness);
        let g = Math.round(baseG * brightness);
        let b = Math.round(baseB * brightness);

        const idx = (y * size + x) * 4;
        data[idx]     = Math.max(0, Math.min(255, r));
        data[idx + 1] = Math.max(0, Math.min(255, g));
        data[idx + 2] = Math.max(0, Math.min(255, b));
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Scatter small dark pores (2-3px circles) — ~1.5% density
    const poreCount = Math.floor(size * size * 0.015);
    // Use a seeded sequence derived from Math.sin to keep pores deterministic
    for (let i = 0; i < poreCount; i++) {
      const px = Math.abs(Math.sin(i * 127.1 + 1.0)) * size;
      const py = Math.abs(Math.sin(i * 311.7 + 2.0)) * size;
      const pr = 1 + Math.abs(Math.sin(i * 74.3)) * 1.5; // 1-2.5 px radius

      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(80, 55, 30, 0.45)';
      ctx.fill();
    }

    return TextureFactory.makeTexture(canvas);
  }

  // --- Limestone: light cream base, horizontal striations, smoother than sandstone ---
  private static generateLimestone(): THREE.CanvasTexture {
    const canvas = TextureFactory.createCanvas();
    const ctx = canvas.getContext('2d')!;
    const size = TEXTURE_SIZE;

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    // Base color: light cream #e8dcc8 = rgb(232, 220, 200)
    const baseR = 232, baseG = 220, baseB = 200;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / size;
        const ny = y / size;

        // Smoother noise — fewer octaves, lower amplitude than sandstone
        const noise = TextureFactory.fbm(nx * 6, ny * 6, 3, 0.15, 1.0);

        // Horizontal striations at varying intervals — low opacity effect via brightness
        // Several striation layers at different frequencies
        const striation1 = Math.sin(ny * size * 0.5) * 0.025;
        const striation2 = Math.sin(ny * size * 0.18 + 0.7) * 0.018;
        const striation3 = Math.sin(ny * size * 0.08 + 1.4) * 0.012;

        // Slight horizontal variation in tone
        const lateralVar = TextureFactory.noise2D(nx * 12, ny * 2) * 0.06;

        const brightness = 1.0 + noise + striation1 + striation2 + striation3 + lateralVar;

        let r = Math.round(baseR * brightness);
        let g = Math.round(baseG * brightness);
        let b = Math.round(baseB * brightness);

        const idx = (y * size + x) * 4;
        data[idx]     = Math.max(0, Math.min(255, r));
        data[idx + 1] = Math.max(0, Math.min(255, g));
        data[idx + 2] = Math.max(0, Math.min(255, b));
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    return TextureFactory.makeTexture(canvas);
  }

  // --- Granite: dark grey base, bright crystal speckles, subtle color patches ---
  private static generateGranite(): THREE.CanvasTexture {
    const canvas = TextureFactory.createCanvas();
    const ctx = canvas.getContext('2d')!;
    const size = TEXTURE_SIZE;

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    // Base color: dark grey #4a4a4a = rgb(74, 74, 74)
    const baseR = 74, baseG = 74, baseB = 74;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / size;
        const ny = y / size;

        // Subtle large-scale color variation patches
        const patch = TextureFactory.fbm(nx * 3, ny * 3, 2, 0.2, 1.0);

        // Finer noise for surface texture
        const detail = TextureFactory.fbm(nx * 12, ny * 12, 2, 0.08, 1.0);

        // Very slight color tint variation in the patches (warmer/cooler patches)
        const tintR = TextureFactory.noise2D(nx * 2.5, ny * 2.5) * 0.12;
        const tintB = TextureFactory.noise2D(nx * 2.5 + 50, ny * 2.5 + 50) * 0.10;

        const brightness = 1.0 + patch + detail;

        let r = Math.round(baseR * (brightness + tintR));
        let g = Math.round(baseG * brightness);
        let b = Math.round(baseB * (brightness + tintB));

        const idx = (y * size + x) * 4;
        data[idx]     = Math.max(0, Math.min(255, r));
        data[idx + 1] = Math.max(0, Math.min(255, g));
        data[idx + 2] = Math.max(0, Math.min(255, b));
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Crystal speckles at ~3% density — white and pinkish dots (1-2px)
    const speckleCount = Math.floor(size * size * 0.03);
    for (let i = 0; i < speckleCount; i++) {
      const sx = Math.abs(Math.sin(i * 193.1 + 3.0)) * size;
      const sy = Math.abs(Math.sin(i * 257.3 + 5.0)) * size;
      const sr = 0.5 + Math.abs(Math.sin(i * 89.7)) * 1.0; // 0.5-1.5 px radius

      // Alternate between white and pinkish crystals
      const isPink = (i % 5 === 0);
      if (isPink) {
        ctx.fillStyle = 'rgba(230, 180, 200, 0.9)';
      } else {
        ctx.fillStyle = 'rgba(240, 240, 245, 0.95)';
      }

      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    return TextureFactory.makeTexture(canvas);
  }

  // --- Normal map generation using Sobel-like derivatives of source brightness ---
  static generateNormalMap(sourceCanvas: HTMLCanvasElement): THREE.CanvasTexture {
    const size = TEXTURE_SIZE;
    const ctx = sourceCanvas.getContext('2d')!;
    const srcData = ctx.getImageData(0, 0, size, size).data;

    // Extract brightness (luminance) from source pixels
    const brightness = new Float32Array(size * size);
    for (let i = 0; i < size * size; i++) {
      const r = srcData[i * 4]     / 255;
      const g = srcData[i * 4 + 1] / 255;
      const b = srcData[i * 4 + 2] / 255;
      // Standard luminance weights
      brightness[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    const normalCanvas = TextureFactory.createCanvas();
    const normalCtx = normalCanvas.getContext('2d')!;
    const normalData = normalCtx.createImageData(size, size);
    const nd = normalData.data;

    const sample = (x: number, y: number): number => {
      // Clamp to edges for border pixels
      const cx = Math.max(0, Math.min(size - 1, x));
      const cy = Math.max(0, Math.min(size - 1, y));
      return brightness[cy * size + cx];
    };

    // Sobel kernel strength — controls how "bumpy" the normal map appears
    const strength = 4.0;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Sobel X (horizontal derivative)
        const dX = (
          -sample(x - 1, y - 1) - 2 * sample(x - 1, y) - sample(x - 1, y + 1) +
           sample(x + 1, y - 1) + 2 * sample(x + 1, y) + sample(x + 1, y + 1)
        ) * strength;

        // Sobel Y (vertical derivative)
        const dY = (
          -sample(x - 1, y - 1) - 2 * sample(x, y - 1) - sample(x + 1, y - 1) +
           sample(x - 1, y + 1) + 2 * sample(x, y + 1) + sample(x + 1, y + 1)
        ) * strength;

        // Reconstruct normal and normalise: Z points outward (away from surface)
        const len = Math.sqrt(dX * dX + dY * dY + 1.0);
        const nx = -dX / len; // flip sign so bright areas read as raised
        const ny = -dY / len;
        const nz = 1.0 / len;

        // Encode into [0, 255]: flat normal (0,0,1) -> (128, 128, 255)
        const idx = (y * size + x) * 4;
        nd[idx]     = Math.round((nx * 0.5 + 0.5) * 255);
        nd[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
        nd[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
        nd[idx + 3] = 255;
      }
    }

    normalCtx.putImageData(normalData, 0, 0);
    return TextureFactory.makeNormalTexture(normalCanvas);
  }

  // --- Public API ---

  static getTexture(type: StoneType): THREE.CanvasTexture {
    const cached = TextureFactory.textureCache.get(type);
    if (cached) return cached;

    let texture: THREE.CanvasTexture;
    switch (type) {
      case 'sandstone':
        texture = TextureFactory.generateSandstone();
        break;
      case 'limestone':
        texture = TextureFactory.generateLimestone();
        break;
      case 'granite':
        texture = TextureFactory.generateGranite();
        break;
    }

    TextureFactory.textureCache.set(type, texture);
    return texture;
  }

  static getNormalMap(type: StoneType): THREE.CanvasTexture {
    const cached = TextureFactory.normalMapCache.get(type);
    if (cached) return cached;

    // Obtain the diffuse canvas by rendering the texture to a temporary canvas
    // We need to read the source pixels, so re-generate a canvas for the normal map input.
    const sourceCanvas = TextureFactory.createCanvas();
    const ctx = sourceCanvas.getContext('2d')!;

    // Draw the already-generated diffuse texture onto a temp canvas to get pixel data
    // CanvasTexture stores its source as `.image` (the original HTMLCanvasElement)
    const diffuseTexture = TextureFactory.getTexture(type);
    const sourceImage = diffuseTexture.image as HTMLCanvasElement;
    ctx.drawImage(sourceImage, 0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

    const normalMap = TextureFactory.generateNormalMap(sourceCanvas);
    TextureFactory.normalMapCache.set(type, normalMap);
    return normalMap;
  }

  // Dispose all cached textures (call on scene teardown)
  static dispose(): void {
    for (const texture of TextureFactory.textureCache.values()) {
      texture.dispose();
    }
    for (const texture of TextureFactory.normalMapCache.values()) {
      texture.dispose();
    }
    TextureFactory.textureCache.clear();
    TextureFactory.normalMapCache.clear();
  }
}
