import * as THREE from 'three';

interface Cloud {
  mesh: THREE.Mesh;
  speed: number;
  baseOpacity: number;
  phase: number;
}

export class Clouds {
  private clouds: Cloud[] = [];
  private time = 0;

  constructor(scene: THREE.Scene) {
    const cloudCount = 8;
    const positions = this.generateCloudPositions(cloudCount);

    for (const pos of positions) {
      const canvasTexture = this.createCloudTexture();
      const geometry = new THREE.PlaneGeometry(40 + Math.random() * 20, 12 + Math.random() * 8);
      const material = new THREE.MeshBasicMaterial({
        map: canvasTexture,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(pos.x, pos.y, pos.z);
      // Tilt slightly toward horizontal so visible from ground perspective
      mesh.rotation.x = -Math.PI / 3;

      const cloud: Cloud = {
        mesh,
        speed: 0.5 + Math.random() * 0.7, // 0.5-1.2
        baseOpacity: 0.25 + Math.random() * 0.15, // 0.25-0.4
        phase: Math.random() * Math.PI * 2,
      };

      this.clouds.push(cloud);
      scene.add(mesh);
    }
  }

  private generateCloudPositions(count: number): Array<{ x: number; y: number; z: number }> {
    const positions = [];
    for (let i = 0; i < count; i++) {
      // Spread across sky at heights visible from camera (camera at y=25)
      const angle = (i / count) * Math.PI * 2;
      const radius = 40 + Math.random() * 60;
      positions.push({
        x: Math.cos(angle) * radius + (Math.random() - 0.5) * 30,
        y: 35 + Math.random() * 25, // y: 35-60 — visible from ground
        z: Math.sin(angle) * radius + (Math.random() - 0.5) * 30,
      });
    }
    return positions;
  }

  private createCloudTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Three overlapping radial gradients for natural fluffy shape
    const blobs = [
      { cx: 80, cy: 64, r: 50 },
      { cx: 160, cy: 58, r: 44 },
      { cx: 120, cy: 70, r: 38 },
    ];
    for (const b of blobs) {
      const g = ctx.createRadialGradient(b.cx, b.cy, 0, b.cx, b.cy, b.r);
      g.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      g.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  update(delta: number, dayTime: number): void {
    this.time += delta;

    // Calculate night amount (0 at day, 0.5 at night)
    const nightAmount = Math.max(0, Math.sin(dayTime * Math.PI * 2 - Math.PI / 2)) * 0.5;

    for (const cloud of this.clouds) {
      // Drift clouds on X axis
      cloud.mesh.position.x += cloud.speed * delta;

      // Wrap at x > 150 back to -150
      if (cloud.mesh.position.x > 150) {
        cloud.mesh.position.x = -150;
      }

      // Modulate opacity: baseOpacity * (0.8 + 0.2*sin(time*0.3 + phase))
      let opacity = cloud.baseOpacity * (0.8 + 0.2 * Math.sin(this.time * 0.3 + cloud.phase));

      // At night: reduce opacity by nightAmount * 0.7
      opacity *= 1 - nightAmount * 0.7;

      const material = cloud.mesh.material as THREE.MeshBasicMaterial;
      material.opacity = opacity;
    }
  }
}
