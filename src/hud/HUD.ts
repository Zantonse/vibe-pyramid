import * as THREE from 'three';

interface FloatingText {
  sprite: THREE.Sprite;
  lifetime: number;
  age: number;
  startY: number;
}

export class HUD {
  private scene: THREE.Scene;
  private xpSprite: THREE.Sprite | null = null;
  private floatingTexts: FloatingText[] = [];
  private sessionLabels: Map<string, THREE.Sprite> = new Map();
  private totalXp = 0;
  private blocksPlaced = 0;
  private totalSlots = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createXPCounter();
  }

  private createXPCounter(): void {
    this.xpSprite = this.createTextSprite('Blocks: 0 / 0', 512, 64, 28, '#f5deb3', '#3e2723');
    this.xpSprite.position.set(12, 12, 0);
    this.xpSprite.scale.set(8, 1, 1);
    this.scene.add(this.xpSprite);
  }

  updateXP(totalXp: number, blocksPlaced: number, totalSlots: number): void {
    this.totalXp = totalXp;
    this.blocksPlaced = blocksPlaced;
    this.totalSlots = totalSlots;

    if (this.xpSprite) {
      this.scene.remove(this.xpSprite);
      this.xpSprite.material.dispose();
    }
    this.xpSprite = this.createTextSprite(
      `Blocks: ${blocksPlaced.toLocaleString()} / ${totalSlots.toLocaleString()}  |  XP: ${totalXp.toLocaleString()}`,
      512, 64, 24, '#f5deb3', '#3e2723'
    );
    this.xpSprite.position.set(12, 12, 0);
    this.xpSprite.scale.set(8, 1, 1);
    this.scene.add(this.xpSprite);
  }

  showActivityText(label: string, xpEarned: number): void {
    const text = `+${xpEarned} XP  ${label}`;
    const sprite = this.createTextSprite(text, 512, 48, 20, '#ffcc00', 'transparent');
    const x = -5 + Math.random() * 10;
    const startY = 14;
    sprite.position.set(x, startY, -5 + Math.random() * 10);
    sprite.scale.set(6, 0.6, 1);
    this.scene.add(sprite);

    this.floatingTexts.push({
      sprite,
      lifetime: 3,
      age: 0,
      startY,
    });
  }

  updateSessionLabel(sessionId: string, name: string, status: string): void {
    console.log(`Session ${name} (${sessionId.slice(0, 8)}): ${status}`);
  }

  update(delta: number): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.age += delta;

      if (ft.age >= ft.lifetime) {
        this.scene.remove(ft.sprite);
        ft.sprite.material.dispose();
        this.floatingTexts.splice(i, 1);
        continue;
      }

      const t = ft.age / ft.lifetime;
      ft.sprite.position.y = ft.startY + t * 3;
      (ft.sprite.material as THREE.SpriteMaterial).opacity = 1 - t;
    }
  }

  private createTextSprite(
    text: string,
    width: number,
    height: number,
    fontSize: number,
    textColor: string,
    bgColor: string
  ): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.roundRect(0, 0, width, height, 8);
      ctx.fill();
    }

    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });

    return new THREE.Sprite(material);
  }
}
