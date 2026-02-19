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
      const geometry = new THREE.PlaneGeometry(32, 16);
      const material = new THREE.MeshBasicMaterial({
        map: canvasTexture,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.rotation.x = -Math.PI / 2; // Face downward as billboard from above

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
      // Spread evenly across x/z with +- 80 range, y between 75-95
      const angle = (i / count) * Math.PI * 2;
      const radius = 60 + Math.random() * 20; // Spread across region
      positions.push({
        x: Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
        y: 75 + Math.random() * 20, // y: 75-95
        z: Math.sin(angle) * radius + (Math.random() - 0.5) * 20,
      });
    }
    return positions;
  }

  private createCloudTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill with transparent background
    ctx.fillStyle = 'rgba(255, 255, 255, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Two overlapping radial gradients for irregular cloud shape
    const gradient1 = ctx.createRadialGradient(40, 32, 0, 40, 32, 28);
    gradient1.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient1.addColorStop(0.7, 'rgba(255, 255, 255, 0.4)');
    gradient1.addColorStop(1, 'rgba(255, 255, 255, 0)');

    const gradient2 = ctx.createRadialGradient(88, 32, 0, 88, 32, 24);
    gradient2.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient2.addColorStop(0.8, 'rgba(255, 255, 255, 0.3)');
    gradient2.addColorStop(1, 'rgba(255, 255, 255, 0)');

    // Draw first gradient blob
    ctx.fillStyle = gradient1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw second gradient blob
    ctx.fillStyle = gradient2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
