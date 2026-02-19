import * as THREE from 'three';

interface Cloud {
  layers: THREE.Mesh[];
  speed: number;
  baseOpacity: number;
  phase: number;
  baseY: number;
}

export class Clouds {
  private clouds: Cloud[] = [];
  private time = 0;
  private baseGeometry: THREE.PlaneGeometry;
  private textureCache: Map<number, THREE.CanvasTexture> = new Map();
  private lastDayTimeBand: 'dawn' | 'day' | 'sunset' | 'night' | null = null;

  constructor(scene: THREE.Scene) {
    // Create single shared base geometry
    this.baseGeometry = new THREE.PlaneGeometry(1, 1);

    const cloudCount = 10;
    const positions = this.generateCloudPositions(cloudCount);

    for (const pos of positions) {
      const layerCount = 2 + Math.floor(Math.random() * 2); // 2-3 layers per cloud
      const baseWidth = 35 + Math.random() * 25;
      const baseHeight = 10 + Math.random() * 8;
      const layers: THREE.Mesh[] = [];

      for (let l = 0; l < layerCount; l++) {
        const canvasTexture = this.getOrCreateCloudTexture(l);
        // Each layer slightly different size and offset
        const scale = 1.0 - l * 0.15;
        const material = new THREE.MeshBasicMaterial({
          map: canvasTexture,
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(this.baseGeometry, material);
        mesh.scale.set(baseWidth * scale, baseHeight * scale, 1);
        mesh.position.set(
          pos.x + (Math.random() - 0.5) * 4,
          pos.y + l * 1.8, // Stack layers vertically
          pos.z + (Math.random() - 0.5) * 3
        );
        mesh.rotation.x = -Math.PI / 3;
        // Slight random rotation per layer for volume
        mesh.rotation.z = (Math.random() - 0.5) * 0.15;

        layers.push(mesh);
        scene.add(mesh);
      }

      this.clouds.push({
        layers,
        speed: 0.5 + Math.random() * 0.7,
        baseOpacity: 0.2 + Math.random() * 0.15,
        phase: Math.random() * Math.PI * 2,
        baseY: pos.y,
      });
    }
  }

  private generateCloudPositions(count: number): Array<{ x: number; y: number; z: number }> {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 40 + Math.random() * 60;
      positions.push({
        x: Math.cos(angle) * radius + (Math.random() - 0.5) * 30,
        y: 35 + Math.random() * 25,
        z: Math.sin(angle) * radius + (Math.random() - 0.5) * 30,
      });
    }
    return positions;
  }

  private getOrCreateCloudTexture(layerIndex: number): THREE.CanvasTexture {
    // Return cached texture if available
    if (this.textureCache.has(layerIndex)) {
      return this.textureCache.get(layerIndex)!;
    }

    // Create and cache new texture
    const texture = this.createCloudTexture(layerIndex);
    this.textureCache.set(layerIndex, texture);
    return texture;
  }

  private createCloudTexture(layerIndex: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // More blob variety per layer
    const blobCount = 3 + layerIndex;
    for (let b = 0; b < blobCount; b++) {
      const cx = 40 + Math.random() * 180;
      const cy = 30 + Math.random() * 60;
      const r = 20 + Math.random() * 40;

      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(255, 255, 255, ${0.7 + Math.random() * 0.3})`);
      g.addColorStop(0.4, `rgba(255, 255, 255, ${0.3 + Math.random() * 0.2})`);
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return new THREE.CanvasTexture(canvas);
  }

  update(delta: number, dayTime: number): void {
    this.time += delta;

    // Night amount (0 at day, peaks at night)
    const nightAmount = Math.max(0, Math.sin(dayTime * Math.PI * 2 - Math.PI / 2)) * 0.5;

    // Sunset detection: dayTime around 0.15-0.25 and 0.75-0.85
    const sunsetAmount = Math.max(
      0,
      1 - Math.abs(dayTime - 0.2) * 8, // evening
      1 - Math.abs(dayTime - 0.8) * 8  // morning
    );

    // Determine current dayTime band to throttle color updates
    let currentBand: 'dawn' | 'day' | 'sunset' | 'night';
    if (sunsetAmount > 0.05) {
      currentBand = 'sunset';
    } else if (nightAmount > 0.1) {
      currentBand = 'night';
    } else if (dayTime < 0.25 || dayTime > 0.75) {
      currentBand = 'dawn';
    } else {
      currentBand = 'day';
    }

    // Only compute color values if band changed
    const colorChanged = this.lastDayTimeBand !== currentBand;
    this.lastDayTimeBand = currentBand;

    for (const cloud of this.clouds) {
      // Drift all layers together
      for (const layer of cloud.layers) {
        layer.position.x += cloud.speed * delta;

        if (layer.position.x > 150) {
          layer.position.x -= 300;
        }
      }

      // Calculate opacity (always update as it animates per frame)
      let opacity = cloud.baseOpacity * (0.8 + 0.2 * Math.sin(this.time * 0.3 + cloud.phase));
      opacity *= 1 - nightAmount * 0.7;

      // Apply to all layers (bottom layers slightly more opaque)
      for (let l = 0; l < cloud.layers.length; l++) {
        const material = cloud.layers[l].material as THREE.MeshBasicMaterial;
        material.opacity = opacity * (1.0 - l * 0.15);

        // Only update color if dayTime band changed
        if (colorChanged) {
          // Sunset golden tint
          if (sunsetAmount > 0.05) {
            const r = 1.0;
            const g = 0.85 + (1 - sunsetAmount) * 0.15;
            const b = 0.7 + (1 - sunsetAmount) * 0.3;
            material.color.setRGB(r, g, b);
          } else if (nightAmount > 0.1) {
            // Night: slight blue-gray tint
            material.color.setRGB(0.7, 0.72, 0.8);
          } else {
            material.color.setRGB(1, 1, 1);
          }
        }
      }
    }
  }
}
